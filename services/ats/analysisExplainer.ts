import { ATSScoreBreakdown } from './atsScoreEngine';

export interface ATSExplanation {
  score: number;
  atsCompatibility: 'Low' | 'Medium' | 'High';
  summary: string;
  formattingAdvice: string;
  keywordsAdvice: string;
  impactAdvice: string;
  structureAdvice: string;
}

function getCompatibility(total: number): 'Low' | 'Medium' | 'High' {
  if (total >= 70) return 'High';
  if (total >= 45) return 'Medium';
  return 'Low';
}

export function explainScores(
  scores: ATSScoreBreakdown,
  issues: string[],
  strengths: string[],
  targetLang: 'en' | 'ar',
): ATSExplanation {
  const isAr = targetLang === 'ar';
  const compat = getCompatibility(scores.total);

  // Generate summary based on score range
  let summary: string;
  if (scores.total >= 80) {
    summary = isAr
      ? 'سيرتك الذاتية قوية ومتوافقة مع أنظمة ATS. تحسينات طفيفة يمكن أن ترفعها إلى مستوى مثالي.'
      : 'Your resume is strong and ATS-compatible. Minor tweaks can push it to a perfect score.';
  } else if (scores.total >= 60) {
    summary = isAr
      ? 'سيرتك الذاتية جيدة لكنها تحتاج تحسينات في بعض المجالات لتجاوز أنظمة الفلترة بشكل أفضل.'
      : 'Your resume is decent but needs improvements in key areas to consistently pass ATS filters.';
  } else if (scores.total >= 40) {
    summary = isAr
      ? 'سيرتك الذاتية تحتاج عمل كبير. أنظمة ATS قد ترفضها قبل أن يراها مسؤول التوظيف.'
      : 'Your resume needs significant work. ATS systems may filter it out before a recruiter ever sees it.';
  } else {
    summary = isAr
      ? 'سيرتك الذاتية في حالة حرجة. معظم أنظمة ATS سترفضها. التحسين الشامل ضروري.'
      : 'Your resume is in critical shape. Most ATS systems will reject it. A comprehensive overhaul is needed.';
  }

  // Category-specific advice
  const formattingAdvice = scores.formatting >= 20
    ? (isAr ? 'التنسيق ممتاز — معلومات الاتصال واضحة والأقسام منظمة.' : 'Formatting is excellent — contact info is clear and sections are well-organized.')
    : scores.formatting >= 12
    ? (isAr ? 'التنسيق جيد لكن تأكد من وجود جميع معلومات الاتصال وملخص احترافي.' : 'Formatting is decent but ensure all contact details and a professional summary are present.')
    : (isAr ? 'التنسيق يحتاج تحسين كبير — أضف معلومات الاتصال الناقصة وملخص احترافي.' : 'Formatting needs major improvement — add missing contact info and a professional summary.');

  const keywordsAdvice = scores.keywords >= 20
    ? (isAr ? 'كلمات مفتاحية قوية — استخدام ممتاز لأفعال العمل والمهارات.' : 'Strong keyword presence — excellent use of action verbs and skills.')
    : scores.keywords >= 12
    ? (isAr ? 'الكلمات المفتاحية متوسطة — أضف المزيد من المهارات التقنية وابدأ كل نقطة بفعل عمل.' : 'Keyword presence is moderate — add more technical skills and lead each bullet with an action verb.')
    : (isAr ? 'الكلمات المفتاحية ضعيفة — أنظمة ATS لن تجد ما تبحث عنه. أضف قسم مهارات شامل.' : 'Keyword presence is weak — ATS systems won\'t find what they\'re looking for. Add a comprehensive skills section.');

  const impactAdvice = scores.impact >= 20
    ? (isAr ? 'إنجازاتك محددة بالأرقام بشكل ممتاز — هذا يميزك عن المنافسين.' : 'Your achievements are well-quantified — this sets you apart from competitors.')
    : scores.impact >= 12
    ? (isAr ? 'بعض الإنجازات محددة بالأرقام. أضف المزيد من المقاييس: نسب مئوية، أرقام مالية، حجم الفريق.' : 'Some achievements are quantified. Add more metrics: percentages, dollar amounts, team sizes.')
    : (isAr ? 'الإنجازات غير محددة بالأرقام — حول المهام إلى إنجازات قابلة للقياس.' : 'Achievements lack quantification — transform duties into measurable accomplishments.');

  const structureAdvice = scores.structure >= 20
    ? (isAr ? 'الهيكل ممتاز — جميع الأقسام الأساسية موجودة ومنظمة.' : 'Structure is excellent — all essential sections are present and well-organized.')
    : scores.structure >= 12
    ? (isAr ? 'الهيكل جيد لكن بعض الأقسام ناقصة أو تحتاج المزيد من التفاصيل.' : 'Structure is good but some sections are missing or need more detail.')
    : (isAr ? 'الهيكل ضعيف — أضف الأقسام الناقصة وزد عدد النقاط لكل وظيفة.' : 'Structure is weak — add missing sections and increase bullets per job role.');

  return {
    score: scores.total,
    atsCompatibility: compat,
    summary,
    formattingAdvice,
    keywordsAdvice,
    impactAdvice,
    structureAdvice,
  };
}
