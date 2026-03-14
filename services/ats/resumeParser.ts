import { ResumeJsonData } from '../../types';

export interface ParsedResumeSignals {
  // Contact completeness
  hasName: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasLocation: boolean;
  hasLinkedin: boolean;
  hasWebsite: boolean;
  contactFieldCount: number;

  // Sections present
  hasSummary: boolean;
  hasWorkExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  hasCertifications: boolean;
  hasLanguages: boolean;
  hasAdditionalSections: boolean;
  sectionCount: number;

  // Work experience metrics
  jobCount: number;
  totalBullets: number;
  avgBulletsPerJob: number;
  bulletsWithNumbers: number;
  shortBullets: number; // bullets under 20 chars
  longBullets: number;  // bullets over 200 chars

  // Skills
  skillCount: number;

  // Education
  educationCount: number;
  hasGPA: boolean;

  // Certifications
  certCount: number;

  // Raw arrays for deeper analysis
  allBullets: string[];
  allSkills: string[];
  allJobTitles: string[];
}

export function parseResumeSignals(resume: ResumeJsonData): ParsedResumeSignals {
  const contact = resume.contact || {} as any;
  const work = resume.workExperience || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  const certs = resume.certifications || [];
  const langs = resume.languages || [];
  const additional = resume.additionalSections || [];

  const allBullets = work.flatMap(j => j.bullets || []);
  const allJobTitles = work.map(j => j.jobTitle).filter(Boolean);

  const hasName = !!contact.name?.trim();
  const hasEmail = !!contact.email?.trim();
  const hasPhone = !!contact.phone?.trim();
  const hasLocation = !!contact.location?.trim();
  const hasLinkedin = !!contact.linkedin?.trim();
  const hasWebsite = !!contact.website?.trim();
  const contactFieldCount = [hasName, hasEmail, hasPhone, hasLocation, hasLinkedin, hasWebsite].filter(Boolean).length;

  const hasSummary = !!resume.summary?.trim();
  const hasWorkExperience = work.length > 0;
  const hasEducation = education.length > 0;
  const hasSkills = skills.length > 0;
  const hasCertifications = certs.length > 0;
  const hasLanguages = langs.length > 0;
  const hasAdditionalSections = additional.length > 0;

  const sectionCount = [hasSummary, hasWorkExperience, hasEducation, hasSkills, hasCertifications, hasLanguages, hasAdditionalSections].filter(Boolean).length;

  const bulletsWithNumbers = allBullets.filter(b => /\d+/.test(b)).length;
  const shortBullets = allBullets.filter(b => b.length < 20).length;
  const longBullets = allBullets.filter(b => b.length > 200).length;

  return {
    hasName, hasEmail, hasPhone, hasLocation, hasLinkedin, hasWebsite, contactFieldCount,
    hasSummary, hasWorkExperience, hasEducation, hasSkills, hasCertifications, hasLanguages, hasAdditionalSections, sectionCount,
    jobCount: work.length,
    totalBullets: allBullets.length,
    avgBulletsPerJob: work.length > 0 ? allBullets.length / work.length : 0,
    bulletsWithNumbers,
    shortBullets,
    longBullets,
    skillCount: skills.length,
    educationCount: education.length,
    hasGPA: education.some(e => !!e.gpa?.trim()),
    certCount: certs.length,
    allBullets,
    allSkills: skills,
    allJobTitles,
  };
}
