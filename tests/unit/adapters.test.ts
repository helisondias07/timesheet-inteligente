import { describe, expect, it } from "vitest";
import { clickupOfflinePort } from "@/lib/adapters/clickup-offline";
import { githubOfflinePort } from "@/lib/adapters/github-offline";
import { OfflineOnlyError } from "@/lib/adapters/ports";
import githubFixture from "../../fixtures/github-offline-sintetico.json";
import clickupFixture from "../../fixtures/clickup-offline-sintetico.json";

describe("portas offline GitHub e ClickUp", () => {
  it("mapeia fixture GitHub sem rede", () => {
    const result = githubOfflinePort.loadFromFixture(githubFixture, {
      fixtureId: "synthetic-github-offline",
      synthetic: true,
    });
    expect(githubOfflinePort.isRealIntegration).toBe(false);
    expect(githubOfflinePort.networkCallsEnabled).toBe(false);
    expect(result.ok).toBe(true);
    expect(result.activities.some((item) => item.kind === "commit")).toBe(true);
    expect(result.activities.some((item) => item.kind === "pull_request")).toBe(true);
    expect(
      result.activities.every((item) =>
        item.provenance.originUrls.every((url) => url.includes("example.com")),
      ),
    ).toBe(true);
  });

  it("mapeia fixture ClickUp preservando horas registradas, sem estimar", () => {
    const result = clickupOfflinePort.loadFromFixture(clickupFixture, {
      fixtureId: "synthetic-clickup-offline",
      synthetic: true,
    });
    expect(result.ok).toBe(true);
    const task = result.activities[0];
    expect(task?.duration.registeredHours).toBe(2);
    expect(task?.duration.estimatedHours).toBeNull();
    expect(task?.kind).toBe("task");
  });

  it("recusa fetch remoto", () => {
    expect(() => githubOfflinePort.fetchRemote()).toThrow(OfflineOnlyError);
    expect(() => clickupOfflinePort.fetchRemote()).toThrow(OfflineOnlyError);
  });
});
