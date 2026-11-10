import type { ImportResult } from "../domain/types";

/**
 * Portas de adaptador. Isto NÃO é integração real.
 * Nenhuma autenticação, nenhuma chamada de rede e nenhum dado de cliente
 * entram neste MVP. Implementações só leem fixtures sintéticas já no repositório.
 */
export interface OfflineQuery {
  fixtureId: string;
  synthetic: true;
}

export interface ActivitySourcePort {
  readonly kind: "github" | "clickup";
  readonly label: string;
  readonly mode: "offline-fixture";
  readonly isRealIntegration: false;
  readonly networkCallsEnabled: false;
  loadFromFixture(payload: unknown, query: OfflineQuery): ImportResult;
  fetchRemote(): never;
}

export class OfflineOnlyError extends Error {
  constructor(kind: "github" | "clickup") {
    super(
      `Adaptador ${kind} recusou fetch remoto: este MVP não faz integração real, autenticação nem coleta de dados.`,
    );
    this.name = "OfflineOnlyError";
  }
}

export function assertOfflineQuery(query: OfflineQuery): void {
  if (query.synthetic !== true) {
    throw new Error("Consulta recusada: apenas fixtures sintéticas.");
  }
  if (!query.fixtureId.startsWith("synthetic-")) {
    throw new Error("fixtureId precisa começar com synthetic-.");
  }
}
