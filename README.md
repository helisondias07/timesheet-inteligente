# Timesheet inteligente (MVP de demonstração)

Rascunho **autoral** para revisão independente: uma mesa de evidências que agrupa atividades sintéticas por dia em `America/Sao_Paulo`, pede revisão humana e exporta JSON/CSV. **Não é produto publicado.** Não consulta contas reais, não chama GitHub/ClickUp, não usa LLM e **não preenche horas sozinho**.

Interface e documentação em **pt-BR**. Fixture sempre marcada como **DEMONSTRAÇÃO / DADOS SINTÉTICOS**.

## O que este MVP faz

- Importa JSON sintético com schema `timesheet-inteligente.atividades.v1`.
- Normaliza commits, PRs e tarefas com identidade estável, fonte, URLs, timestamp com fuso e evidência.
- Agrupa no calendário de `America/Sao_Paulo` sem reescrever o timestamp original.
- Deduplica só por identidade (`v1|fonte|tipo|idNativo`). Títulos iguais e IDs diferentes permanecem distintos.
- Deixa duração sugerida **vazia** até a pessoa preencher. Horas registradas na origem, se existirem, ficam em campo separado.
- Exige revisão humana por dia (aprovar / marcar revisão / rejeitar).
- Exporta rascunho JSON e CSV com status de revisão, modo sintético, fontes, avisos e fuso.

## O que este MVP **não** é

- Não é integração real com GitHub, ClickUp, Jira, planilhas ou qualquer conta.
- As portas GitHub/ClickUp **só leem fixtures offline**. `fetchRemote()` lança erro de propósito.
- Não inventa trabalho, não deriva duração de commits e não distribui 8h.
- Não persiste dados: o rascunho vive na memória do navegador e some ao recarregar.
- Não deve ser publicado, nomeado como repositório oficial, nem espelhado para GitHub/Vercel nesta execução.

Inspiração contextual (sem cópia de narrativa, UI, resultados ou código): artigo público de João Raul, [We Built a Timesheet Auto-Filler by Removing Every Layer We Started With](https://joaoraul.dev/writing/timesheet-auto-filler/) (2026-06-18). Código original daquela iniciativa **não confirmado** aqui. Licença do original **não inventada**. Ver [docs/inspiracao.md](docs/inspiracao.md).

## Instalar e rodar

Requisito: Node.js 22+.

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:43147`.

### Demo local

1. Confira o carimbo **DEMONSTRAÇÃO / DADOS SINTÉTICOS** e o estado vazio.
2. Clique em **Carregar fixture sintética** (ou `Alt+1`).
3. Edite título/descrição; deixe horas vazias ou preencha um número explícito.
4. Aprove ou marque um dia para revisão humana.
5. Exporte JSON (`Alt+E`) e CSV (`Alt+C`).
6. Opcional: **Portas GitHub/ClickUp offline** (ainda sintético) ou **Carregar fixture de erro**.

Atalhos: `Alt+2` foca o JSON, `Alt+3` importa o texto colado, `Alt+?` lista atalhos.

## Testes

```bash
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

## Sugestão de slug (não publicada)

`timesheet-inteligente` — apenas sugestão para decisão centralizada posterior. Este draft Origin permanece a fonte de verdade. Publicação GitHub/Vercel **fora desta execução**.

Sincronização local futura (não executada aqui): `C:\Users\HelisonDias\Repositorios`. Ver [docs/sincronizacao-local.md](docs/sincronizacao-local.md).

## Documentação

- [Arquitetura](docs/arquitetura.md)
- [Contratos e portas](docs/contratos.md)
- [Decisões](docs/decisoes.md)
- [Privacidade e ameaças](docs/privacidade-ameacas.md)
- [Validações](docs/validacoes.md)
- [Matriz de testes](docs/matriz-testes.md)
- [Limitações](docs/limitacoes.md)
- [Caso técnico para portfólio](docs/caso-tecnico-portfolio.md)
- [Licenças de dependências](docs/licencas.md)
