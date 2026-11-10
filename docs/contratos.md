# Contratos e portas

## Importação `timesheet-inteligente.atividades.v1`

Campos obrigatórios do envelope: `schema`, `synthetic: true`, `activities[]`.

Cada atividade: `nativeId`, `kind` (`commit` | `pull_request` | `task`), `sourceKind`, `title`, `occurredAt` com fuso explícito (`Z` ou offset), `evidence`, `originUrls` opcional, `registeredHours` opcional (número finito ≥ 0).

## Exportação `timesheet-inteligente.exportacao.v1`

Inclui `synthetic`, `mode: synthetic-demo`, `timezone`, `review.overallStatus`, `review.humanApprovalRequired`, `sources`, `warnings`, `days[]`, `activities[]`, `rules[]`.

CSV: `data_local,fuso,titulo,descricao,horas_estimadas_manuais,horas_registradas_origem,status_revisao,modo_sintetico,fontes,avisos,ids_estaveis,urls_origem,timestamps_originais,dados_insuficientes`.

## Porta `ActivitySourcePort`

```
kind: 'github' | 'clickup'
mode: 'offline-fixture'
isRealIntegration: false
networkCallsEnabled: false
loadFromFixture(payload, { fixtureId: 'synthetic-…', synthetic: true })
fetchRemote(): never
```

### O que **não** é integração real

- Sem OAuth, PAT, cookies ou contas.
- Sem `fetch`, sem webhooks, sem leitura de repositórios ou workspaces vivos.
- Mapeamentos existem para testes com fixtures em `fixtures/github-offline-sintetico.json` e `fixtures/clickup-offline-sintetico.json`.
- Hosts apenas `*.example.com` / `example.org` / `example.net`.
