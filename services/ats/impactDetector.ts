import { ParsedResumeSignals } from './resumeParser';

// Patterns that indicate quantified impact
const METRIC_PATTERNS = [
  /\d+%/,                          // percentages
  /\$[\d,]+/,                      // dollar amounts
  /\d+\+?\s*(years?|months?)/i,    // time periods
  /\d+\+?\s*(people|team|members|staff|employees|clients|customers|users)/i, // team/people
  /\d+\+?\s*(projects?|accounts?|departments?)/i, // scale
  /increased.*\d/i,                // increased + number
  /reduced.*\d/i,                  // reduced + number
  /improved.*\d/i,                 // improved + number
  /grew.*\d/i,                     // grew + number
  /saved.*\d/i,                    // saved + number
  /generated.*\d/i,               // generated + number
  /\d+[kKmMbB]\b/,                // shorthand numbers (5K, 2M)
  /revenue|profit|budget|cost/i,   // financial terms
  /roi|kpi|sla|nps/i,            // business metrics
];

const IMPACT_PHRASES = [
  /result(ed|ing) in/i,
  /leading to/i,
  /which (led|resulted|contributed)/i,
  /contributing to/i,
  /driving/i,
  /enabling/i,
  /achieving/i,
  /surpass(ed|ing)/i,
  /exceed(ed|ing)/i,
  /outperform(ed|ing)/i,
];

export interface ImpactResult {
  bulletsWithMetrics: number;
  bulletsWithMetricsRatio: number;
  bulletsWithImpactPhrases: number;
  totalMetricMatches: number;
  hasFinancialMetrics: boolean;
  hasTeamMetrics: boolean;
  hasPercentageMetrics: boolean;
  impactScore: number; // 0-100 raw impact quality score
}

export function detectImpact(signals: ParsedResumeSignals): ImpactResult {
  let bulletsWithMetrics = 0;
  let bulletsWithImpactPhrases = 0;
  let totalMetricMatches = 0;
  let hasFinancialMetrics = false;
  let hasTeamMetrics = false;
  let hasPercentageMetrics = false;

  for (const bullet of signals.allBullets) {
    let bulletHasMetric = false;

    for (const pattern of METRIC_PATTERNS) {
      if (pattern.test(bullet)) {
        totalMetricMatches++;
        bulletHasMetric = true;
      }
    }

    if (bulletHasMetric) bulletsWithMetrics++;

    for (const phrase of IMPACT_PHRASES) {
      if (phrase.test(bullet)) {
        bulletsWithImpactPhrases++;
        break;
      }
    }

    if (/\$[\d,]+|revenue|profit|budget|cost/i.test(bullet)) hasFinancialMetrics = true;
    if (/\d+\+?\s*(people|team|members|staff|employees)/i.test(bullet)) hasTeamMetrics = true;
    if (/\d+%/.test(bullet)) hasPercentageMetrics = true;
  }

  // Calculate raw impact quality score (0-100)
  const totalBullets = signals.totalBullets || 1;
  const metricRatio = bulletsWithMetrics / totalBullets;
  const impactPhraseRatio = bulletsWithImpactPhrases / totalBullets;

  let impactScore = 0;
  impactScore += Math.min(metricRatio * 60, 40);          // up to 40 for metrics
  impactScore += Math.min(impactPhraseRatio * 40, 25);    // up to 25 for impact phrases
  impactScore += hasFinancialMetrics ? 10 : 0;
  impactScore += hasTeamMetrics ? 10 : 0;
  impactScore += hasPercentageMetrics ? 10 : 0;
  impactScore += signals.bulletsWithNumbers > 3 ? 5 : 0;

  return {
    bulletsWithMetrics,
    bulletsWithMetricsRatio: totalBullets > 0 ? bulletsWithMetrics / totalBullets : 0,
    bulletsWithImpactPhrases,
    totalMetricMatches,
    hasFinancialMetrics,
    hasTeamMetrics,
    hasPercentageMetrics,
    impactScore: Math.min(Math.round(impactScore), 100),
  };
}
