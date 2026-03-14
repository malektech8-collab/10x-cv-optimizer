import { ResumeJsonData, TemplateType } from '../types';
import { renderClassic } from './classic';
import { renderModern } from './modern';
import { renderExecutive } from './executive';

export type { TemplateType };

export const TEMPLATE_NAMES: Record<TemplateType, { en: string; ar: string }> = {
  classic:   { en: 'Classic',   ar: 'كلاسيكي' },
  modern:    { en: 'Modern',    ar: 'عصري'    },
  executive: { en: 'Executive', ar: 'تنفيذي'  },
};

export function renderResumeHTML(
  data: ResumeJsonData,
  template: TemplateType,
  lang: 'en' | 'ar'
): string {
  switch (template) {
    case 'modern':    return renderModern(data, lang);
    case 'executive': return renderExecutive(data, lang);
    case 'classic':
    default:          return renderClassic(data, lang);
  }
}
