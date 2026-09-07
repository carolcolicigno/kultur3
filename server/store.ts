import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Single-process pilot storage. Deploy with a persistent volume, never an ephemeral disk.
export class JsonStore<T extends { id: string }> {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private filename: string) {}
  async list(): Promise<T[]> {
    try { return JSON.parse(await readFile(this.filename, 'utf8')); }
    catch (error: any) { if (error.code === 'ENOENT') return []; throw error; }
  }
  put(item: T): Promise<void> {
    const job = this.queue.then(async () => {
      const items = await this.list();
      await mkdir(path.dirname(this.filename), { recursive: true, mode: 0o700 });
      const next = [item, ...items.filter(i => i.id !== item.id)].slice(0, 100);
      await writeFile(`${this.filename}.tmp`, JSON.stringify(next), { mode: 0o600 });
      await rename(`${this.filename}.tmp`, this.filename);
    });
    this.queue = job.catch(() => {});
    return job;
  }
}
