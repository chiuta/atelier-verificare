# Atelier de verificare

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · **Português** · [Deutsch](README.de.md) · [Magyar](README.hu.md)

Versão: 0.2.1 · Última atualização: 2026-11-22

🌐 https://atelier-verificare.chiuta.ro

> Kit de verificação local para jornalistas: proveniência de imagens, metadados, ligações e domínios.

Trade-free: sem rastreamento, sem anúncios, sem contas, funciona offline.

## Estado

Alfa, utilizável: onze verificações (nove offline, duas a pedido pela rede) funcionam no único ficheiro `index.html` (abre-se offline, sem servidor). Uma verificação é um descritor em `data/checks/` mais um plugin em `checks/`; o que estas verificações não podem provar está listado abaixo.

## O que faz

- Acrescente imagens, vídeos, ligações, domínios ou texto colado (arrastar e largar, seletor de ficheiros, colar) e execute as verificações em cada elemento; nada é enviado.
- Estrutura do ficheiro: o tipo real pelo conteúdo, a discordância com a extensão, as dimensões, os dados acrescentados após o fim do ficheiro, a qualidade JPEG estimada, a truncagem e um SHA-256 para poder demonstrar mais tarde que a cópia analisada é a que recebeu.
- Inspetor EXIF: câmara, objetiva, software (e se nomeia um editor de imagens), datas e fuso horário, uma modificação posterior à captura, posição GPS, miniatura incorporada e incoerências de tamanho, números de série.
- Outros metadados incorporados: XMP (ferramenta, histórico de edições, fonte de IA declarada), campos de imprensa IPTC, comentários JPEG e campos de texto PNG que correspondem ao resultado de geradores de imagens com IA.
- Content Credentials (C2PA): lê os manifestos (quem assinou, com quê, que ações, declarações sobre IA) em JPEG, PNG, WebP, MP4, MOV, HEIC e AVIF; lê-os, mas não valida as assinaturas.
- Análise do nível de erro para JPEG, com um mapa que pode guardar como PNG; metadados de vídeo (contentor, datas, localização guardada, assinaturas de recodificação); fotogramas-chave extraídos localmente para a pesquisa inversa de imagens.
- Anatomia das ligações (o truque do `@`, letras parecidas, endereços IP, encurtadores, parâmetros de rastreio) e higiene do texto (caracteres invisíveis, controlos de direção do texto, letras parecidas), sem abrir nada.
- Duas verificações opcionais pela rede, só depois de assinalar uma caixa de consentimento e premir o respetivo botão: um resumo DNS de dois resolvedores públicos (envia o nome de domínio para `cloudflare-dns.com` e `dns.google`) e uma pesquisa no Internet Archive (envia o endereço para `archive.org`). As ligações para guardar ou ver cópias arquivadas são ligações normais que abre você mesmo.
- Um relatório de todo o caso em Markdown, JSON ou impressão/PDF, no idioma da interface, com a data, o SHA-256 de cada ficheiro, cada constatação e os limites do método.
- Interface em oito idiomas, temas escuro e claro, suporte para teclado e leitores de ecrã, disposição para telemóvel; sem rastreio, sem contas.
- Instalável como aplicação e disponível offline após a primeira visita quando servida por HTTPS (um service worker guarda a própria página; as verificações opcionais pela rede descritas acima são os únicos pedidos que a página faz, e o service worker nunca lhes toca). Aberta a partir de um ficheiro descarregado funciona da mesma forma, sem instalação.

## Como funciona

