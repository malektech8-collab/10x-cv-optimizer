import React from 'react';
import { translations, Language } from '../../constants/translations';
import { FileUpload } from '../FileUpload';

interface ATSUploadLeadMagnetProps {
  lang: Language;
  targetLang: Language;
  onTargetLangChange: (lang: Language) => void;
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const ATSUploadLeadMagnet: React.FC<ATSUploadLeadMagnetProps> = ({
  lang, targetLang, onTargetLangChange, onFileSelect, isLoading,
}) => {
  const t = translations[lang];
  const lt = t.landing.atsUpload;

  return (
    <section id="ats-upload" className="scroll-mt-24" dir={t.dir}>
      <div className="text-center mb-8">
        <h2 className="animate-fade-up text-fluid-3xl font-bold text-[#150D30] mb-3">
          {lt.title}
        </h2>
        <p className="animate-fade-up delay-100 text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
          {lt.subtitle}
        </p>
      </div>

      <div className="animate-fade-up delay-200">
        <FileUpload
          onFileSelect={onFileSelect}
          isLoading={isLoading}
          lang={lang}
          targetLang={targetLang}
          onTargetLangChange={onTargetLangChange}
        />
      </div>
    </section>
  );
};
