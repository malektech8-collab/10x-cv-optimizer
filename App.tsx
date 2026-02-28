import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';
import { AdminPanel } from './pages/AdminPanel';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { RefundPolicy } from './pages/RefundPolicy';
import { ChatBot } from './components/ChatBot';
import { Layout } from './components/Layout';
import { Language } from './constants/translations';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home lang={lang} setLang={setLang} />} />
        <Route path="/blog" element={<Blog lang={lang} setLang={setLang} />} />
        <Route path="/blog/:id" element={<BlogPost lang={lang} setLang={setLang} />} />
        <Route path="/admin" element={<AdminPanel lang={lang} setLang={setLang} />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy lang={lang} setLang={setLang} />} />
        <Route path="/refund-policy" element={<RefundPolicy lang={lang} setLang={setLang} />} />
      </Routes>
      <ChatBot lang={lang} />
    </BrowserRouter>
  );
};

export default App;
