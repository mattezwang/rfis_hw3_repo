// Simulated clock for the seeded service day.
// Implements: A-17 (simulated time starting 14:30), research.md R-5, constitution Principle V
// (injectable time so every scenario is reproducible).
import type { Minutes } from './types';
import { hm } from './time';

export const SIMULATION_START: Minutes = hm(14, 30);

export interface Clock {
  now(): Minutes;
}

/** Simulated time = start + real minutes elapsed since `originMs`. */
export function simulatedClock(originMs: number, start: Minutes = SIMULATION_START): Clock {
  return {
    now: () => start + Math.floor((Date.now() - originMs) / 60000),
  };
}

/** Fixed clock for tests. */
export function fixedClock(at: Minutes): Clock {
  return { now: () => at };
}
