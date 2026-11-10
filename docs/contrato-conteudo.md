# Contrato de conteúdo (texto inerte)

Importação, edição, exibição e exportação tratam título/descrição/avisos como **texto**, não como HTML/JS executável.

- **Não** usamos `dangerouslySetInnerHTML`.
- React escapa o que aparece na UI. Presença literal de `javascript:` ou `<img>` no JSON/CSV **não** é execução (eco ≠ XSS).
- Não apagamos conteúdo legítimo para “passar” um assert.
- `originUrls` só viram `href` se o protocolo for `http:` ou `https:` (`hrefIfSafeHttp`). Caso contrário o texto pode existir, mas não vira link.
- Links seguros: `rel="noopener noreferrer"`. Clique humano em HTTPS **não** é `fetchRemote` do adaptador e **não** dispara importação em rede.
- CSV: `csvSafeCell` prefixa `=` `+` `-` `@` TAB/CR em **todas** as colunas de texto (título, descrição, status, avisos, ids, urls), inclusive após edição humana.
- JSON pode conter a string `javascript:` como dado inerte.
- Importação **não** faz requisição externa.

Adaptações offline: `fetchRemote()` continua recusando.
