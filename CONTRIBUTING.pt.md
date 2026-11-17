# Como contribuir — Atelier de verificare

[English](CONTRIBUTING.md) · [Română](CONTRIBUTING.ro.md) · [Français](CONTRIBUTING.fr.md) · [Italiano](CONTRIBUTING.it.md) · [Español](CONTRIBUTING.es.md) · **Português** · [Deutsch](CONTRIBUTING.de.md) · [Magyar](CONTRIBUTING.hu.md)

Versão: 0.2.0 · Última atualização: 2026-11-17

1. Faça um fork deste repositório.
2. Copie `data/checks/example.json` para `data/checks/<id>.json` e edite-o (esquema em `schema.json`), depois execute `python scripts/validate.py`.
3. Escreva `checks/<id>.js` (veja `docs/check-api.md`): um módulo ES que exporta `async function run(input, ctx)` e devolve constatações codificadas.
4. Acrescente os textos da verificação e de cada código de constatação nos oito idiomas em `src/i18n.mjs`.
5. Escreva testes em `test/`, execute `npm test` e `node scripts/build.mjs`, e abra um pull request.

## Regras

- Uma verificação = um descritor (`data/checks/<id>.json`) + um plugin (`checks/<id>.js`) + testes.
- Cite sempre uma fonte.
- Contribua apenas com material que possa partilhar legalmente (sem texto protegido copiado).
- Seja gentil: veja o Código de Conduta.

## Acrescentar uma verificação

1. Acrescente `data/checks/<id>.json` (parta de `data/checks/example.json`; esquema em `schema.json`) e execute `python scripts/validate.py`. O `id`, o nome do ficheiro e o nome do plugin têm de coincidir.
2. Escreva `checks/<id>.js` como módulo ES (sintaxe ES2017, sem imports) que exporta `async function run(input, ctx)` e devolve `ctx.lib.result(findings, data, artifacts)`. Cada constatação é `ctx.lib.finding(code, level, args)`, com `level` entre `ok`, `info`, `warn` ou `fail` e `args` uma lista de cadeias ou números. Nunca ponha frases numa constatação: o código é a mensagem (veja `docs/check-api.md`).
3. Acrescente os textos em `src/i18n.mjs` nos oito idiomas: `c_<id>_name`, `c_<id>_desc` e `f_<código com os pontos trocados por sublinhados>` para cada código. `npm test` falha se a um idioma faltar uma chave ou se um código não tiver texto.
4. Uma verificação que precisa da rede define `"offline": false` e enumera cada anfitrião em `"network"`; acrescente as mesmas origens a `connect` em `src/app.json`, chame apenas `ctx.net.json(url)` e diga na descrição o que é enviado. Prefira uma verificação que funcione offline: um anfitrião novo precisa de uma razão no pull request.
5. Escreva testes em `test/` com amostras geradas ou de domínio público (nunca fotografias de pessoas reais) e execute `npm test`.
6. Execute `node scripts/build.mjs` e faça commit de `index.html`, `sw.js` e `app.json` regenerados juntamente com `src/`.
