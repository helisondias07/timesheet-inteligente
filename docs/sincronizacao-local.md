# Sincronização local posterior (não executada)

Este arquivo existe para o coordenador de portfólio copiar o pacote **depois** da revisão. **Nesta execução o agente não acessa o PC, não clona e não espelha GitHub.**

- **Fonte de verdade:** draft Origin desta sessão.
- **Sugestão de slug:** `timesheet-inteligente` (apenas sugestão).
- **Destino futuro, se alguém decidir:** `C:\Users\HelisonDias\Repositorios`
- **Não fazer:** `git remote` para GitHub, Vercel, merge, rename público, deploy.

Quando a decisão centralizada autorizar uma cópia:

1. Use o pacote em `/opt/cursor/artifacts` (tar.gz/zip sem `node_modules` e sem segredos).
2. Ou clone o draft Origin autenticado — não um espelho GitHub.
3. Mantenha `synthetic: true` e hosts `example` até haver política de dados reais.
