# Auditoria de dependências (revisão 1)

Comandos: `npm audit` e `npm audit --omit=dev`. **Não** foi usado `npm audit fix --force`.

## Antes (SHA 513b1158, medido na auditoria independente e reconfirmado)

- `npm audit`: 14 (2 critical, 1 high, 11 moderate) — cadeia **dev** vitest@2.1.9 → vite → tinypool; eslint-config-next / typescript-eslint / minimatch.
- `npm audit --omit=dev`: **0** (runtime da página estática sem esses módulos).

Não se afirma exploração no runtime da demo.

## Ação tomada (compatível, explícita)

- `npm install -D vite@8.3.7 vitest@5.1.0` (peer Vite exigido pelo Vitest 5; tinypool antigo sai da árvore).
- Remoção de `@radix-ui/react-separator` e `@radix-ui/react-tabs`: **zero imports em `src/`**; Radix Dialog permanece para o overlay de atalhos.
- Override `minimatch: 11.0.6` (fora da faixa npm `7.0.0–11.0.0` do GHSA-g3hv-75wg-m249), para não forçar `eslint-config-next@15` (incompatível com Next 16).

## Depois (medido neste bloco, após `npm install`)

- `npm audit`: **0** (exit 0)
- `npm audit --omit=dev`: **0** (exit 0)
- `npx eslint src`: exit 0
- `npx vitest run`: 8 arquivos / 27 testes, exit 0

Residual: nenhum no relatório npm desta árvore. O override de `minimatch` é deliberado; não usamos `audit fix --force`. Vite 8 e Vitest 5 são **dev**. Runtime da página (`--omit=dev`) já era 0 e permanece 0.

Subir Vitest UI ou o servidor de testes exposto à rede continua fora do escopo da demo estática.
