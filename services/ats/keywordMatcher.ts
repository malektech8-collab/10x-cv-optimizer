import { ParsedResumeSignals } from './resumeParser';

// Common ATS-valued keywords by category
const COMMON_ACTION_VERBS = [
  'led', 'managed', 'developed', 'implemented', 'designed', 'created', 'built',
  'delivered', 'achieved', 'increased', 'reduced', 'improved', 'optimized',
  'launched', 'coordinated', 'analyzed', 'established', 'executed', 'streamlined',
  'negotiated', 'supervised', 'trained', 'mentored', 'collaborated', 'spearheaded',
  'transformed', 'automated', 'integrated', 'resolved', 'generated', 'expanded',
  'drove', 'accelerated', 'pioneered', 'facilitated', 'oversaw', 'architected',
];

const COMMON_SOFT_SKILLS = [
  'leadership', 'communication', 'teamwork', 'problem-solving', 'problem solving',
  'critical thinking', 'time management', 'collaboration', 'adaptability',
  'project management', 'strategic planning', 'decision making', 'analytical',
  'organization', 'interpersonal', 'negotiation', 'presentation', 'mentoring',
];

export interface KeywordMatchResult {
  actionVerbCount: number;
  actionVerbsFound: string[];
  softSkillCount: number;
  softSkillsFound: string[];
  uniqueKeywordDensity: number; // ratio of unique meaningful words
  bulletsStartingWithVerb: number;
  bulletsStartingWithVerbRatio: number;
}

export function matchKeywords(signals: ParsedResumeSignals): KeywordMatchResult {
  const allText = [
    ...signals.allBullets,
    ...signals.allSkills,
  ].join(' ').toLowerCase();

  const actionVerbsFound = COMMON_ACTION_VERBS.filter(verb => {
    const regex = new RegExp(`\\b${verb}\\b`, 'i');
    return regex.test(allText);
  });

  const softSkillsFound = COMMON_SOFT_SKILLS.filter(skill => {
    return allText.includes(skill.toLowerCase());
  });

  // Check how many bullets start with an action verb
  let bulletsStartingWithVerb = 0;
  for (const bullet of signals.allBullets) {
    const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    if (firstWord && COMMON_ACTION_VERBS.some(v => v === firstWord || firstWord.startsWith(v))) {
      bulletsStartingWithVerb++;
    }
  }

  // Unique keyword density: unique words / total words in skills + bullets
  const words = allText.split(/\s+/).filter(w => w.length > 2);
  const uniqueWords = new Set(words);
  const uniqueKeywordDensity = words.length > 0 ? uniqueWords.size / words.length : 0;

  return {
    actionVerbCount: actionVerbsFound.length,
    actionVerbsFound,
    softSkillCount: softSkillsFound.length,
    softSkillsFound,
    uniqueKeywordDensity,
    bulletsStartingWithVerb,
    bulletsStartingWithVerbRatio: signals.totalBullets > 0
      ? bulletsStartingWithVerb / signals.totalBullets
      : 0,
  };
}
