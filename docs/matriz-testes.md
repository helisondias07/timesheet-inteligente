# Matriz de testes: fixture vs integração real

| Caso | Fixture / offline | Integração real |
| --- | --- | --- |
| Duplicatas + reimportação | Coberto em `tests/unit/dedupe.test.ts` | **Não existe neste MVP** |
| Mesmo título, IDs distintos | Fixture de sucesso | Não existe |
| Meia-noite UTC vs data BR | `2026-04-10T02:30:00Z` → `2026-04-09` | Não existe |
| Timestamp sem zona / inválido | Unitário + fixture | Não existe |
| Falta de evidência | `TASK-SIN-1002` | Não existe |
| Payload inválido | `fixtures/erro-payload-invalido.json` | Não existe |
| Horas ausentes/negativas/NaN/excesso/conflito | `tests/unit/duration.test.ts` | Não existe |
| Edição e revisão no export | `tests/unit/export.test.ts` | Não existe |
| Proveniência | pipeline + export | Não existe |
| CSV acentos/aspas/quebra/fórmula | export unitário | Não existe |
| Links inseguros | validate unitário | Não existe |
| UI carregar-editar-revisar-exportar | Playwright | Não existe |
| Porta GitHub | `github-offline-sintetico.json` | **Proibida** (`fetchRemote` erro) |
| Porta ClickUp | `clickup-offline-sintetico.json` | **Proibida** |
| Autenticação / dados de cliente | — | **Fora de escopo** |
