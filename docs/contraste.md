# Contraste (revisão 1)

Medição da auditoria independente (tokens CSS, não é auditoria WCAG completa, sem axe/leitor):

| Token | Sobre `--paper` `#f3ead8` | Nota |
| --- | --- | --- |
| `--ink` `#16141c` | 15,27:1 | ok |
| `--muted-ink` `#4a4558` | 7,70:1 | ok |
| `--muted` `#7a7488` | **3,75:1** | abaixo de 4,5:1 para texto normal/pequeno |
| `--stamp` | 5,50:1 | |
| `--teal` | 6,52:1 | |

`--muted` era usado em `placeholder:` (input/textarea, texto pequeno). Foi alinhado a `--muted-ink` `#4a4558` (≥ 4,5:1 no papel e no `--paper-strong` `#fffaf0`).

**Não** se declara conformidade WCAG 2.2 global: não houve auditoria de todos os estados, overlays, nem leitores de tela.
