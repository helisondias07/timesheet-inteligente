import sucesso from "../../../fixtures/sucesso-sintetico.json";
import erro from "../../../fixtures/erro-payload-invalido.json";
import github from "../../../fixtures/github-offline-sintetico.json";
import clickup from "../../../fixtures/clickup-offline-sintetico.json";

export const successFixture = sucesso;
export const errorFixture = erro;
export const githubOfflineFixture = github;
export const clickupOfflineFixture = clickup;

export const fixtureCatalog = [
  {
    id: "synthetic-sucesso",
    label: "Fixture de sucesso (JSON canônico)",
    description:
      "Duplicatas, mesmo título com IDs distintos, meia-noite UTC, HTML e links inseguros.",
    payload: sucesso,
  },
  {
    id: "synthetic-erro",
    label: "Fixture de erro (payload inválido)",
    description: "Schema desconhecido, synthetic false e lista inválida.",
    payload: erro,
  },
] as const;
