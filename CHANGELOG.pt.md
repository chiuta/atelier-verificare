# Registo de alterações

[English](CHANGELOG.md) · [Română](CHANGELOG.ro.md) · [Français](CHANGELOG.fr.md) · [Italiano](CHANGELOG.it.md) · [Español](CHANGELOG.es.md) · **Português** · [Deutsch](CHANGELOG.de.md) · [Magyar](CHANGELOG.hu.md)

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [SemVer](https://semver.org/).

## [Não lançado]

## [0.2.1] - 2026-11-20

### Alterado
- fff-kit 1.8.1: quando o navegador bloqueia o armazenamento ou não o tem (`localStorage`/`sessionStorage` lançam um erro ou não existem), a página arranca com um armazenamento temporário em memória em vez de parar; os dados não são mantidos depois de fechar a página.
- fff-kit 1.8.1: o guia que aumenta os controlos pequenos para 44 px mede agora também a largura do corpo da página e do elemento pai, pelo que uma fila de botões já não pode sair do ecrã (o grupo fica intacto quando o aumento o tornaria demasiado largo).

## [0.2.0] - 2026-11-17

### Adicionado
- Onze verificações funcionais: estrutura do ficheiro com SHA-256, inspetor EXIF, outros metadados incorporados (XMP, IPTC, texto PNG), leitor de Content Credentials (C2PA), análise do nível de erro para JPEG, metadados de vídeo, fotogramas-chave de vídeo, anatomia das ligações, higiene do texto, resumo DNS e pesquisa no Internet Archive (as duas últimas só a pedido, após o consentimento).
- Uma API comum das verificações (`docs/check-api.md`): constatações codificadas com quatro níveis, um descritor e um plugin por verificação, e uma rede e um canvas simulados para os testes.
- Vista do caso: acrescente ficheiros, ligações, domínios e texto arrastando, com o seletor de ficheiros ou colando; execute as verificações por elemento ou todas de uma vez; um relatório em Markdown, JSON ou impressão/PDF com a data, cada SHA-256 e os limites; uma secção sobre limites e ética (`docs/ethics.md`).
- Interface em oito idiomas (291 textos cada, verificados quanto às mesmas chaves e marcadores), temas escuro e claro, suporte para teclado e leitores de ecrã, disposição para telemóvel.
- A Content-Security-Policy enumera exatamente os três anfitriões usados pelas verificações de rede (`connect` em `src/app.json`); as verificações de rede ficam desativadas até o utilizador assinalar uma caixa de consentimento.
- Testes: `node --test` para analisadores, plugins, traduções e o contrato descritores/CSP; testes de navegador no hub (todos os idiomas, acessibilidade, ficheiros hostis, rede simulada).
- `src/`, `checks/` e `scripts/build.mjs`: o único `index.html` é agora construído a partir das fontes, e `--check` verifica-o.
- ISSUES_GOOD_FIRST e CODE_OF_CONDUCT traduzidos para as oito línguas.
- README em inglês, romeno, francês, italiano, espanhol, português, alemão e húngaro: secções de estado e de âmbito previsto (derivadas de `ISSUES_GOOD_FIRST.md`).
- Instalável (PWA): `manifest.webmanifest`, `sw.js` e os ícones são gerados pelo kit comum (`fff-kit/pwa`); a página funciona offline após a primeira visita por HTTPS.

### Alterado
- `data/checks/example.json` é agora o descritor modelo, e `docs/examples/my-check.js` o plugin modelo correspondente.
- `schema.json`: `input` aceita `file`, `image`, `video`, `url`, `domain` e `text` (sozinhos ou em lista), e `network` enumera os anfitriões de uma verificação que não é offline.
- `scripts/validate.py` verifica também que cada descritor tem o seu plugin, que o `id` corresponde ao nome do ficheiro e que cada anfitrião de rede está declarado em `src/app.json`.
- O workflow corre em Ubuntu 26.04 com Node.js 26 e executa também os testes e a verificação da compilação.

## [0.1.0] - 2026-11-13

### Adicionado
- Esqueleto inicial: estrutura, esquema de dados ou primeiros exemplos, guias de contribuição em oito línguas.
