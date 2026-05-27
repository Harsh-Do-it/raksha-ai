import { useTranslation } from 'i18next';

export const useLocalization = () => {
  const { t, i18n } = useTranslation();

  return {
    t,
    language: i18n.language,
    changeLanguage: (lang) => i18n.changeLanguage(lang),
    isRTL: ['ar', 'he'].includes(i18n.language),
    formatDate: (date) => {
      return new Date(date).toLocaleDateString(i18n.language);
    },
    formatNumber: (number) => {
      return new Intl.NumberFormat(i18n.language).format(number);
    },
    formatCurrency: (amount, currency = 'INR') => {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: currency,
      }).format(amount);
    },
  };
};
