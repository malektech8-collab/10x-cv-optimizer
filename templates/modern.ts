import { ResumeJsonData } from '../types';

function esc(s?: string | null): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function contactLine(data: ResumeJsonData): string {
  const parts = [
    data.contact.email,
    data.contact.phone,
    data.contact.location,
    data.contact.linkedin,
    data.contact.website,
  ].filter(Boolean).map(esc);
  return parts.join(' | ');
}

export function renderModern(data: ResumeJsonData, lang: 'en' | 'ar'): string {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const align = lang === 'ar' ? 'right' : 'left';

  let body = '';

  // Header
  body += `<header>`;
  body += `<h1>${esc(data.contact.name)}</h1>`;
  const contact = contactLine(data);
  if (contact) body += `<p class="contact">${contact}</p>`;
  body += `</header>`;

  // Summary
  if (data.summary) {
    body += `<div class="section">`;
    body += `<h2>${lang === 'ar' ? 'الملخص' : 'Summary'}</h2>`;
    body += `<p>${esc(data.summary)}</p>`;
    body += `</div>`;
  }

  // Skills
  if (data.skills?.length) {
    body += `<div class="section">`;
    body += `<h2>${lang === 'ar' ? 'المهارات الأساسية' : 'Core Skills'}</h2>`;
    body += `<p>${data.skills.map(esc).join(' &bull; ')}</p>`;
    body += `</div>`;
  }

  // Work Experience
  if (data.workExperience?.length) {
    body += `<div class="section">`;
    body += `<h2>${lang === 'ar' ? 'الخبرة' : 'Experience'}</h2>`;
    for (const job of data.workExperience) {
      body += `<h3>${esc(job.jobTitle)} &mdash; ${esc(job.company)}</h3>`;
      const meta: string[] = [];
      if (job.location) meta.push(esc(job.location)!);
      if (job.dateRange) meta.push(esc(job.dateRange)!);
      if (meta.length) body += `<p>${meta.join(' | ')}</p>`;
      if (job.bullets?.length) {
        body += '<ul>';
        for (const b of job.bullets) body += `<li>${esc(b)}</li>`;
        body += '</ul>';
      }
    }
    body += `</div>`;
  }

  // Education
  if (data.education?.length) {
    body += `<div class="section">`;
    body += `<h2>${lang === 'ar' ? 'التعليم' : 'Education'}</h2>`;
    for (const edu of data.education) {
      let line = `<strong>${esc(edu.degree)}</strong>, ${esc(edu.institution)}`;
      if (edu.dateRange) line += ` (${esc(edu.dateRange)})`;
      if (edu.gpa) line += ` &mdash; GPA: ${esc(edu.gpa)}`;
      if (edu.honors) line += ` &mdash; ${esc(edu.honors)}`;
      body += `<p>${line}</p>`;
    }
    body += `</div>`;
  }

  // Certifications
  if (data.certifications?.length) {
    body += `<div class="section">`;
    body += `<h2>${lang === 'ar' ? 'الشهادات' : 'Certifications'}</h2>`;
    body += '<ul>';
    for (const c of data.certifications) {
      let line = esc(c.name);
      if (c.issuer) line += ` &mdash; ${esc(c.issuer)}`;
      if (c.date) line += ` (${esc(c.date)})`;
      body += `<li>${line}</li>`;
    }
    body += '</ul>';
    body += `</div>`;
  }

  // Languages
  if (data.languages?.length) {
    body += `<div class="section">`;
    body += `<h2>${lang === 'ar' ? 'اللغات' : 'Languages'}</h2>`;
    body += `<p>${data.languages.map(esc).join(' &bull; ')}</p>`;
    body += `</div>`;
  }

  // Additional sections
  if (data.additionalSections?.length) {
    for (const section of data.additionalSections) {
      body += `<div class="section">`;
      body += `<h2>${esc(section.heading)}</h2>`;
      body += '<ul>';
      for (const item of section.content) body += `<li>${esc(item)}</li>`;
      body += '</ul>';
      body += `</div>`;
    }
  }

  return `<!DOCTYPE html>
<html dir="${dir}">
<head>
<meta charset="UTF-8">
<title>Resume</title>
<style>
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #222;
    margin: 0 auto;
    padding: 0.5in;
    max-width: 8.5in;
    direction: ${dir};
    text-align: ${align};
  }
  header {
    margin-bottom: 15px;
  }
  h1 {
    font-size: 24pt;
    color: #000;
    margin: 0 0 4px;
  }
  .contact {
    color: #666;
    font-size: 10pt;
  }
  .section {
    margin-top: 18px;
  }
  .section h2 {
    font-size: 13pt;
    color: #000;
    border-bottom: 2px solid #000;
    padding-bottom: 4px;
    margin: 0 0 8px;
  }
  h3 {
    font-size: 11pt;
    color: #000;
    margin: 10px 0 2px;
  }
  p { margin: 2px 0 6px; }
  ul { margin: 4px 0 8px; padding-inline-start: 18px; }
  li { margin-bottom: 2px; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}
