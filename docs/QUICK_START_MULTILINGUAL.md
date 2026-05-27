# Quick Start: Multilingual Setup

## 5-Minute Setup Guide

### Frontend Quick Start

**Step 1:** Install dependencies
```bash
cd frontend
npm install
```

**Step 2:** Update `main.jsx`
```javascript
import './i18n/config.js'  // Add this line before App import
```

**Step 3:** Add Language Selector to Navigation
```javascript
import LanguageSelector from './components/LanguageSelector';

// In your navigation/header:
<LanguageSelector />
```

**Step 4:** Use translations in components
```javascript
import { useTranslation } from 'i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('app.title')}</h1>;  // Renders in selected language
}
```

### Backend Quick Start

**Step 1:** Import localization service in your routes
```python
from services.localization_service import LocalizationService, get_user_language

@app.route('/api/submit-report', methods=['POST'])
def submit_report():
    language = get_user_language(request)
    
    try:
        # Your code here
        return jsonify(
            LocalizationService.get_success_response(
                'reports.report_submitted',
                language
            )
        )
    except Exception as e:
        return jsonify(
            LocalizationService.get_error_response(
                'reports.report_failed',
                language
            )
        ), 400
```

## Testing Multilingual Features

### Test Frontend
1. Open app in browser
2. Click language selector in navigation
3. Select different language (Hindi, Tamil, etc.)
4. Verify all text updates in real-time
5. Refresh page - language preference persists

### Test Backend
```bash
# Test with Hindi
curl "http://localhost:5000/api/submit-report?language=hi" \
  -H "Content-Type: application/json" \
  -d '{"report": "test"}'

# Test with Tamil
curl "http://localhost:5000/api/submit-report?language=ta" \
  -H "Content-Type: application/json" \
  -d '{"report": "test"}'
```

## Supported Languages
- **en** - English
- **hi** - हिंदी (Hindi)
- **ta** - தமிழ் (Tamil)
- **te** - తెలుగు (Telugu)
- **kn** - ಕನ್ನಡ (Kannada)
- **ml** - മലയാളം (Malayalam)

## Next Steps
1. Replace all hardcoded strings with translation keys
2. Test all language variants
3. Deploy and monitor language usage
4. Gather user feedback for translations

## File Locations
- Frontend config: `frontend/src/i18n/config.js`
- Translations: `frontend/src/i18n/locales/[lang]/translation.json`
- Backend service: `backend/services/localization_service.py`
- Language selector: `frontend/src/components/LanguageSelector.jsx`
- Full guide: `docs/MULTILINGUAL_GUIDE.md`
