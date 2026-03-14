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

export function renderClassic(data: ResumeJsonData, lang: 'en' | 'ar'): string {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const align = lang === 'ar' ? 'right' : 'left';

  let body = '';

  // Header
  body += `<h1>${esc(data.contact.name)}</h1>`;
  const contact = contactLine(data);
  if (contact) body += `<p>${contact}</p>`;

  // Summary
  if (data.summary) {
    body += `<h2>${lang === 'ar' ? 'الملخص المهني' : 'Professional Summary'}</h2>`;
    body += `<p>${esc(data.summary)}</p>`;
  }

  // Skills
  if (data.skills?.length) {
    body += `<h2>${lang === 'ar' ? 'المهارات' : 'Skills'}</h2>`;
    body += `<p>${data.skills.map(esc).join(' &bull; ')}</p>`;
  }

  // Work Experience
  if (data.workExperience?.length) {
    body += `<h2>${lang === 'ar' ? 'الخبرة المهنية' : 'Professional Experience'}</h2>`;
    for (const job of data.workExperience) {
      body += `<h3>${esc(job.jobTitle)}</h3>`;
      let companyLine = `<strong>${esc(job.company)}</strong>`;
      if (job.location) companyLine += ` &mdash; ${esc(job.location)}`;
      body += `<p>${companyLine}</p>`;
      if (job.dateRange) body += `<p>${esc(job.dateRange)}</p>`;
      if (job.bullets?.length) {
        body += '<ul>';
        for (const b of job.bullets) body += `<li>${esc(b)}</li>`;
        body += '</ul>';
      }
    }
  }

  // Education
  if (data.education?.length) {
    body += `<h2>${lang === 'ar' ? 'التعليم' : 'Education'}</h2>`;
    for (const edu of data.education) {
      let line = `<strong>${esc(edu.degree)}</strong>, ${esc(edu.institution)}`;
      if (edu.gpa) line += ` &mdash; GPA: ${esc(edu.gpa)}`;
      if (edu.honors) line += ` &mdash; ${esc(edu.honors)}`;
      body += `<p>${line}</p>`;
      if (edu.dateRange) body += `<p>${esc(edu.dateRange)}</p>`;
    }
  }

  // Certifications
  if (data.certifications?.length) {
    body += `<h2>${lang === 'ar' ? 'الشهادات' : 'Certifications'}</h2>`;
    body += '<ul>';
    for (const c of data.certifications) {
      let line = esc(c.name);
      if (c.issuer) line += ` &mdash; ${esc(c.issuer)}`;
      if (c.date) line += ` (${esc(c.date)})`;
      body += `<li>${line}</li>`;
    }
    body += '</ul>';
  }

  // Languages
  if (data.languages?.length) {
    body += `<h2>${lang === 'ar' ? 'اللغات' : 'Languages'}</h2>`;
    body += `<p>${data.languages.map(esc).join(' &bull; ')}</p>`;
  }

  // Additional sections
  if (data.additionalSections?.length) {
    for (const section of data.additionalSections) {
      body += `<h2>${esc(section.heading)}</h2>`;
      body += '<ul>';
      for (const item of section.content) body += `<li>${esc(item)}</li>`;
      body += '</ul>';
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
    color: #333;
    margin: 0 auto;
    padding: 0.5in;
    max-width: 8.5in;
    direction: ${dir};
    text-align: ${align};
  }
  h1 {
    font-size: 22pt;
    color: #000;
    margin: 0 0 5px;
  }
  h2 {
    font-size: 13pt;
    color: #000;
    margin-top: 20px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 4px;
  }
  h3 {
    font-size: 11.5pt;
    color: #000;
    margin: 10px 0 3px;
  }
  p { margin: 2px 0 6px; }
  ul { margin: 5px 0 10px; padding-inline-start: 18px; }
  li { margin-bottom: 2px; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}
