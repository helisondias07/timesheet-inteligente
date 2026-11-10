# Validações

## Importação

- Envelope: schema conhecido, `synthetic: true`, `activities` lista.
- Identidade: `nativeId` não vazio.
- Timestamp: parseável **e** com fuso explícito.
- Evidência: `kind` + `value`.
- URLs: só `http`/`https`.
- Título/descrição: texto inerte (marcação não é executada nem apagada).
- URLs de origem: só `http`/`https` viram `href`; demais rejeitadas para link.
- Tamanho: ver limites em `src/lib/domain/constants.ts` (`MAX_PAYLOAD_BYTES`, `MAX_ACTIVITIES`, `MAX_TEXT_LENGTH`, `MAX_URL_LENGTH`).
- `registeredHours`: nulo, ou número finito 0–12. Vírgula ou ponto (`1,5` / `1.5`).

## Proposta / horas manuais

- Vazio: aviso `HORAS_AUSENTES` (estado esperado).
- Negativo: `HORAS_NEGATIVAS`.
- Não finito: `HORAS_NAN`.
- Item > 12h: `HORAS_EXCESSIVAS_ITEM`.
- Soma do dia > 24h: `HORAS_EXCESSIVAS_DIA`.
- Estimativa ≠ registrada: `HORAS_CONFLITANTES` (não resolve sozinho).

## Exportação

- Schema `timesheet-inteligente.exportacao.v1` e `synthetic: true`.
- CSV com BOM UTF-8, aspas RFC, quebras `\r\n`.
