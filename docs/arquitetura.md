# Arquitetura

```
JSON sintético / fixture
        │
        ▼
 validação de schema e sanitização
        │
        ▼
 identidade estável + evidência + timestamp
        │
        ▼
 deduplicação determinística (só identidade)
        │
        ▼
 agrupamento civil America/Sao_Paulo
        │
        ▼
 proposta diária editável (horas nulas)
        │
        ▼
 revisão humana  →  exportação JSON/CSV
```

Camadas:

- `src/lib/domain` — regras puras, testáveis sem React.
- `src/lib/adapters` — portas GitHub/ClickUp **offline**.
- `src/lib/fixtures` — catálogo sintético.
- `src/components` — mesa de revisão (cliente).
- Persistência: **nenhuma**. Estado React em memória.

O agrupamento usa `Intl` com `timeZone: America/Sao_Paulo`. O timestamp original permanece no campo `original`. Identidade: `v1|{sourceKind}|{kind}|{nativeId}`.

Duração nunca é calculada a partir de evidência. `registeredHours` (origem) ≠ `estimatedHours` (manual).
