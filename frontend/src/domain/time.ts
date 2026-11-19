// Time helpers for the simulated service day.
// Implements: A-14 (30-minute pickup window), A-11 (service-day bounds).
import type { Minutes } from './types';

export const WINDOW_LENGTH: Minutes = 30;

export function windowEnd(windowStart: Minutes): Minutes {
  return windowStart + WINDOW_LENGTH;
}

export function hm(h: number, m: number): Minutes {
  return h * 60 + m;
}

/** 1050 -> "17:30". Whole minutes only. */
export function fmt(t: Minutes | null | undefined): string {
  if (t === null || t === undefined) return '—';
  const total = Math.round(t);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function fmtWindow(windowStart: Minutes): string {
  return `${fmt(windowStart)}–${fmt(windowEnd(windowStart))}`;
}

/** "17:30" -> 1050. Returns null for anything that is not HH:MM. */
export function parseHM(value: string): Minutes | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}
