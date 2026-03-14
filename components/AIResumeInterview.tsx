import React, { useState } from 'react';
import { translations, Language } from '../constants/translations';
import { ResumeJsonData } from '../types';
import { ArrowRight, ArrowLeft, Plus, Trash2, Bot, CheckCircle2, X } from 'lucide-react';

interface AIResumeInterviewProps {
  lang: Language;
  onComplete: (resumeData: ResumeJsonData, targetRole: string) => void;
  onClose: () => void;
}

interface EducationEntry { degree: string; institution: string; dateRange: string; gpa: string }
interface ExperienceEntry { jobTitle: string; company: string; dateRange: string; bullets: string[] }
interface ProjectEntry { name: string; description: string }

const TOTAL_STEPS = 6;

const inputCls = "w-full px-4 py-2.5 bg-[#FAF9F7] border border-[#E8E2F0] rounded-xl text-sm text-[#150D30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9B4DCA]/30 focus:border-[#9B4DCA] transition-all";

export const AIResumeInterview: React.FC<AIResumeInterviewProps> = ({ lang, onComplete, onClose }) => {
  const t = translations[lang];
  const rb = t.landing.resumeBuilder;
  const isAr = lang === 'ar';

  const [step, setStep] = useState(0);

  // Step 1: Personal Info
  const [personal, setPersonal] = useState({ name: '', email: '', phone: '', location: '', linkedin: '' });

  // Step 2: Education
  const [education, setEducation] = useState<EducationEntry[]>([{ degree: '', institution: '', dateRange: '', gpa: '' }]);

  // Step 3: Experience
  const [experience, setExperience] = useState<ExperienceEntry[]>([{ jobTitle: '', company: '', dateRange: '', bullets: [''] }]);

  // Step 4: Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Step 5: Projects
  const [projects, setProjects] = useState<ProjectEntry[]>([]);

  // Step 6: Career Goal
  const [career, setCareer] = useState({ targetRole: '', summary: '' });

  const canNext = () => {
    switch (step) {
      case 0: return personal.name.trim().length > 0 && personal.email.trim().length > 0;
      case 1: return education.some(e => e.degree.trim() && e.institution.trim());
      case 2: return true; // experience is optional for fresh grads
      case 3: return skills.length >= 1;
      case 4: return true; // projects optional
      case 5: return career.targetRole.trim().length > 0;
      default: return false;
    }
  };

  const handleFinish = () => {
    const resumeData: ResumeJsonData = {
      contact: {
        name: personal.name,
        email: personal.email || null,
        phone: personal.phone || null,
        location: personal.location || null,
        linkedin: personal.linkedin || null,
      },
      summary: career.summary || null,
      workExperience: experience
        .filter(e => e.jobTitle.trim() && e.company.trim())
        .map(e => ({
          jobTitle: e.jobTitle,
          company: e.company,
          dateRange: e.dateRange || '',
          bullets: e.bullets.filter(b => b.trim()),
        })),
      education: education
        .filter(e => e.degree.trim() && e.institution.trim())
        .map(e => ({
          degree: e.degree,
          institution: e.institution,
          dateRange: e.dateRange || null,
          gpa: e.gpa || null,
        })),
      skills: skills.length > 0 ? skills : null,
      certifications: null,
      languages: null,
      additionalSections: projects.filter(p => p.name.trim()).length > 0 ? [{
        heading: isAr ? 'المشاريع' : 'Projects',
        content: projects.filter(p => p.name.trim()).map(p => `${p.name}${p.description ? ` — ${p.description}` : ''}`),
      }] : null,
    };
    onComplete(resumeData, career.targetRole);
  };

  // ── Step Renderers ──

  const renderPersonal = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#150D30] mb-1.5">{rb.personal.name} *</label>
        <input type="text" required value={personal.name} onChange={e => setPersonal(p => ({ ...p, name: e.target.value }))} className={inputCls} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#150D30] mb-1.5">{rb.personal.email} *</label>
          <input type="email" required value={personal.email} onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#150D30] mb-1.5">{rb.personal.phone}</label>
          <input type="tel" value={personal.phone} onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#150D30] mb-1.5">{rb.personal.location}</label>
          <input type="text" value={personal.location} onChange={e => setPersonal(p => ({ ...p, location: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#150D30] mb-1.5">{rb.personal.linkedin}</label>
          <input type="url" value={personal.linkedin} onChange={e => setPersonal(p => ({ ...p, linkedin: e.target.value }))} className={inputCls} />
        </div>
      </div>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-5">
      {education.map((edu, i) => (
        <div key={i} className="relative bg-[#FAF9F7] rounded-xl p-4 border border-[#E8E2F0] space-y-3">
          {education.length > 1 && (
            <button onClick={() => setEducation(ed => ed.filter((_, j) => j !== i))} className="absolute top-3 end-3 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{rb.education.degree} *</label>
              <input value={edu.degree} onChange={e => { const v = e.target.value; setEducation(ed => ed.map((x, j) => j === i ? { ...x, degree: v } : x)); }} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{rb.education.institution} *</label>
              <input value={edu.institution} onChange={e => { const v = e.target.value; setEducation(ed => ed.map((x, j) => j === i ? { ...x, institution: v } : x)); }} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{rb.education.dateRange}</label>
              <input value={edu.dateRange} onChange={e => { const v = e.target.value; setEducation(ed => ed.map((x, j) => j === i ? { ...x, dateRange: v } : x)); }} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{rb.education.gpa}</label>
              <input value={edu.gpa} onChange={e => { const v = e.target.value; setEducation(ed => ed.map((x, j) => j === i ? { ...x, gpa: v } : x)); }} className={inputCls} />
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => setEducation(ed => [...ed, { degree: '', institution: '', dateRange: '', gpa: '' }])} className="flex items-center gap-2 text-sm text-[#9B4DCA] font-medium hover:text-[#2D1065] transition-colors">
        <Plus className="w-4 h-4" /> {rb.addAnother}
      </button>
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-5">
      {experience.length === 0 && <p className="text-sm text-slate-400 text-center py-4">{rb.experience.empty}</p>}
      {experience.map((exp, i) => (
        <div key={i} className="relative bg-[#FAF9F7] rounded-xl p-4 border border-[#E8E2F0] space-y-3">
          <button onClick={() => setExperience(ex => ex.filter((_, j) => j !== i))} className="absolute top-3 end-3 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{rb.experience.jobTitle}</label>
              <input value={exp.jobTitle} onChange={e => { const v = e.target.value; setExperience(ex => ex.map((x, j) => j === i ? { ...x, jobTitle: v } : x)); }} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{rb.experience.company}</label>
              <input value={exp.company} onChange={e => { const v = e.target.value; setExperience(ex => ex.map((x, j) => j === i ? { ...x, company: v } : x)); }} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{rb.experience.dateRange}</label>
            <input value={exp.dateRange} onChange={e => { const v = e.target.value; setExperience(ex => ex.map((x, j) => j === i ? { ...x, dateRange: v } : x)); }} className={inputCls} />
          </div>
          {/* Bullets */}
          <div className="space-y-2">
            {exp.bullets.map((b, bi) => (
              <div key={bi} className="flex gap-2">
                <input
                  value={b}
                  onChange={e => {
                    const v = e.target.value;
                    setExperience(ex => ex.map((x, j) => j === i ? { ...x, bullets: x.bullets.map((bb, bj) => bj === bi ? v : bb) } : x));
                  }}
                  placeholder={rb.experience.bullet}
                  className={inputCls}
                />
                {exp.bullets.length > 1 && (
                  <button onClick={() => setExperience(ex => ex.map((x, j) => j === i ? { ...x, bullets: x.bullets.filter((_, bj) => bj !== bi) } : x))} className="text-red-400 hover:text-red-600 flex-shrink-0"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            <button
              onClick={() => setExperience(ex => ex.map((x, j) => j === i ? { ...x, bullets: [...x.bullets, ''] } : x))}
              className="text-xs text-[#9B4DCA] font-medium hover:text-[#2D1065] flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> {rb.experience.addBullet}
            </button>
          </div>
        </div>
      ))}
      <button onClick={() => setExperience(ex => [...ex, { jobTitle: '', company: '', dateRange: '', bullets: [''] }])} className="flex items-center gap-2 text-sm text-[#9B4DCA] font-medium hover:text-[#2D1065] transition-colors">
        <Plus className="w-4 h-4" /> {rb.addAnother}
      </button>
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#150D30] mb-1.5">{rb.skills.label}</label>
        <div className="flex gap-2">
          <input
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && skillInput.trim()) {
                e.preventDefault();
                setSkills(s => [...s, skillInput.trim()]);
                setSkillInput('');
              }
            }}
            placeholder={rb.skills.placeholder}
            className={inputCls}
          />
          <button
            onClick={() => { if (skillInput.trim()) { setSkills(s => [...s, skillInput.trim()]); setSkillInput(''); } }}
            className="px-4 py-2.5 bg-[#2D1065] text-white rounded-xl text-sm font-medium hover:bg-[#220C4E] transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBE5F5] text-[#2D1065] text-sm font-medium rounded-full">
              {skill}
              <button onClick={() => setSkills(s => s.filter((_, j) => j !== i))} className="text-[#9B4DCA] hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-2">{rb.skills.empty}</p>
      )}
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-4">
      {projects.length === 0 && <p className="text-sm text-slate-400 text-center py-4">{rb.projects.empty}</p>}
      {projects.map((proj, i) => (
        <div key={i} className="relative bg-[#FAF9F7] rounded-xl p-4 border border-[#E8E2F0] space-y-3">
          <button onClick={() => setProjects(p => p.filter((_, j) => j !== i))} className="absolute top-3 end-3 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{rb.projects.name}</label>
            <input value={proj.name} onChange={e => { const v = e.target.value; setProjects(p => p.map((x, j) => j === i ? { ...x, name: v } : x)); }} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{rb.projects.description}</label>
            <input value={proj.description} onChange={e => { const v = e.target.value; setProjects(p => p.map((x, j) => j === i ? { ...x, description: v } : x)); }} className={inputCls} />
          </div>
        </div>
      ))}
      <button onClick={() => setProjects(p => [...p, { name: '', description: '' }])} className="flex items-center gap-2 text-sm text-[#9B4DCA] font-medium hover:text-[#2D1065] transition-colors">
        <Plus className="w-4 h-4" /> {rb.addAnother}
      </button>
    </div>
  );

  const renderCareer = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#150D30] mb-1.5">{rb.career.targetRole} *</label>
        <input value={career.targetRole} onChange={e => setCareer(c => ({ ...c, targetRole: e.target.value }))} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#150D30] mb-1.5">{rb.career.summary}</label>
        <textarea
          value={career.summary}
          onChange={e => setCareer(c => ({ ...c, summary: e.target.value }))}
          placeholder={rb.career.summaryPlaceholder}
          rows={4}
          className={`${inputCls} resize-none`}
        />
      </div>
    </div>
  );

  const stepRenderers = [renderPersonal, renderEducation, renderExperience, renderSkills, renderProjects, renderCareer];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-up" dir={t.dir}>
      {/* Header */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#EBE5F5] text-[#2D1065] rounded-full text-xs font-medium border border-[#E8E2F0]">
          <Bot className="w-3.5 h-3.5" />
          {rb.title}
        </div>
        <h2 className="text-fluid-3xl font-bold text-[#150D30]">{rb.title}</h2>
        <p className="text-slate-500 text-sm">{rb.subtitle}</p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {rb.steps.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-emerald-500 text-white' :
                i === step ? 'bg-[#2D1065] text-white' :
                'bg-[#EBE5F5] text-slate-400'
              }`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] font-medium text-center hidden sm:block ${i === step ? 'text-[#2D1065]' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-[#EBE5F5] rounded-full overflow-hidden">
          <div className="h-full bg-[#2D1065] rounded-full transition-all duration-300" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} />
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_16px_rgba(45,16,101,0.06)] p-6 mb-6">
        <h3 className="text-lg font-semibold text-[#150D30] mb-5">{rb.steps[step]}</h3>
        {stepRenderers[step]()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {step === 0 ? (
            <button onClick={onClose} className="px-5 py-2.5 text-sm text-slate-500 font-medium hover:text-[#150D30] transition-colors">
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          ) : (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-5 py-2.5 text-sm text-slate-600 font-medium hover:text-[#150D30] transition-colors">
              <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} /> {rb.back}
            </button>
          )}
        </div>
        <div>
          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#2D1065] text-white rounded-xl text-sm font-medium hover:bg-[#220C4E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(45,16,101,0.25)]"
            >
              {rb.next} <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#C9984A] text-white rounded-xl text-sm font-medium hover:bg-[#B8863F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(201,152,74,0.4)]"
            >
              {rb.finish} <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
