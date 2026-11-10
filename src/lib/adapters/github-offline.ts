import { SCHEMA_IMPORT } from "../domain/constants";
import { validateImportPayload } from "../domain/validate-import";
import type { ImportResult, RawActivityInput } from "../domain/types";
import {
  assertOfflineQuery,
  OfflineOnlyError,
  type ActivitySourcePort,
  type OfflineQuery,
} from "./ports";

interface GitHubCommitFixture {
  sha?: unknown;
  html_url?: unknown;
  commit?: { message?: unknown; author?: { date?: unknown } };
}

interface GitHubPullFixture {
  number?: unknown;
  title?: unknown;
  html_url?: unknown;
  updated_at?: unknown;
  body?: unknown;
}

export interface GitHubOfflineFixture {
  synthetic?: unknown;
  mode?: unknown;
  commits?: GitHubCommitFixture[];
  pullRequests?: GitHubPullFixture[];
}

function mapGithub(payload: GitHubOfflineFixture): unknown {
  const activities: RawActivityInput[] = [];

  for (const commit of payload.commits ?? []) {
    const sha = typeof commit.sha === "string" ? commit.sha : "";
    const message =
      typeof commit.commit?.message === "string" ? commit.commit.message : "";
    const [title, ...rest] = message.split("\n");
    activities.push({
      nativeId: sha,
      kind: "commit",
      sourceKind: "github",
      sourceLabel: "github-offline-sintetico",
      title,
      description: rest.join("\n").trim(),
      occurredAt: commit.commit?.author?.date,
      originUrls: typeof commit.html_url === "string" ? [commit.html_url] : [],
      evidence: sha
        ? { kind: "commit_sha", value: sha, summary: `SHA sintético ${sha}` }
        : undefined,
      registeredHours: null,
    });
  }

  for (const pull of payload.pullRequests ?? []) {
    const number = pull.number;
    activities.push({
      nativeId: number != null ? `pr-${String(number)}` : "",
      kind: "pull_request",
      sourceKind: "github",
      sourceLabel: "github-offline-sintetico",
      title: pull.title,
      description: pull.body,
      occurredAt: pull.updated_at,
      originUrls: typeof pull.html_url === "string" ? [pull.html_url] : [],
      evidence:
        number != null
          ? {
              kind: "pr_number",
              value: String(number),
              summary: `PR sintético ${number}`,
            }
          : undefined,
      registeredHours: null,
    });
  }

  return {
    schema: SCHEMA_IMPORT,
    synthetic: payload.synthetic === true,
    timezoneDefault: "America/Sao_Paulo",
    activities,
  };
}

export const githubOfflinePort: ActivitySourcePort = {
  kind: "github",
  label: "GitHub (porta offline, sem rede)",
  mode: "offline-fixture",
  isRealIntegration: false,
  networkCallsEnabled: false,
  loadFromFixture(payload: unknown, query: OfflineQuery): ImportResult {
    assertOfflineQuery(query);
    if (payload == null || typeof payload !== "object") {
      return validateImportPayload(payload, "offline-fixture");
    }
    return validateImportPayload(
      mapGithub(payload as GitHubOfflineFixture),
      "offline-fixture",
    );
  },
  fetchRemote(): never {
    throw new OfflineOnlyError("github");
  },
};
