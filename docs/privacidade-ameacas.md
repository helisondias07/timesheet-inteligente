# Privacidade e ameaças (MVP sintético)

## Comportamento de dados

- Não há banco, `localStorage` nem cookie de conteúdo.
- O rascunho existe só na memória da página. Recarregar **descarta**.
- Este MVP **não deve** receber dados reais de clientes. A UI avisa modo sintético.
- Exportações são arquivos locais gerados no navegador.

## Ameaças consideradas

| Ameaça | Mitigação neste MVP |
| --- | --- |
| Marcação no JSON | Texto inerte; React escapa; sem `dangerouslySetInnerHTML` |
| `javascript:` / `data:` em **href** | Recusados em `originUrls`; eco no texto não é execução |
| Fórmula CSV (`=`, `+`, `-`, `@`) | Prefixo `'` |
| Conteúdo de cliente real | Recusa de `synthetic !== true`; fixtures de exemplo |
| Credenciais em repositório | Nenhuma chave; `.env*` no gitignore |
| Integração acidental | `fetchRemote()` lança `OfflineOnlyError` |
| Publicação prematura | `robots: noindex`; README deixa explícito o rascunho |

## O que continua em aberto

Uso real, permissões de fontes, formato do apontamento oficial, nome e visibilidade de um futuro repositório — decisões **centralizadas**, fora desta execução.
