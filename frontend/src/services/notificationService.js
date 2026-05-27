import { useTranslation } from 'i18next';
import LanguageSelector from '../components/LanguageSelector';

const NotificationService = () => {
  const { t } = useTranslation();

  const showNotification = (type, messageKey, duration = 3000) => {
    const message = t(messageKey);
    
    // Implementation example for different notification types
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // You can integrate with a toast library like:
    // toast.success(message) / toast.error(message) / toast.warning(message)
  };

  return {
    success: (key) => showNotification('success', key),
    error: (key) => showNotification('error', key),
    warning: (key) => showNotification('warning', key),
    info: (key) => showNotification('info', key),
  };
};

export default NotificationService;
