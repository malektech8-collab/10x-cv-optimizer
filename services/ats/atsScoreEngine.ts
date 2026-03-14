import { ResumeJsonData } from '../../types';
import { parseResumeSignals, ParsedResumeSignals } from './resumeParser';
import { matchKeywords, KeywordMatchResult } from './keywordMatcher';
import { detectImpact, ImpactResult } from './impactDetector';

export interface ATSScoreBreakdown {
  formatting: number;   // 0-25
  keywords: number;     // 0-25
  impact: number;       // 0-25
  structure: number;    // 0-25
  total: number;        // 0-100
}

export interface ATSAnalysisDetail {
  scores: ATSScoreBreakdown;
  signals: ParsedResumeSignals;
  keywordMatch: KeywordMatchResult;
  impactResult: ImpactResult;
  issues: string[];
  strengths: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Formatting Score (0-25) ──
// Contact info completeness, summary presence, no overly short/long bullets
function scoreFormatting(signals: ParsedResumeSignals): number {
  let score = 0;

  // Contact info (up to 10 points)
  if (signals.hasName) score += 2;
  if (signals.hasEmail) score += 2;
  if (signals.hasPhone) score += 2;
  if (signals.hasLocation) score += 1.5;
  if (signals.hasLinkedin) score += 1.5;
  if (signals.hasWebsite) score += 1;

  // Summary/objective present (4 points)
  if (signals.hasSummary) score += 4;

  // Bullet quality (up to 6 points)
  if (signals.totalBullets > 0) {
    const shortRatio = signals.shortBullets / signals.totalBullets;
    const longRatio = signals.longBullets / signals.totalBullets;
    // Penalize short bullets
    score += (1 - shortRatio) * 3;
    // Penalize excessively long bullets
    score += (1 - longRatio) * 3;
  } else {
    // No bullets at all — lose these points
  }

  // Reasonable number of sections (up to 5 points)
  if (signals.sectionCount >= 5) score += 5;
  else if (signals.sectionCount >= 4) score += 4;
  else if (signals.sectionCount >= 3) score += 3;
  else score += signals.sectionCount;

  return clamp(Math.round(score), 0, 25);
}

// ── Keyword Score (0-25) ──
// Action verbs, soft skills, skill count, keyword density
function scoreKeywords(signals: ParsedResumeSignals, keywords: KeywordMatchResult): number {
  let score = 0;

  // Skills section richness (up to 8 points)
  if (signals.skillCount >= 10) score += 8;
  else if (signals.skillCount >= 6) score += 6;
  else if (signals.skillCount >= 3) score += 4;
  else if (signals.skillCount > 0) score += 2;

  // Action verbs found (up to 7 points)
  if (keywords.actionVerbCount >= 10) score += 7;
  else if (keywords.actionVerbCount >= 6) score += 5;
  else if (keywords.actionVerbCount >= 3) score += 3;
  else if (keywords.actionVerbCount > 0) score += 1;

  // Bullets starting with action verbs (up to 5 points)
  if (keywords.bulletsStartingWithVerbRatio >= 0.7) score += 5;
  else if (keywords.bulletsStartingWithVerbRatio >= 0.4) score += 3;
  else if (keywords.bulletsStartingWithVerbRatio > 0) score += 1;

  // Soft skills (up to 5 points)
  if (keywords.softSkillCount >= 5) score += 5;
  else if (keywords.softSkillCount >= 3) score += 3;
  else if (keywords.softSkillCount > 0) score += 1;

  return clamp(Math.round(score), 0, 25);
}

// ── Impact Score (0-25) ──
// Quantified achievements, metrics, impact language
function scoreImpact(signals: ParsedResumeSignals, impact: ImpactResult): number {
  let score = 0;

  // Bullets with quantified metrics (up to 10 points)
  if (impact.bulletsWithMetricsRatio >= 0.5) score += 10;
  else if (impact.bulletsWithMetricsRatio >= 0.3) score += 7;
  else if (impact.bulletsWithMetricsRatio >= 0.15) score += 4;
  else if (impact.bulletsWithMetrics > 0) score += 2;

  // Impact phrases (up to 5 points)
  if (impact.bulletsWithImpactPhrases >= 5) score += 5;
  else if (impact.bulletsWithImpactPhrases >= 3) score += 3;
  else if (impact.bulletsWithImpactPhrases > 0) score += 1;

  // Metric variety (up to 6 points)
  if (impact.hasPercentageMetrics) score += 2;
  if (impact.hasFinancialMetrics) score += 2;
  if (impact.hasTeamMetrics) score += 2;

  // Overall metric density (up to 4 points)
  if (impact.totalMetricMatches >= 8) score += 4;
  else if (impact.totalMetricMatches >= 4) score += 2;
  else if (impact.totalMetricMatches > 0) score += 1;

  return clamp(Math.round(score), 0, 25);
}

// ── Structure Score (0-25) ──
// Section presence, ordering, bullet counts, education
function scoreStructure(signals: ParsedResumeSignals): number {
  let score = 0;

  // Core sections present (up to 12 points)
  if (signals.hasWorkExperience) score += 4;
  if (signals.hasEducation) score += 3;
  if (signals.hasSkills) score += 3;
  if (signals.hasSummary) score += 2;

  // Adequate bullet points per job (up to 5 points)
  if (signals.avgBulletsPerJob >= 4) score += 5;
  else if (signals.avgBulletsPerJob >= 3) score += 4;
  else if (signals.avgBulletsPerJob >= 2) score += 2;
  else if (signals.totalBullets > 0) score += 1;

  // Certifications or additional sections (up to 4 points)
  if (signals.hasCertifications) score += 2;
  if (signals.hasAdditionalSections) score += 1;
  if (signals.hasLanguages) score += 1;

  // Multiple work experiences (up to 4 points)
  if (signals.jobCount >= 3) score += 4;
  else if (signals.jobCount >= 2) score += 3;
  else if (signals.jobCount >= 1) score += 1;

  return clamp(Math.round(score), 0, 25);
}

// ── Issue & Strength Detection ──
function detectIssuesAndStrengths(
  signals: ParsedResumeSignals,
  keywords: KeywordMatchResult,
  impact: ImpactResult,
  targetLang: 'en' | 'ar',
): { issues: string[]; strengths: string[] } {
  const issues: string[] = [];
  const strengths: string[] = [];
  const isAr = targetLang === 'ar';

  // Contact issues
  if (!signals.hasEmail) issues.push(isAr ? 'البريد الإلكتروني مفقود من معلومات الاتصال' : 'Email address missing from contact info');
  if (!signals.hasPhone) issues.push(isAr ? 'رقم الهاتف مفقود من معلومات الاتصال' : 'Phone number missing from contact info');
  if (!signals.hasLinkedin) issues.push(isAr ? 'رابط LinkedIn مفقود — مهم لأنظمة ATS' : 'LinkedIn URL missing — important for ATS systems');

  // Structure issues
  if (!signals.hasSummary) issues.push(isAr ? 'لا يوجد ملخص احترافي — أضف ملخصاً يتضمن كلمات مفتاحية' : 'No professional summary — add a keyword-rich summary section');
  if (!signals.hasSkills) issues.push(isAr ? 'قسم المهارات مفقود — ضروري لمطابقة ATS' : 'Skills section missing — critical for ATS keyword matching');
  if (signals.skillCount > 0 && signals.skillCount < 5) issues.push(isAr ? 'قائمة المهارات قصيرة — أضف المزيد من المهارات التقنية والشخصية' : 'Skills list is thin — add more technical and soft skills');

  // Impact issues
  if (impact.bulletsWithMetricsRatio < 0.2) issues.push(isAr ? 'معظم النقاط تفتقر إلى أرقام — حدد إنجازاتك بالأرقام' : 'Most bullets lack numbers — quantify your achievements');
  if (keywords.bulletsStartingWithVerbRatio < 0.4) issues.push(isAr ? 'النقاط لا تبدأ بأفعال قوية — ابدأ كل نقطة بفعل عمل' : 'Bullets don\'t lead with action verbs — start each bullet with a strong verb');

  // Formatting issues
  if (signals.shortBullets > 2) issues.push(isAr ? 'بعض النقاط قصيرة جداً — أضف المزيد من التفاصيل والسياق' : 'Some bullets are too short — add more detail and context');
  if (signals.longBullets > 2) issues.push(isAr ? 'بعض النقاط طويلة جداً — قسمها إلى نقاط أقصر' : 'Some bullets are too long — break them into shorter points');
  if (signals.avgBulletsPerJob < 2 && signals.hasWorkExperience) issues.push(isAr ? 'عدد قليل من النقاط لكل وظيفة — أضف 3-5 نقاط لكل دور' : 'Few bullet points per job — aim for 3-5 bullets per role');

  // Strengths
  if (signals.contactFieldCount >= 4) strengths.push(isAr ? 'معلومات الاتصال شاملة' : 'Comprehensive contact information');
  if (signals.hasSummary) strengths.push(isAr ? 'يحتوي على ملخص احترافي' : 'Professional summary present');
  if (signals.skillCount >= 8) strengths.push(isAr ? 'قائمة مهارات غنية' : 'Rich skills inventory');
  if (impact.bulletsWithMetricsRatio >= 0.3) strengths.push(isAr ? 'إنجازات محددة بالأرقام' : 'Well-quantified achievements');
  if (keywords.bulletsStartingWithVerbRatio >= 0.6) strengths.push(isAr ? 'استخدام جيد لأفعال العمل' : 'Strong use of action verbs');
  if (signals.sectionCount >= 5) strengths.push(isAr ? 'هيكل شامل وأقسام متنوعة' : 'Comprehensive structure with diverse sections');
  if (signals.hasCertifications) strengths.push(isAr ? 'شهادات مهنية مدرجة' : 'Professional certifications included');
  if (impact.hasFinancialMetrics) strengths.push(isAr ? 'مقاييس مالية مذكورة' : 'Financial metrics referenced');

  return {
    issues: issues.slice(0, 6),    // cap at 6
    strengths: strengths.slice(0, 5), // cap at 5
  };
}

// ═══════════════════════════════════════════════════════════════
//  MAIN: Deterministic ATS Analysis
// ═══════════════════════════════════════════════════════════════

export function runDeterministicATS(
  resume: ResumeJsonData,
  targetLang: 'en' | 'ar' = 'en',
): ATSAnalysisDetail {
  const signals = parseResumeSignals(resume);
  const keywordMatch = matchKeywords(signals);
  const impactResult = detectImpact(signals);

  const formatting = scoreFormatting(signals);
  const keywords = scoreKeywords(signals, keywordMatch);
  const impact = scoreImpact(signals, impactResult);
  const structure = scoreStructure(signals);
  const total = formatting + keywords + impact + structure;

  const { issues, strengths } = detectIssuesAndStrengths(signals, keywordMatch, impactResult, targetLang);

  return {
    scores: { formatting, keywords, impact, structure, total },
    signals,
    keywordMatch,
    impactResult,
    issues,
    strengths,
  };
}
