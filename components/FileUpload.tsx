
import React, { useCallback, useState } from 'react';
import { Upload, File, AlertCircle, X } from 'lucide-react';
import { translations, Language } from '../constants/translations';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  lang: Language;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, lang }) => {
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
    <div className="w-full max-w-3xl mx-auto" dir={t.dir}>
      <div
        className={`relative border-[3px] border-dashed rounded-[3rem] p-16 transition-all duration-500 flex flex-col items-center justify-center gap-6 ${
          dragActive ? 'border-[#85409D] bg-indigo-50/50 scale-[1.02]' : 'border-slate-200 hover:border-[#EEA727] bg-white shadow-2xl shadow-indigo-100/40'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
        onClick={() => !isLoading && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept=".pdf,image/*"
          onChange={onFileChange}
          disabled={isLoading}
        />
        
        <div className="bg-[#FFEF5F]/40 p-6 rounded-[2rem] shadow-sm">
          <Upload className="w-10 h-10 text-[#4D2B8C]" />
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-2xl font-black text-[#4D2B8C] tracking-tight">
            {isLoading ? t.upload.processing : t.upload.drop}
          </p>
          <p className="text-base text-slate-500 font-bold">
            {t.upload.support}
          </p>
        </div>

        {!isLoading && (
          <button className="mt-6 px-10 py-3.5 bg-[#4D2B8C] text-white rounded-2xl font-black text-lg hover:bg-[#85409D] transition-all shadow-lg shadow-indigo-200">
            {t.upload.select}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-6 p-5 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4 text-red-800 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="text-base font-bold">{error}</p>
          <button onClick={() => setError(null)} className="mr-auto ml-2 p-2 hover:bg-red-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
