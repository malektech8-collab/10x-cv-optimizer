
import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle, X } from 'lucide-react';
import { translations, Language } from '../constants/translations';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  lang: Language;
  targetLang: Language;
  onTargetLangChange: (lang: Language) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, lang, targetLang, onTargetLangChange }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.type.includes('image')) {
      setError(t.upload.errorType);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(t.upload.errorSize);
      return;
    }
    setError(null);
    onFileSelect(file);
  };

  const onDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto" dir={t.dir}>
      <div
        className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-6 p-10 md:p-14 ${
          dragActive
            ? 'border-[#2D1065] bg-[#2D1065]/5 scale-[1.01]'
            : 'border-[#D5CCE8] hover:border-[#8B6DC8] bg-white shadow-[0_2px_16px_rgba(45,16,101,0.06)]'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept=".pdf,image/*"
          onChange={onFileChange}
          disabled={isLoading}
        />

        {/* Upload icon */}
        <div className={`p-4 rounded-xl transition-colors duration-300 ${dragActive ? 'bg-[#2D1065]/10' : 'bg-[#EBE5F5]'}`}>
          <Upload className={`w-7 h-7 transition-colors duration-300 ${dragActive ? 'text-[#2D1065]' : 'text-[#9B4DCA]'}`} />
        </div>

        {/* Text */}
        <div className="text-center space-y-1.5">
          <p className="text-xl font-semibold text-[#150D30]">
            {isLoading ? t.upload.processing : t.upload.drop}
          </p>
          <p className="text-sm text-slate-500">{t.upload.support}</p>
        </div>

        {!isLoading && (
          <div
            className="flex flex-col items-center gap-4 mt-1 w-full relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Language toggle */}
            <div className="flex items-center gap-3 bg-[#F2EEF9] px-4 py-2.5 rounded-xl border border-[#E8E2F0]">
              <span className="text-xs font-medium text-slate-500">{t.upload.targetLang}</span>
              <div className="flex bg-white rounded-lg p-0.5 border border-[#E8E2F0]">
                <button
                  onClick={() => onTargetLangChange('en')}
                  className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                    targetLang === 'en'
                      ? 'bg-[#2D1065] text-white shadow-sm'
                      : 'text-slate-500 hover:text-[#2D1065]'
                  }`}
                >
                  {t.upload.english}
                </button>
                <button
                  onClick={() => onTargetLangChange('ar')}
                  className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                    targetLang === 'ar'
                      ? 'bg-[#2D1065] text-white shadow-sm'
                      : 'text-slate-500 hover:text-[#2D1065]'
                  }`}
                >
                  {t.upload.arabic}
                </button>
              </div>
            </div>

            {/* Upload CTA */}
            <button
              onClick={() => document.getElementById('file-input')?.click()}
              className="px-8 py-2.5 bg-[#2D1065] text-white rounded-xl text-sm font-medium hover:bg-[#220C4E] transition-colors shadow-[0_2px_8px_rgba(45,16,101,0.25)]"
            >
              {t.upload.select}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-fade-up">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <p className="text-sm font-medium flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
