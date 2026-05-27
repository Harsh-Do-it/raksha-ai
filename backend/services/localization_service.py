"""
Backend Localization Module
Provides multilingual support for backend responses and notifications
"""

class LocalizationService:
    """Service for handling backend localization"""
    
    # Translations dictionary
    TRANSLATIONS = {
        "en": {
            "common": {
                "success": "Operation successful",
                "error": "An error occurred",
                "validation_error": "Validation error",
                "not_found": "Resource not found",
                "unauthorized": "Unauthorized access",
                "server_error": "Internal server error",
            },
            "reports": {
                "report_submitted": "Report submitted successfully",
                "report_failed": "Failed to submit report",
                "report_deleted": "Report deleted successfully",
                "duplicate_report": "Duplicate report detected near this location",
                "thank_you": "Thank you for reporting this issue",
            },
            "notifications": {
                "high_severity_alert": "High severity alert detected",
                "new_report_nearby": "New report in your area",
                "road_condition_changed": "Road condition has changed",
                "emergency_nearby": "Emergency reported nearby",
            },
            "sos": {
                "sos_triggered": "SOS triggered successfully",
                "emergency_services_contacted": "Emergency services have been contacted",
                "location_shared": "Your location has been shared",
            }
        },
        "hi": {
            "common": {
                "success": "ऑपरेशन सफल",
                "error": "त्रुटि हुई",
                "validation_error": "सत्यापन त्रुटि",
                "not_found": "संसाधन नहीं मिला",
                "unauthorized": "अनधिकृत पहुंच",
                "server_error": "आंतरिक सर्वर त्रुटि",
            },
            "reports": {
                "report_submitted": "रिपोर्ट सफलतापूर्वक जमा की गई",
                "report_failed": "रिपोर्ट जमा करने में विफल",
                "report_deleted": "रिपोर्ट सफलतापूर्वक हटाई गई",
                "duplicate_report": "इस स्थान के पास डुप्लिकेट रिपोर्ट पाई गई",
                "thank_you": "इस समस्या की रिपोर्ट करने के लिए धन्यवाद",
            },
            "notifications": {
                "high_severity_alert": "उच्च गंभीरता सतर्कता सनाई गई",
                "new_report_nearby": "आपके क्षेत्र में नई रिपोर्ट",
                "road_condition_changed": "सड़क की स्थिति बदल गई",
                "emergency_nearby": "पास में आपातकाल सूचित किया गया",
            },
            "sos": {
                "sos_triggered": "SOS सफलतापूर्वक ट्रिगर किया गया",
                "emergency_services_contacted": "आपातकालीन सेवाओं से संपर्क किया गया है",
                "location_shared": "आपका स्थान साझा किया गया है",
            }
        },
        "ta": {
            "common": {
                "success": "செயல்பாடு வெற்றிகரமாக",
                "error": "பிழை ஏற்பட்டது",
                "validation_error": "சரிபார்ப்பு பிழை",
                "not_found": "வளம் கண்டுபிடிக்கப்படவில்லை",
                "unauthorized": "அங்கீகரிக்கப்படாத அணுகல்",
                "server_error": "உள் சர்வர் பிழை",
            },
            "reports": {
                "report_submitted": "அறிக்கை வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது",
                "report_failed": "அறிக்கையை சமர்ப்பிக்க முடியவில்லை",
                "report_deleted": "அறிக்கை வெற்றிகரமாக நீக்கப்பட்டது",
                "duplicate_report": "இந்த இடத்தில் நகல் அறிக்கை கண்டுபிடிக்கப்பட்டது",
                "thank_you": "இந்த சிக்கலை தெரிவித்ததற்கு நன்றி",
            },
            "notifications": {
                "high_severity_alert": "உচ்च தீவிரத்தை எச்சரிக்கை கண்டறியப்பட்டது",
                "new_report_nearby": "உங்கள் பகுதியில் புதிய அறிக்கை",
                "road_condition_changed": "சாலை நிலை மாறிவிட்டது",
                "emergency_nearby": "அருகாமையில் அவசர நிலை அறிவிக்கப்பட்டது",
            },
            "sos": {
                "sos_triggered": "SOS வெற்றிகரமாக தூண்டப்பட்டது",
                "emergency_services_contacted": "அவசர சேவைகளை தொடர்பு கொள்ளப்பட்ட",
                "location_shared": "உங்கள் இடம் பகிரப்பட்டுள்ளது",
            }
        },
        "te": {
            "common": {
                "success": "ఆపరేషన్ విజయవంతమైంది",
                "error": "ఒక లోపం సంభవించింది",
                "validation_error": "ధృవీకరణ లోపం",
                "not_found": "వనరు కనుగొనబడలేదు",
                "unauthorized": "అనధికృత యాక్సెస్",
                "server_error": "అంతర్గత సర్వర్ లోపం",
            },
            "reports": {
                "report_submitted": "నివేదన విజయవంతంగా సమర్పించబడింది",
                "report_failed": "నివేదనను సమర్పించడంలో విఫలమైంది",
                "report_deleted": "నివేదన విజయవంతంగా తొలగించబడింది",
                "duplicate_report": "ఈ ప్రదేశానికి సమీపంలో నకిలు నివేదన కనుగొనబడింది",
                "thank_you": "ఈ సమస్యను నివేదించినందుకు ధన్యవాదాలు",
            },
            "notifications": {
                "high_severity_alert": "ఉচ్చ తీవ్రత అలర్ట్ కనుగొనబడింది",
                "new_report_nearby": "మీ ప్రాంతంలో కొత్త నివేదన",
                "road_condition_changed": "రోడ్ పరిస్థితి మార్చబడింది",
                "emergency_nearby": "సమీపంలో ఎమర్జెన్సీ నివేదించబడింది",
            },
            "sos": {
                "sos_triggered": "SOS విజయవంతంగా ట్రిగర్ చేయబడింది",
                "emergency_services_contacted": "ఎమర్జెన్సీ సేవలు సంప్రదించబడ్డాయి",
                "location_shared": "మీ స్థానం భాగస్వామ్యం చేయబడింది",
            }
        },
        "kn": {
            "common": {
                "success": "ಕಾರ್ಯ ಯಶಸ್ವಿ",
                "error": "ಒಂದು ದೋಷ ಸಂಭವಿಸಿದೆ",
                "validation_error": "ಮೌಲ್ಯಮಾಪನ ದೋಷ",
                "not_found": "ಸಂಪನ್ನ ಕಂಡುಬಂದಿಲ್ಲ",
                "unauthorized": "ಅನುಮತಿ ಇಲ್ಲದ ಪ್ರವೇಶ",
                "server_error": "ಆಂತರಿಕ ಸರ್ವರ್ ದೋಷ",
            },
            "reports": {
                "report_submitted": "ವರದಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ",
                "report_failed": "ವರದಿ ಸಲ್ಲಿಸಲು ವಿಫಲವಾಗಿದೆ",
                "report_deleted": "ವರದಿ ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ",
                "duplicate_report": "ಈ ಸ್ಥಳದ ಸಮೀಪದಲ್ಲಿ ನಕಲಿ ವರದಿ ಕಂಡುಬಂದಿದೆ",
                "thank_you": "ಈ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು",
            },
            "notifications": {
                "high_severity_alert": "ಎತ್ತರದ ತೀವ್ರತೆಯ ಎಚ್ಚರಿಕೆ ಕಂಡುಬಂದಿದೆ",
                "new_report_nearby": "ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಹೊಸ ವರದಿ",
                "road_condition_changed": "ರಸ್ತೆ ಸ್ಥಿತಿ ಬದಲಾಗಿದೆ",
                "emergency_nearby": "ಸಮೀಪದಲ್ಲಿ ತುರ್ತು ಪರಿಸ್ಥಿತಿ ವರದಿ ಆಗಿದೆ",
            },
            "sos": {
                "sos_triggered": "SOS ಯಶಸ್ವಿಯಾಗಿ ಟ್ರಿಗರ್ ಆಗಿದೆ",
                "emergency_services_contacted": "ತುರ್ತು ಸೇವೆಗಳನ್ನು ಸಂಪರ್ಕಿಸಲಾಗಿದೆ",
                "location_shared": "ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಸ್ವಾಧೀನ ಮಾಡಲಾಗಿದೆ",
            }
        },
        "ml": {
            "common": {
                "success": "ഓപറേഷൻ വിജയകരമായി",
                "error": "ഒരു പിശക് സംഭവിച്ചു",
                "validation_error": "സാധുതയ്ക്കുള്ള പിശക്",
                "not_found": "വിഭവം കണ്ടെത്തിയില്ല",
                "unauthorized": "അനധികൃത പ്രവേശനം",
                "server_error": "ആന്തരിക സെർവർ പിശക്",
            },
            "reports": {
                "report_submitted": "റിപ്പോർട്ട് വിജയകരമായി സമർപ്പിച്ചു",
                "report_failed": "റിപ്പോർട്ട് സമർപ്പിക്കുവാൻ പരാജയപ്പെട്ടു",
                "report_deleted": "റിപ്പോർട്ട് വിജയകരമായി ഇല്ലാതാക്കി",
                "duplicate_report": "ഈ സ്ഥാനത്ത് സമീപമായ ഡുപ്ലിക്കേറ്റ് റിപ്പോർട്ട് കണ്ടെത്തി",
                "thank_you": "ഈ പ്രശ്നം റിപ്പോർട്ട് ചെയ്തതിനായി നന്ദി",
            },
            "notifications": {
                "high_severity_alert": "ഉയർന്ന ഗൗരവത്തിന്റെ സതർക്കത കണ്ടെത്തി",
                "new_report_nearby": "നിങ്ങളുടെ പ്രദേശത്ത് പുതിയ റിപ്പോർട്ട്",
                "road_condition_changed": "രോഡ് നിലവാരം മാറിയിരിക്കുന്നു",
                "emergency_nearby": "സമീപത്ത് എമർജൻസി റിപ്പോർട്ട് ചെയ്യപ്പെട്ടിരിക്കുന്നു",
            },
            "sos": {
                "sos_triggered": "SOS വിജയകരമായി ട്രിഗർ ചെയ്യപ്പെട്ടു",
                "emergency_services_contacted": "എമർജൻസി സേവനങ്ങളെ ബന്ധപ്പെടുത്തിയിട്ടുണ്ട്",
                "location_shared": "നിങ്ങളുടെ സ്ഥാനം പങ്കിട്ടിരിക്കുന്നു",
            }
        }
    }

    @staticmethod
    def get_message(key: str, language: str = 'en') -> str:
        """
        Get translated message
        
        Args:
            key: Message key in format "section.message"
            language: Language code (en, hi, ta, te, kn, ml)
            
        Returns:
            Translated message or original key if translation not found
        """
        keys = key.split('.')
        translation = LocalizationService.TRANSLATIONS.get(language, {})
        
        for k in keys:
            translation = translation.get(k, {})
            if isinstance(translation, str):
                return translation
        
        return key

    @staticmethod
    def get_error_response(error_key: str, language: str = 'en', status_code: int = 400):
        """Generate localized error response"""
        message = LocalizationService.get_message(error_key, language)
        return {
            'success': False,
            'message': message,
            'language': language,
            'status_code': status_code,
        }

    @staticmethod
    def get_success_response(message_key: str, language: str = 'en', data: dict = None):
        """Generate localized success response"""
        message = LocalizationService.get_message(message_key, language)
        response = {
            'success': True,
            'message': message,
            'language': language,
        }
        if data:
            response['data'] = data
        return response


def get_user_language(request) -> str:
    """Extract user's preferred language from request"""
    # Try to get from query params first
    language = request.args.get('language', '').lower()
    
    # Then try from Accept-Language header
    if not language:
        accept_language = request.headers.get('Accept-Language', 'en')
        language = accept_language.split(',')[0].split('-')[0].lower()
    
    # Validate language is supported
    supported_langs = ['en', 'hi', 'ta', 'te', 'kn', 'ml']
    if language not in supported_langs:
        language = 'en'
    
    return language
