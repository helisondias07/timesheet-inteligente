# Caso técnico (rascunho para futura integração no portfólio)

Público: coordenador de portfólio. **Não** é história de uso em produção. **Não** afirma que Helison Dias aponta horas com esta ferramenta.

## Problema (hipotético)

Reconstruir um rascunho de timesheet a partir de evidências espalhadas (commits, PRs, tarefas) sem inventar trabalho e sem tratar timestamp de git como duração. O risco clássico é preencher 8h por dia com um modelo ou com um agrupamento ingênuo por título.

## Solução deste MVP

Pipeline determinístico no cliente: validar → identificar → deduplicar → agrupar em `America/Sao_Paulo` → revisar → exportar. Duração só entra se uma pessoa digitar. Portas GitHub/ClickUp existem como contrato, alimentadas só por fixture.

## Decisões

Ver [decisoes.md](decisoes.md) e [contrato-conteudo.md](contrato-conteudo.md). Destaque: identidade estável; recusa de LLM; texto inerte vs href; CSV com fórmulas prefixadas; modo sintético.

## Resultados (somente o que foi medido nesta execução)

Números desta revisão: ver relatório final da sessão (typecheck limpo sem build, `test:all`, audit). Não há métrica de tempo economizado, adoção ou uso real por Helison Dias — **isso não foi medido**. Auditoria independente em SHA `513b1158` **não aprovou publicação**; esta continuação só corrige o MVP no draft.

## Próximos passos (dependem de revisão centralizada)

- Confirmar se haverá uso real e qual formato de apontamento.
- Definir fontes, permissões e se as portas deixam o modo offline.
- Nome, visibilidade e eventual publicação (GitHub/Vercel) — **não feitos aqui**.
- Slug sugerido: `timesheet-inteligente`.
- Cópia futura para `C:\Users\HelisonDias\Repositorios` pelo fluxo de portfólio, sem clone nesta execução.