- `node scripts/build.mjs` monta o único `index.html` a partir de `src/`: `src/engine.mjs` (analisadores e funções puras), `checks/*.js` (um plugin por verificação; API em `docs/check-api.md`), `data/checks/*.json` (descritores validados por `schema.json`), `src/ui.js`, `src/app.css` e `src/i18n.mjs`; `--check` verifica que a página corresponde às fontes.
- Uma verificação devolve constatações codificadas (`{code, level, args}`), nunca frases: a interface converte-as para o idioma do leitor, pelo que acrescentar um idioma ou corrigir uma frase nunca toca nos analisadores.
- Os ficheiros são lidos no navegador (File API) e nunca saem do dispositivo. Apenas o título e as notas do caso ficam no armazenamento local do navegador; os elementos e os resultados desaparecem ao recarregar a página.
- A Content-Security-Policy só permite pedidos de rede aos anfitriões que os descritores declaram (`archive.org`, `cloudflare-dns.com`, `dns.google`). A interface acrescenta a porta do consentimento, sem credenciais, sem referrer e com um limite de 10 s, e um plugin não pode chamar `fetch` por si.
- `npm test` executa os analisadores sobre fixtures geradas (JPEG, PNG, WebP, MP4, WebM, armazéns C2PA), os plugins com rede e canvas simulados, as traduções nos oito idiomas e o contrato descritores/CSP; os testes de navegador do hub exercitam toda a página. O desenvolvimento exige Node.js 24 ou posterior; a página só precisa de um navegador com ES2017.
- `manifest.webmanifest`, `sw.js` e os ícones são produzidos por `node scripts/build.mjs` através do kit comum (secção `pwa` de `src/app.json`); `--check` também os verifica, e `npm test` confirma que o manifesto, a versão do service worker e a CSP correspondem à página.

## O que esta ferramenta não pode dizer

- Não pode provar que uma imagem ou um vídeo é autêntico. Só mostra indícios que apoiam ou contrariam uma afirmação.
- Os metadados (EXIF, XMP, IPTC) apagam-se, copiam-se e falsificam-se com facilidade. A sua ausência diz pouco; a sua presença é uma pista, não uma prova. As redes sociais e as aplicações de mensagens removem a maior parte.
- Os Content Credentials (C2PA) são lidos, não validados: a assinatura, a cadeia de certificados e o hash do conteúdo não são verificados aqui. Para isso use um verificador oficial.
- A análise do nível de erro é um indício: também ilumina arestas nítidas, zonas saturadas e imagens guardadas várias vezes. Os especialistas leem-na juntamente com outras provas.
- A verificação de ligações trabalha apenas sobre o texto do endereço. Uma página web não consegue seguir redirecionamentos, ler certificados TLS nem abrir a página de destino, pelo que não pode dizer se um sítio é de confiança.
- As consultas DNS mostram o que respondem agora dois resolvedores públicos. Não dão a data de registo nem o titular de um domínio.
- A pesquisa no Internet Archive só diz se existe uma cópia e que estado tinha; a ausência de cópia não prova nada.
- A deteção de imagens geradas por IA a partir dos metadados só encontra vestígios declarados ou remanescentes. Um ficheiro limpo pode ser sintético, e um assinalado pode ser uma fotografia real retocada com uma ferramenta de IA.
- A interface existe em oito idiomas; as traduções foram escritas com ajuda automática e não foram revistas por falantes nativos. Os textos em romeno e em inglês são a referência.

## Contribua em 5 minutos

1. Faça um fork deste repositório.
2. Copie `data/checks/example.json` para `data/checks/<id>.json` e edite-o (esquema em `schema.json`), depois execute `python scripts/validate.py`.
3. Escreva `checks/<id>.js` (veja `docs/check-api.md`): um módulo ES que exporta `async function run(input, ctx)` e devolve constatações codificadas.
4. Acrescente os textos da verificação e de cada código de constatação nos oito idiomas em `src/i18n.mjs`.
5. Escreva testes em `test/`, execute `npm test` e `node scripts/build.mjs`, e abra um pull request.

## Boas primeiras tarefas

Veja `ISSUES_GOOD_FIRST.md` para tarefas prontas.

## Licença

Código: MIT. Dados contribuídos: indique a fonte; são publicados sob a mesma licença, salvo indicação em contrário.

## Apoio

Se o projeto lhe for útil, pode [oferecer-me um café](https://buymeacoffee.com/echo.of.the.strings).
