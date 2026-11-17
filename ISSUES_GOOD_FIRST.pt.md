# Boas primeiras tarefas

[English](ISSUES_GOOD_FIRST.md) · [Română](ISSUES_GOOD_FIRST.ro.md) · [Français](ISSUES_GOOD_FIRST.fr.md) · [Italiano](ISSUES_GOOD_FIRST.it.md) · [Español](ISSUES_GOOD_FIRST.es.md) · **Português** · [Deutsch](ISSUES_GOOD_FIRST.de.md) · [Magyar](ISSUES_GOOD_FIRST.hu.md)

- [ ] Acrescentar uma verificação de metadados PDF que funcione offline (dicionário Info, XMP, produtor, datas de criação e modificação, atualizações incrementais)
- [ ] Substituir a varredura byte a byte do bloco Exif em HEIC e AVIF por uma pesquisa correta de itens ISO BMFF (`iinf`, `iloc`) e acrescentar testes
- [ ] Acrescentar uma consulta RDAP da idade de um domínio como verificação de rede claramente identificada (declarar cada anfitrião no descritor e em `connect`, e documentar o que é enviado)
- [ ] Validar as assinaturas C2PA com Web Crypto (COSE_Sign1 e cadeia de certificados), testadas com os ficheiros de amostra públicos do c2pa-rs
- [ ] Acrescentar ligações `geo:` e OpenStreetMap para a posição GPS da constatação EXIF (abertas apenas quando o utilizador clica)
- [ ] Melhorar o mapa do nível de erro: vários níveis de qualidade e um controlo de amplificação, com testes em imagens geradas
- [ ] Acrescentar uma verificação offline de metadados de áudio (ID3, etiquetas MP4, comentários Vorbis)
- [ ] Acrescentar um auxiliar que recodifique uma imagem sem EXIF, XMP e IPTC para o utilizador guardar uma cópia limpa antes de publicar
- [ ] Rever as traduções da interface escritas automaticamente (fr, de, es, it, pt, hu) e corrigir o que um falante nativo não diria
- [ ] Investigar um auxiliar opcional, alojado pelo utilizador, que siga cadeias de redirecionamentos (uma página web não consegue) e abrir um issue com o desenho antes de escrever código

Cria-as todas no GitHub com `scripts/create_issues.sh` (requer a CLI `gh`).
