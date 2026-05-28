import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import RiskAlert from './pages/RiskAlert';
import SOSPage from './pages/SOSPage';
import LegalInfo from './pages/LegalInfo';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = (i18n.language || 'en').split('-')[0];
    document.documentElement.lang = lang;
  }, [i18n.language]);

  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report-issue" element={<ReportIssue />} />
        <Route path="/risk-alert" element={<RiskAlert />} />
        <Route path="/sos" element={<SOSPage />} />
        <Route path="/legal-info" element={<LegalInfo />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </LanguageProvider>
  );
}

