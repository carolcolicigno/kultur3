# KULTUR3

Plataforma piloto de inteligencia cultural para publicidade, marcas, creator economy e comunicacao.

Esta versao pesquisa sob demanda com Gemini + Google Search, exibe as referencias retornadas pela busca, salva edicoes de curadoria e gera um texto pronto para copiar no WhatsApp ou Telegram.

## Rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Crie `.env.local` a partir de `.env.example` e configure a chave no servidor:

```bash
GEMINI_API_KEY=sua-chave
```

3. Rode o app:

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Variaveis principais

- `GEMINI_API_KEY`: chave server-only do Gemini. Nunca use prefixo `VITE_` para credenciais.
- `GEMINI_MODEL`: modelo usado para respostas estruturadas em JSON.
- `GEMINI_TEXT_MODEL`: modelo usado para respostas textuais.
- `PILOT_PASSWORD`: senha compartilhada do piloto. Em producao ela e obrigatoria e precisa ter pelo menos 16 caracteres. Usuario: `kultur3`.
- `PILOT_AUTH_LOCAL`: use `true` apenas se quiser exigir a senha tambem em desenvolvimento local.
- `DATA_DIR`: pasta persistente para historico de pesquisas e curadorias.

## Garantias desta versao

- A chave do Gemini fica no servidor, fora do bundle do navegador.
- Itens factuais de curadoria precisam manter uma URL retornada pela pesquisa original.
- Resultados sem referencias vinculadas nao sao publicados.
- Datas e trechos nao sao apresentados como verificados quando a API nao confirmou isso.
- O historico registra a ultima copia somente quando a acao de copiar para WhatsApp/Telegram acontece.

## Limites conhecidos

- A coleta ainda e sob demanda, nao automatica.
- O envio para WhatsApp/Telegram ainda e manual: o app formata o texto para copiar e colar.
- A senha compartilhada serve para piloto, nao substitui contas de clientes.
- O historico usa arquivo local em processo unico; para venda recorrente, o proximo passo e banco de dados, autenticacao por usuario, agenda diaria e jobs de entrega.

## Checks

```bash
npm run lint
npm test
npm run build
npm audit
```
