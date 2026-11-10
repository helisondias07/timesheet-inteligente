# Decisões

1. **TypeScript + Next.js (App Router) + React**, UI própria com primitivos estilo shadcn (Slot, Label, CVA). Sem LLM.
2. **Sem backend obrigatório.** Tudo no cliente para demo de baixo custo e sem sessão autenticada.
3. **Identidade canônica auditável** em vez de hash opaco: dá para ler fonte, tipo e id nativo.
4. **Deduplicação só por identidade.** Título parecido nunca une registros.
5. **Horas nulas por padrão.** Qualquer preenchimento é ato humano explícito.
6. **Fuso fixo de agrupamento** `America/Sao_Paulo`; timestamps sem offset são inválidos, não “assumidos”.
7. **Sanitização na importação e no CSV** (HTML, `javascript:`, `data:`, prefixo `'` em fórmulas).
8. **Portas GitHub/ClickUp como contratos mortos para rede**, vivos só para fixtures.
9. **Draft Origin como fonte de verdade.** Sugestão de slug `timesheet-inteligente` não publica nem nomeia repositório.
10. **Inspiração atribuída, implementação própria.** Não se copia o artigo de João Raul nem se inventa licença dele.
