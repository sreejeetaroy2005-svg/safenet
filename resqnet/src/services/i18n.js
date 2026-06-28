/**
 * i18n.js
 * Multilingual support — English, Hindi, Tamil.
 * Critical emergency strings only (keeps bundle small).
 */

export const LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी',    flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்',   flag: '🏳️' },
]

const TRANSLATIONS = {
  en: {
    sos:              'SOS',
    sos_sub:          'Tap to Send Emergency Alert',
    sos_sent:         'Alert Successfully Sent',
    help_notified:    'Help Notified',
    locating:         'Locating…',
    sending:          'Sending…',
    find_shelter:     'Find Shelter',
    report_incident:  'Report Incident',
    helplines:        'Helplines',
    ai_chat:          'AI Chat',
    broadcasts:       'Broadcasts',
    offline_warning:  'Offline — SOS will queue when reconnected',
    emergency_type:   'Select Emergency Type',
    voice_message:    'Voice Message',
    cancel_sos:       'Cancel SOS',
    live_gps:         'Live GPS',
    welcome_back:     'Welcome back',
    stay_safe:        'Stay safe. Help is always one tap away.',
    system_online:    'System Online',
  },
  hi: {
    sos:              'आपातकाल',
    sos_sub:          'आपातकालीन अलर्ट भेजने के लिए टैप करें',
    sos_sent:         'अलर्ट सफलतापूर्वक भेजा गया',
    help_notified:    'सहायता सूचित की गई',
    locating:         'स्थान खोज रहे हैं…',
    sending:          'भेज रहे हैं…',
    find_shelter:     'आश्रय खोजें',
    report_incident:  'घटना रिपोर्ट करें',
    helplines:        'हेल्पलाइन',
    ai_chat:          'AI चैट',
    broadcasts:       'प्रसारण',
    offline_warning:  'ऑफलाइन — पुनः कनेक्ट होने पर SOS भेजा जाएगा',
    emergency_type:   'आपातकाल का प्रकार चुनें',
    voice_message:    'वॉइस संदेश',
    cancel_sos:       'SOS रद्द करें',
    live_gps:         'लाइव GPS',
    welcome_back:     'वापस स्वागत है',
    stay_safe:        'सुरक्षित रहें। सहायता हमेशा एक टैप दूर है।',
    system_online:    'सिस्टम ऑनलाइन',
  },
  ta: {
    sos:              'அவசரநிலை',
    sos_sub:          'அவசர எச்சரிக்கை அனுப்ப தட்டவும்',
    sos_sent:         'எச்சரிக்கை வெற்றிகரமாக அனுப்பப்பட்டது',
    help_notified:    'உதவி அறிவிக்கப்பட்டது',
    locating:         'இடம் கண்டறிகிறது…',
    sending:          'அனுப்புகிறது…',
    find_shelter:     'தங்குமிடம் கண்டறி',
    report_incident:  'சம்பவம் புகாரளி',
    helplines:        'உதவி எண்கள்',
    ai_chat:          'AI அரட்டை',
    broadcasts:       'ஒளிபரப்புகள்',
    offline_warning:  'ஆஃப்லைன் — மீண்டும் இணைக்கும்போது SOS அனுப்பப்படும்',
    emergency_type:   'அவசரநிலை வகையை தேர்ந்தெடுக்கவும்',
    voice_message:    'குரல் செய்தி',
    cancel_sos:       'SOS ரத்து செய்',
    live_gps:         'நேரடி GPS',
    welcome_back:     'மீண்டும் வரவேற்கிறோம்',
    stay_safe:        'பாதுகாப்பாக இருங்கள். உதவி எப்போதும் ஒரு தட்டல் தூரத்தில் உள்ளது.',
    system_online:    'கணினி ஆன்லைன்',
  },
}

const LANG_KEY = 'safenet_lang'

export function getLang() {
  return localStorage.getItem(LANG_KEY) || 'en'
}

export function setLang(code) {
  localStorage.setItem(LANG_KEY, code)
}

export function t(key) {
  const lang = getLang()
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key
}

/** React hook for reactive translations — pass lang from useApp() */
export function useTranslation(lang) {
  const activeLang = lang || getLang()
  return {
    t: (key) => TRANSLATIONS[activeLang]?.[key] || TRANSLATIONS.en[key] || key,
  }
}
