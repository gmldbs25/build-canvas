import type { AnalysisReport } from '@/sim/analysisTypes';

type Rail = AnalysisReport['rails'][number];

/** Occupancy alone is movement, not evidence of congestion. Thresholds use vehicle-seconds. */
export function railAnalysisVisual(rail: Rail | undefined, mode: 'current' | 'recent' = 'recent', observedSeconds = 0) {
  if (rail?.closed) return { active: true, color: '#84649e', state: 'closed' as const };
  if (!rail) return { active: false, color: '#778481', state: 'normal' as const };
  const waiting = mode === 'current' ? rail.currentQueue > 0 : rail.waitingSeconds >= .5;
  const congested = mode === 'current' ? rail.currentQueue >= 3 : observedSeconds > 0 && rail.waitingSeconds / observedSeconds >= .5;
  return { active: waiting, color: congested ? '#c16b54' : '#c29343', state: waiting ? congested ? 'congested' as const : 'waiting' as const : 'normal' as const };
}
