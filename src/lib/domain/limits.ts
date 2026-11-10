import {
  MAX_ACTIVITIES,
  MAX_NATIVE_ID_LENGTH,
  MAX_PAYLOAD_BYTES,
  MAX_TEXT_LENGTH,
  MAX_URL_LENGTH,
  MAX_URLS_PER_ACTIVITY,
} from "./constants";
import type { ImportIssue } from "./types";

export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function payloadTooLarge(text: string): boolean {
  return utf8ByteLength(text) > MAX_PAYLOAD_BYTES;
}

export function tooManyActivities(count: number): boolean {
  return count > MAX_ACTIVITIES;
}

export function textTooLong(value: string): boolean {
  return value.length > MAX_TEXT_LENGTH;
}

export function nativeIdTooLong(value: string): boolean {
  return value.length > MAX_NATIVE_ID_LENGTH;
}

export function urlTooLong(value: string): boolean {
  return value.length > MAX_URL_LENGTH;
}

export function tooManyUrls(count: number): boolean {
  return count > MAX_URLS_PER_ACTIVITY;
}

export function limitIssue(
  path: string,
  message: string,
  code: ImportIssue["code"],
): ImportIssue {
  return { path, message, code };
}

export const LIMIT_COPY = {
  payload: `O JSON tem mais de ${MAX_PAYLOAD_BYTES} bytes (limite deste MVP). Reduza o arquivo.`,
  items: `Há mais de ${MAX_ACTIVITIES} atividades (limite deste MVP).`,
  text: `Texto com mais de ${MAX_TEXT_LENGTH} caracteres (limite deste MVP).`,
  nativeId: `nativeId com mais de ${MAX_NATIVE_ID_LENGTH} caracteres.`,
  url: `URL com mais de ${MAX_URL_LENGTH} caracteres ou mais de ${MAX_URLS_PER_ACTIVITY} URLs no item.`,
} as const;
