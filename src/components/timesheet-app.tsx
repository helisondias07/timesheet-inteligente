"use client";

import {
  AlertTriangle,
  Check,
  Download,
  Keyboard,
  RefreshCcw,
  Stamp,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { clickupOfflinePort } from "@/lib/adapters/clickup-offline";
import { githubOfflinePort } from "@/lib/adapters/github-offline";
import { APP_TIMEZONE, MAX_TEXT_LENGTH, type ReviewStatus } from "@/lib/domain/constants";
import { exportDraft, downloadBlob } from "@/lib/domain/export";
import {
  applyDays,
  emptyWorkspace,
  ingestJsonText,
  ingestPayload,
  type WorkspaceState,
} from "@/lib/domain/pipeline";
import {
  updateDayReview,
  updateItemHours,
  updateItemText,
} from "@/lib/domain/proposal";
import { formatDateLabel } from "@/lib/domain/timezone";
import type { DailyProposal, TimesheetDraft, Warning } from "@/lib/domain/types";
import {
  clickupOfflineFixture,
  errorFixture,
  githubOfflineFixture,
  successFixture,
} from "@/lib/fixtures";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const HELP = [
  ["Alt+1", "Carregar fixture sintética de sucesso"],
  ["Alt+2", "Focar a área de importação"],
  ["Alt+3", "Importar JSON colado"],
  ["Alt+E", "Exportar JSON"],
  ["Alt+C", "Exportar CSV"],
  ["Alt+?", "Abrir/fechar este atalho"],
  ["Tab", "Percorrer revisão, evidências e campos"],
];

function reviewLabel(status: ReviewStatus): string {
  switch (status) {
    case "aprovado":
      return "Aprovado (humano)";
    case "rejeitado":
      return "Rejeitado";
    case "precisa_revisao":
      return "Precisa de revisão humana";
    default:
      return "Rascunho";
  }
}

export function TimesheetApp() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(emptyWorkspace);
  const [draft, setDraft] = useState<TimesheetDraft | null>(null);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [message, setMessage] = useState("Nenhuma atividade carregada. Estado vazio.");
  const [helpOpen, setHelpOpen] = useState(false);
  const [focusedDay, setFocusedDay] = useState(0);
  const importRef = useRef<HTMLTextAreaElement>(null);

  const commit = useCallback((next: WorkspaceState, nextDraft: TimesheetDraft) => {
    setWorkspace(next);
    setDraft(nextDraft);
  }, []);

  const loadCanonical = useCallback(() => {
    const ingested = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    commit(ingested.state, ingested.draft);
    setImportError(null);
    setMessage(
      ingested.result.ok
        ? `Fixture sintética carregada: ${ingested.state.activities.length} identidades após deduplicação.`
        : "A fixture de sucesso falhou na validação.",
    );
  }, [commit]);

  const importJson = useCallback(() => {
    const ingested = ingestJsonText(workspace, importText, "json-import");
    commit(ingested.state, ingested.draft);
    if (!ingested.result.ok) {
      setImportError(
        ingested.result.issues.map((issue) => `${issue.path}: ${issue.message}`).join(" "),
      );
      setMessage("Importação recusada. Veja o estado de erro.");
      return;
    }
    setImportError(null);
    setMessage(
      `Importação sintética aceita. ${ingested.result.activities.length} registros no lote; ${ingested.state.activities.length} no rascunho após idempotência.`,
    );
  }, [commit, importText, workspace]);

  const loadErrorFixture = useCallback(() => {
    setImportText(JSON.stringify(errorFixture, null, 2));
    const ingested = ingestPayload(workspace, errorFixture, "fixture-loader");
    commit(ingested.state, ingested.draft);
    setImportError(
      ingested.result.issues.map((issue) => `${issue.path}: ${issue.message}`).join(" "),
    );
    setMessage("Fixture de erro aplicada. O rascunho anterior foi preservado.");
  }, [commit, workspace]);

  const loadAdapterFixtures = useCallback(() => {
    const github = githubOfflinePort.loadFromFixture(githubOfflineFixture, {
      fixtureId: "synthetic-github-offline",
      synthetic: true,
    });
    const clickup = clickupOfflinePort.loadFromFixture(clickupOfflineFixture, {
      fixtureId: "synthetic-clickup-offline",
      synthetic: true,
    });
    const first = ingestPayload(
      emptyWorkspace(),
      {
        schema: "timesheet-inteligente.atividades.v1",
        synthetic: true,
        activities: github.activities.map((activity) => ({
          nativeId: activity.nativeId,
          kind: activity.kind,
          sourceKind: activity.provenance.sourceKind,
          sourceLabel: activity.provenance.sourceLabel,
          title: activity.title,
          description: activity.description,
          occurredAt: activity.timestamp.original,
          originUrls: activity.provenance.originUrls,
          evidence: activity.provenance.evidence,
          registeredHours: activity.duration.registeredHours,
        })),
      },
      "offline-fixture",
    );
    const second = ingestPayload(
      first.state,
      {
        schema: "timesheet-inteligente.atividades.v1",
        synthetic: true,
        activities: clickup.activities.map((activity) => ({
          nativeId: activity.nativeId,
          kind: activity.kind,
          sourceKind: activity.provenance.sourceKind,
          sourceLabel: activity.provenance.sourceLabel,
          title: activity.title,
          description: activity.description,
          occurredAt: activity.timestamp.original,
          originUrls: activity.provenance.originUrls,
          evidence: activity.provenance.evidence,
          registeredHours: activity.duration.registeredHours,
        })),
      },
      "offline-fixture",
    );
    commit(second.state, second.draft);
    setImportError(null);
    setMessage(
      "Portas offline GitHub e ClickUp leram fixtures sintéticas. Nenhuma chamada de rede.",
    );
  }, [commit]);

  const reset = useCallback(() => {
    const empty = emptyWorkspace();
    setWorkspace(empty);
    setDraft(null);
    setImportError(null);
    setMessage("Rascunho descartado. Nada persiste após recarregar a página.");
  }, []);

  const patchDays = useCallback(
    (days: DailyProposal[]) => {
      const next = applyDays(workspace, days);
      commit(next.state, next.draft);
    },
    [commit, workspace],
  );

  const exportJson = useCallback(() => {
    if (!draft) {
      setImportError("Não há rascunho para exportar.");
      return;
    }
    const artifacts = exportDraft(draft);
    if (artifacts.warnings.length) {
      setImportError(artifacts.warnings.map((warning) => warning.message).join(" "));
      return;
    }
    downloadBlob(
      "timesheet-inteligente-rascunho-sintetico.json",
      artifacts.json,
      "application/json;charset=utf-8",
    );
    setMessage("JSON sintético exportado com metadados de revisão, fontes e avisos.");
  }, [draft]);

  const exportCsv = useCallback(() => {
    if (!draft) {
      setImportError("Não há rascunho para exportar.");
      return;
    }
    const artifacts = exportDraft(draft);
    if (artifacts.warnings.length) {
      setImportError(artifacts.warnings.map((warning) => warning.message).join(" "));
      return;
    }
    downloadBlob(
      "timesheet-inteligente-rascunho-sintetico.csv",
      artifacts.csv,
      "text/csv;charset=utf-8",
    );
    setMessage("CSV sintético exportado (acentos, aspas e fórmulas prefixadas).");
  }, [draft]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.altKey && event.code === "Digit1") {
        event.preventDefault();
        loadCanonical();
      }
      if (event.altKey && event.code === "Digit2") {
        event.preventDefault();
        importRef.current?.focus();
      }
      if (event.altKey && event.code === "Digit3") {
        event.preventDefault();
        importJson();
      }
      if (event.altKey && event.code === "KeyE") {
        event.preventDefault();
        exportJson();
      }
      if (event.altKey && event.code === "KeyC") {
        event.preventDefault();
        exportCsv();
      }
      if (event.altKey && (event.code === "Slash" || event.key === "?")) {
        event.preventDefault();
        setHelpOpen((open) => !open);
      }
      if (event.key === "Escape") setHelpOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exportCsv, exportJson, importJson, loadCanonical]);

  const empty = workspace.activities.length === 0;

  const warningCount = useMemo(
    () =>
      workspace.days.reduce(
        (total, day) =>
          total +
          day.dayWarnings.length +
          day.items.reduce((sum, item) => sum + item.warnings.length, 0),
        0,
      ),
    [workspace.days],
  );

  return (
    <div className="min-h-full bg-[var(--paper)] text-[var(--ink)]">
      <a
        href="#revisao"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--ink)] focus:px-3 focus:py-2 focus:text-[var(--paper)]"
      >
        Pular para a revisão
      </a>

      <header className="border-b border-[var(--rule)] bg-[var(--paper-strong)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-[family-name:var(--font-serif)] text-sm uppercase tracking-[0.24em] text-[var(--stamp)]">
              Demonstração · dados sintéticos
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-serif)] text-3xl leading-tight md:text-4xl">
              Timesheet inteligente
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--muted-ink)]">
              Mesa de revisão para evidências e sugestões. Sem LLM, sem horas
              inventadas, sem contas reais. Fuso {APP_TIMEZONE}. Rascunho só na
              memória desta sessão.
            </p>
          </div>
          <div
            aria-hidden="true"
            className="stamp self-start rotate-[-8deg] rounded-sm border-4 border-[var(--stamp)] px-3 py-1 text-center text-[11px] font-black uppercase tracking-widest text-[var(--stamp)]"
          >
            Demonstração
            <br />
            Dados sintéticos
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-lg border border-[var(--rule)] bg-[var(--paper-strong)] p-4 shadow-[0_1px_0_rgba(22,20,28,0.06)]">
            <h2 className="font-[family-name:var(--font-serif)] text-xl">Entrada</h2>
            <p className="mt-1 text-sm text-[var(--muted-ink)]">
              Carregue a fixture explícita ou cole um JSON sintético validado.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button data-testid="load-fixture" onClick={loadCanonical}>
                <Stamp className="h-4 w-4" />
                Carregar fixture sintética
              </Button>
              <Button variant="outline" onClick={loadAdapterFixtures}>
                Portas GitHub/ClickUp offline
              </Button>
              <Button variant="ghost" onClick={loadErrorFixture}>
                <AlertTriangle className="h-4 w-4" />
                Carregar fixture de erro
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="import-json">Importar JSON sintético</Label>
              <Textarea
                id="import-json"
                ref={importRef}
                data-testid="import-json"
                value={importText}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setImportText(event.target.value)}
                placeholder='{"schema":"timesheet-inteligente.atividades.v1","synthetic":true,...}'
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" data-testid="import-submit" onClick={importJson}>
                  <Upload className="h-4 w-4" />
                  Importar
                </Button>
                <Button variant="ghost" onClick={reset}>
                  <RefreshCcw className="h-4 w-4" />
                  Descartar sessão
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--rule)] p-4">
            <h2 className="font-[family-name:var(--font-serif)] text-lg">Exportar rascunho</h2>
            <p className="mt-1 text-sm text-[var(--muted-ink)]">
              Inclui status de revisão, modo sintético, fontes, avisos e fuso.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button data-testid="export-json" variant="outline" onClick={exportJson}>
                <Download className="h-4 w-4" />
                JSON
              </Button>
              <Button data-testid="export-csv" variant="outline" onClick={exportCsv}>
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button variant="ghost" onClick={() => setHelpOpen(true)}>
                <Keyboard className="h-4 w-4" />
                Atalhos
              </Button>
            </div>
          </section>
        </aside>

        <main id="revisao" className="space-y-4">
          <div aria-live="polite" className="rounded-md border border-[var(--rule)] bg-[var(--paper-strong)] px-4 py-3 text-sm">
            {message}
            {warningCount > 0 ? ` · ${warningCount} avisos visíveis.` : null}
          </div>

          {importError ? (
            <div
              role="alert"
              data-testid="error-state"
              className="rounded-md border border-[var(--stamp)] bg-[#f8e6e3] px-4 py-3 text-sm text-[#6f140e]"
            >
              <p className="font-semibold">Estado de erro</p>
              <p className="mt-1">{importError}</p>
            </div>
          ) : null}

          {empty ? (
            <EmptyState onLoad={loadCanonical} />
          ) : (
            <div className="space-y-4">
              {workspace.days.map((day, index) => (
                <DayCard
                  key={day.dateLocal}
                  day={day}
                  focused={focusedDay === index}
                  onFocus={() => setFocusedDay(index)}
                  onTitle={(itemId, title) =>
                    patchDays(updateItemText(workspace.days, day.dateLocal, itemId, { title }))
                  }
                  onDescription={(itemId, description) =>
                    patchDays(
                      updateItemText(workspace.days, day.dateLocal, itemId, {
                        description,
                      }),
                    )
                  }
                  onHours={(itemId, hours) =>
                    patchDays(updateItemHours(workspace.days, day.dateLocal, itemId, hours))
                  }
                  onReview={(status, note) =>
                    patchDays(updateDayReview(workspace.days, day.dateLocal, status, note))
                  }
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {helpOpen ? (
        <div
          role="dialog"
          aria-labelledby="atalhos-titulo"
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(22,20,28,0.45)] p-4 md:items-center"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="atalhos-titulo" className="font-[family-name:var(--font-serif)] text-2xl">
              Operação por teclado
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {HELP.map(([key, text]) => (
                <li key={key}>
                  <kbd className="rounded border border-[var(--rule)] bg-[var(--paper-strong)] px-1.5 py-0.5 font-mono text-xs">
                    {key}
                  </kbd>{" "}
                  {text}
                </li>
              ))}
            </ul>
            <Button className="mt-4" onClick={() => setHelpOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ onLoad }: { onLoad: () => void }) {
  return (
    <section
      data-testid="empty-state"
      className="rounded-lg border border-dashed border-[var(--rule)] bg-[var(--paper-strong)] px-6 py-16 text-center"
    >
      <p className="font-[family-name:var(--font-serif)] text-2xl">Nada para revisar ainda</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-ink)]">
        Este MVP não busca GitHub, ClickUp nem planilhas. Carregue a fixture
        sintética ou importe um JSON marcado como demonstração.
      </p>
      <Button className="mt-5" onClick={onLoad}>
        Carregar fixture sintética
      </Button>
    </section>
  );
}

function DayCard({
  day,
  focused,
  onFocus,
  onTitle,
  onDescription,
  onHours,
  onReview,
}: {
  day: DailyProposal;
  focused: boolean;
  onFocus: () => void;
  onTitle: (itemId: string, title: string) => void;
  onDescription: (itemId: string, description: string) => void;
  onHours: (itemId: string, hours: string) => void;
  onReview: (status: ReviewStatus, note: string) => void;
}) {
  return (
    <article
      tabIndex={0}
      onFocus={onFocus}
      data-testid={`day-${day.dateLocal}`}
      className={`rounded-lg border bg-[var(--paper-strong)] p-4 ${
        focused ? "border-[var(--ink)]" : "border-[var(--rule)]"
      }`}
    >
      <header className="flex flex-col gap-2 border-b border-[var(--rule)] pb-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-ink)]">
            {day.dateLocal === "sem-data-local"
              ? "Fora do calendário local"
              : formatDateLabel(day.dateLocal)}
          </p>
          <h3 className="font-[family-name:var(--font-serif)] text-2xl">
            {day.dateLocal} · {day.timezone}
          </h3>
        </div>
        <Badge
          className={
            day.reviewStatus === "aprovado"
              ? "border-[var(--teal)] text-[var(--teal)]"
              : "border-[var(--stamp)] text-[var(--stamp)]"
          }
        >
          {reviewLabel(day.reviewStatus)}
        </Badge>
      </header>

      {day.dayWarnings.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#8a4b00]">
          {day.dayWarnings.map((warning) => (
            <li key={warning.code + warning.message}>{warning.message}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 space-y-4">
        {day.items.map((item) => (
          <section
            key={item.id}
            className="rounded-md border border-[var(--rule)] bg-[var(--paper)] p-3"
            data-testid={`item-${item.id}`}
          >
            <div className="flex flex-wrap gap-2">
              {item.kinds.map((kind) => (
                <Badge key={kind}>{kind}</Badge>
              ))}
              {item.insufficientData ? (
                <Badge className="border-[var(--stamp)] text-[var(--stamp)]">
                  Dados insuficientes
                </Badge>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={`title-${item.id}`}>Tarefa / título</Label>
                <Input
                  id={`title-${item.id}`}
                  value={item.title}
                  maxLength={MAX_TEXT_LENGTH}
                  onChange={(event) => onTitle(item.id, event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`hours-${item.id}`}>
                  Horas estimadas (manual, opcional)
                </Label>
                <Input
                  id={`hours-${item.id}`}
                  data-testid={`hours-${item.id}`}
                  inputMode="decimal"
                  placeholder="vazio, ou 1,5 / 1.5"
                  value={item.estimatedHours ?? ""}
                  onChange={(event) => onHours(item.id, event.target.value)}
                />
                <p className="text-xs text-[var(--muted-ink)]">
                  Aceita 1,5 e 1.5. Vazio continua nulo. Não deriva de
                  timestamp.
                </p>
                <p className="text-xs text-[var(--muted-ink)]">
                  Registradas na origem:{" "}
                  {item.registeredHours == null ? "nula" : `${item.registeredHours}h`}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Label htmlFor={`desc-${item.id}`}>Descrição editável</Label>
              <Textarea
                id={`desc-${item.id}`}
                className="min-h-20"
                value={item.description}
                maxLength={MAX_TEXT_LENGTH}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onDescription(item.id, event.target.value)}
              />
            </div>
            <dl className="mt-3 grid gap-2 text-xs text-[var(--muted-ink)] md:grid-cols-2">
              <div>
                <dt className="font-semibold text-[var(--ink)]">Identidade estável</dt>
                <dd className="break-all font-mono">{item.id}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--ink)]">Timestamps originais</dt>
                <dd>{item.originalTimestamps.join(" · ") || "—"}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="font-semibold text-[var(--ink)]">Vínculos de origem</dt>
                <dd>
                  {item.originUrls.length === 0 ? (
                    "nenhum (URLs inseguras foram rejeitadas)"
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {item.originUrls.map((url) => (
                        <li key={url}>
                          <a
                            className="underline decoration-[var(--teal)] underline-offset-2"
                            href={url}
                            rel="noreferrer noopener"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
            </dl>
            {item.warnings.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-[#8a4b00]">
                {item.warnings.map((warning: Warning) => (
                  <li key={warning.code + warning.message}>
                    <span className="font-mono">{warning.code}</span> · {warning.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <fieldset className="mt-4 grid gap-3 border-t border-[var(--rule)] pt-3 md:grid-cols-[1fr_auto]">
        <legend className="sr-only">Revisão humana do dia {day.dateLocal}</legend>
        <div className="space-y-1">
          <Label htmlFor={`note-${day.dateLocal}`}>Nota de revisão</Label>
          <Input
            id={`note-${day.dateLocal}`}
            value={day.reviewNote}
            onChange={(event) => onReview(day.reviewStatus, event.target.value)}
            placeholder="Anotação humana, opcional"
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            data-testid={`approve-${day.dateLocal}`}
            onClick={() => onReview("aprovado", day.reviewNote)}
          >
            <Check className="h-4 w-4" />
            Aprovar dia
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReview("precisa_revisao", day.reviewNote)}
          >
            Marcar revisão
          </Button>
          <Button
            size="sm"
            variant="stamp"
            onClick={() => onReview("rejeitado", day.reviewNote)}
          >
            Rejeitar
          </Button>
        </div>
      </fieldset>
    </article>
  );
}
