import {
  IDENTITY_VERSION,
  type ActivityKind,
  type SourceKind,
} from "./constants";

export function normalizeNativeId(nativeId: string): string {
  return nativeId.normalize("NFC").trim();
}

export function buildStableId(input: {
  sourceKind: SourceKind;
  kind: ActivityKind;
  nativeId: string;
}): string {
  const nativeId = normalizeNativeId(input.nativeId);
  return `${IDENTITY_VERSION}|${input.sourceKind}|${input.kind}|${nativeId}`;
}

export function parseStableId(stableId: string): {
  version: string;
  sourceKind: string;
  kind: string;
  nativeId: string;
} | null {
  const parts = stableId.split("|");
  if (parts.length < 4) return null;
  const [version, sourceKind, kind, ...rest] = parts;
  return { version, sourceKind, kind, nativeId: rest.join("|") };
}
