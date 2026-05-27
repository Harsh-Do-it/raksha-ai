# Multilingual Implementation Guide for Raksha AI

## Overview
This guide shows how to implement multilingual (i18n) support for the Raksha AI application targeting Indian languages: Hindi, Tamil, Telugu, Kannada, and Malayalam.

## Frontend Implementation

### 1. Installation
```bash
cd frontend
npm install i18next i18next-react-dom i18next-browser-languagedetector i18next-http-backend
```

### 2. Update main.jsx
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './i18n/config.js' // Import i18n configuration

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 3. Use Translations in Components

#### Basic Usage with useTranslation Hook:
```javascript
import { useTranslation } from 'i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>Current Language: {i18n.language}</p>
    </div>
  );
}
```

#### With Language Selector:
```javascript
import { useTranslation } from 'i18next';
import LanguageSelector from './components/LanguageSelector';

function App() {
  const { t } = useTranslation();

  return (
    <div>
      <nav>
        <LanguageSelector />
      </nav>
      <main>
        <h1>{t('app.title')}</h1>
      </main>
    </div>
  );
}
```

#### Using the Localization Hook:
```javascript
import { useLocalization } from './hooks/useLocalization';

function Dashboard() {
  const { t, formatDate, formatCurrency, language } = useLocalization();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>Date: {formatDate(new Date())}</p>
      <p>Amount: {formatCurrency(1500)}</p>
    </div>
  );
}
```

### 4. Dynamic Language Switching
```javascript
// Automatically saves to localStorage
const handleLanguageChange = (langCode) => {
  i18n.changeLanguage(langCode);
  localStorage.setItem('preferredLanguage', langCode);
};

// Language is loaded from localStorage on app restart
```

### 5. Adding New Translations
Edit the translation JSON files:
- `src/i18n/locales/en/translation.json` (English)
- `src/i18n/locales/hi/translation.json` (Hindi)
- `src/i18n/locales/ta/translation.json` (Tamil)
- `src/i18n/locales/te/translation.json` (Telugu)
- `src/i18n/locales/kn/translation.json` (Kannada)
- `src/i18n/locales/ml/translation.json` (Malayalam)

**Structure Example:**
```json
{
  "section": {
    "key": "translated text"
  }
}
```

## Backend Implementation

### 1. Using the Localization Service

#### In Flask Routes:
```python
from services.localization_service import LocalizationService, get_user_language
from flask import request, jsonify

@app.route('/api/report/submit', methods=['POST'])
def submit_report():
    user_language = get_user_language(request)
    
    try:
        # Process the report
        report_data = request.get_json()
        
        # Return success response with localized message
        return jsonify(
            LocalizationService.get_success_response(
                'reports.report_submitted',
                user_language,
                {'report_id': '12345'}
            )
        )
    except Exception as e:
        # Return error response with localized message
        return jsonify(
            LocalizationService.get_error_response(
                'reports.report_failed',
                user_language,
                status_code=400
            )
        ), 400
```

#### Getting Notifications in User's Language:
```python
def send_notification(user_id, notification_type, language='en'):
    message = LocalizationService.get_message(
        f'notifications.{notification_type}',
        language
    )
    # Send notification with localized message
    print(f"Sending to {user_id}: {message}")
```

### 2. Database Considerations
Store user's language preference:
```python
# Add to user profile
user = {
    'user_id': '123',
    'name': 'John',
    'preferred_language': 'hi',  # Store preference
    'email': 'john@example.com'
}
```

### 3. API Response Format
```json
{
  "success": true,
  "message": "रिपोर्ट सफलतापूर्वक जमा की गई",
  "language": "hi",
  "data": {
    "report_id": "12345",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Advanced Features

### 1. Interpolation (Dynamic Values)
Update translation files:
```json
{
  "notifications": {
    "newReportNearby": "New {{severity}} severity report {{distance}}m away"
  }
}
```

Usage in component:
```javascript
const { t } = useTranslation();
const message = t('notifications.newReportNearby', {
  severity: 'high',
  distance: 500
});
```

### 2. Pluralization
```json
{
  "reports": {
    "count": "You have {{count}} report_one::report||reports_other"
  }
}
```

### 3. Date & Number Formatting
```javascript
const { formatDate, formatNumber, formatCurrency } = useLocalization();

// Automatically formats based on language
formatDate(new Date()); // "15 जनवरी 2024" (Hindi)
formatNumber(1500);     // "१५००" (Hindi)
formatCurrency(100);    // "₹100.00" (India)
```

## File Structure
```
frontend/src/
├── i18n/
│   ├── config.js                 # i18n configuration
│   └── locales/
│       ├── en/
│       │   └── translation.json
│       ├── hi/
│       │   └── translation.json
│       ├── ta/
│       │   └── translation.json
│       ├── te/
│       │   └── translation.json
│       ├── kn/
│       │   └── translation.json
│       └── ml/
│           └── translation.json
├── components/
│   ├── LanguageSelector.jsx     # Language selector dropdown
│   └── LanguageSelector.css
├── context/
│   └── LanguageContext.jsx      # Language context provider
├── hooks/
│   └── useLocalization.js       # Custom hook for localization
├── services/
│   └── notificationService.js   # Notification service with i18n
└── ...

backend/
├── services/
│   └── localization_service.py  # Backend localization service
└── ...
```

## Integration Steps

### Step 1: Frontend Setup
1. Run `npm install` with updated dependencies
2. Import i18n in `main.jsx`
3. Add LanguageSelector to navigation
4. Replace hardcoded strings with `t('key')`

### Step 2: Backend Setup
1. Add `localization_service.py` to backend services
2. Import `LocalizationService` in your routes
3. Use `get_user_language(request)` to detect language
4. Wrap responses with `LocalizationService.get_success_response()` or `get_error_response()`

### Step 3: Testing
```bash
# Test with different languages
# Frontend: Select language from dropdown
# Backend: Add ?language=hi to API calls
curl "http://localhost:5000/api/report/submit?language=hi" -X POST
```

## Browser Language Detection
The app automatically detects user's browser language:
1. Checks localStorage for saved preference
2. Falls back to browser Accept-Language header
3. Uses English if language not supported

## Performance Optimization
- Translations are lazy-loaded
- Language selection cached in localStorage
- No re-renders on language change unless components use `useTranslation()`

## Adding More Languages
1. Create new translation file: `locales/xx/translation.json`
2. Add to i18n config: `import xxTranslation from './locales/xx/translation.json'`
3. Add to resources in config
4. Update LanguageSelector with new language code

## Common Issues & Solutions

### Issue: Translations not showing
**Solution:** Ensure component imports `useTranslation()` and uses `t('key')`

### Issue: Language not persisting
**Solution:** Check localStorage is enabled in browser

### Issue: Backend returns default language
**Solution:** Pass `?language=xx` in API calls or set Accept-Language header

## Support for RTL Languages (Future)
The `useLanguage` hook already includes RTL support for Arabic and Hebrew:
```javascript
const { direction } = useLanguage(); // 'ltr' or 'rtl'
// Use: <div dir={direction}>...</div>
```

## Best Practices
1. Always use translation keys, never hardcode strings
2. Organize translations logically by section
3. Keep key names lowercase with dot notation
4. Test all languages before deployment
5. Store user language preference in database
6. Use namespaces for large applications
