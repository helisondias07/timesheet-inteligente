# Caso técnico (rascunho para futura integração no portfólio)

Público: coordenador de portfólio. **Não** é história de uso em produção. **Não** afirma que Helison Dias aponta horas com esta ferramenta.

## Problema (hipotético)

Reconstruir um rascunho de timesheet a partir de evidências espalhadas (commits, PRs, tarefas) sem inventar trabalho e sem tratar timestamp de git como duração. O risco clássico é preencher 8h por dia com um modelo ou com um agrupamento ingênuo por título.

## Solução deste MVP

Pipeline determinístico no cliente: validar → identificar → deduplicar → agrupar em `America/Sao_Paulo` → revisar → exportar. Duração só entra se uma pessoa digitar. Portas GitHub/ClickUp existem como contrato, alimentadas só por fixture.

## Decisões

Ver [decisoes.md](decisoes.md). Destaque: identidade estável auditável; recusa de LLM; sanitização de importação/CSV; modo sintético obrigatório.

## Resultados (somente o que foi medido nesta execução)

Os números concretos de testes, typecheck e build vão no relatório final da sessão (contagem real após `npm test`, `npm run typecheck`, `npm run build` e, se rodou, Playwright). Não há métrica de tempo economizado, adoção ou precisão contra apontamentos reais — **isso não foi medido**.

## Próximos passos (dependem de revisão centralizada)

- Confirmar se haverá uso real e qual formato de apontamento.
- Definir fontes, permissões e se as portas deixam o modo offline.
- Nome, visibilidade e eventual publicação (GitHub/Vercel) — **não feitos aqui**.
- Slug sugerido: `timesheet-inteligente`.
- Cópia futura para `C:\Users\HelisonDias\Repositorios` pelo fluxo de portfólio, sem clone nesta execução.
