# Atelier de verificare

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · **Português** · [Deutsch](README.de.md) · [Magyar](README.hu.md)

Versão: 0.1.0 · Última atualização: 2026-11-14

🌐 https://atelier-verificare.chiuta.ro

> Kit de verificação local para jornalistas: proveniência de imagens, metadados, ligações e domínios.

Trade-free: sem rastreamento, sem anúncios, sem contas, funciona offline.

## Estado

Alfa: o repositório contém a estrutura, o esquema de dados ou os primeiros exemplos e os guias de contribuição. O âmbito abaixo é o plano, não o que funciona hoje.

## Âmbito previsto

- Uma API de verificações comum (entradas, saídas, níveis de estado) para que cada verificação reporte da mesma forma.
- Verificações de imagens: um analisador EXIF completo (GPS, câmara, software, carimbos de data/hora), uma verificação offline e só de leitura do manifesto C2PA e análise do nível de erro para JPEG.
- Verificações de ligações e domínios: ligações quebradas e cadeias de redirecionamentos para uma lista de URL, e um resumo DNS/TLS através de DoH público sem WHOIS.
- Um extrator de fotogramas-chave de vídeo (canvas, offline) e uma ajuda «guardar no Internet Archive», iniciada pelo utilizador e claramente identificada.
- Um relatório de verificação imprimível (PDF/Markdown) e uma nota de ética sobre o que estas ferramentas não conseguem provar.

Nada disto está ainda implementado: cada ponto é uma tarefa preparada em `ISSUES_GOOD_FIRST.md`.

## Contribua em 5 minutos

1. Faça um fork deste repositório.
2. Copie `data/checks/example.json` para `data/checks/` e edite-o.
3. Execute `python scripts/validate.py`.
4. Abra um pull request — para dados não é preciso programar.

## Boas primeiras tarefas

Veja `ISSUES_GOOD_FIRST.md` para tarefas prontas.

## Licença

Código: MIT. Dados contribuídos: indique a fonte; são publicados sob a mesma licença, salvo indicação em contrário.

## Apoio

Se o projeto lhe for útil, pode [oferecer-me um café](https://buymeacoffee.com/echo.of.the.strings).
