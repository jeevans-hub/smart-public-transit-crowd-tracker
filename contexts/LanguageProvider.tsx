'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi' | 'kn' | 'ta' | 'te';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

const translations: Translations = {
  // Common
  'dashboard': {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
    kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    ta: 'டாஷ்போர்டு',
    te: 'డ్యాష్‌బోర్డ్',
  },
  'profile': {
    en: 'Profile',
    hi: 'प्रोफ़ाइल',
    kn: 'ಪ್ರೊಫೈಲ್',
    ta: 'சுயவிவரம்',
    te: 'ప్రొఫైల్',
  },
  'settings': {
    en: 'Settings',
    hi: 'सेटिंग्स',
    kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    ta: 'அமைப்புகள்',
    te: 'సెట్టింగ్‌లు',
  },
  'logout': {
    en: 'Logout',
    hi: 'लॉग आउट',
    kn: 'ಲಾಗ್ ಔಟ್',
    ta: 'வெளியேறு',
    te: 'లాగ్అవుట్',
  },
  'search': {
    en: 'Search stations, vehicles, routes...',
    hi: 'स्टेशन, वाहन, मार्ग खोजें...',
    kn: 'ನಿಲ್ದಾಣಗಳು, ವಾಹನಗಳು, ಮಾರ್ಗಗಳನ್ನು ಹುಡುಕಿ...',
    ta: 'நிலையங்கள், வாகனங்கள், வழிகளைத் தேடுங்கள்...',
    te: 'స్టేషన్లు, వాహనాలు, మార్గాలను శోధించండి...',
  },
  'notifications': {
    en: 'Notifications',
    hi: 'नोटिफिकेशन',
    kn: 'ಅಧಿಸೂಚನೆಗಳು',
    ta: 'அறிவிப்புகள்',
    te: 'నోటిఫికేషన్లు',
  },
  'username': {
    en: 'Username',
    hi: 'उपयोगकर्ता नाम',
    kn: 'ಬಳಕೆದಾರ ಹೆಸರು',
    ta: 'பயனர் பெயர்',
    te: 'వినియోగదారు పేరు',
  },
  'email': {
    en: 'Email',
    hi: 'ईमेल',
    kn: 'ಇಮೇಲ್',
    ta: 'மின்னஞ்சல்',
    te: 'ఇమెయిల్',
  },
  'role': {
    en: 'Role',
    hi: 'भूमिका',
    kn: 'ಪಾತ್ರ',
    ta: 'பங்கு',
    te: 'పాత్రం',
  },
  'level': {
    en: 'Level',
    hi: 'स्तर',
    kn: 'ಮಟ್ಟ',
    ta: 'நிலை',
    te: 'స్థాయి',
  },
  'coins': {
    en: 'Coins',
    hi: 'सिक्के',
    kn: 'ನಾಣ್ಯಗಳು',
    ta: 'நாணயங்கள்',
    te: 'నాణేలు',
  },
  'experience': {
    en: 'Experience',
    hi: 'अनुभव',
    kn: 'ಅನುಭವ',
    ta: 'அனுபவம்',
    te: 'అనుభవం',
  },
  'account_status': {
    en: 'Account Status',
    hi: 'खाता स्थिति',
    kn: 'ಖಾತೆಯ ಸ್ಥಿತಿ',
    ta: 'கணக்கு நிலை',
    te: 'ఖాతా స్థితి',
  },
  'active': {
    en: 'Active',
    hi: 'सक्रिय',
    kn: 'ಸಕ್ರಿಯ',
    ta: 'செயலில்',
    te: 'చురుకుగా',
  },
  'save': {
    en: 'Save',
    hi: 'सहेजें',
    kn: 'ಉಳಿಸಿ',
    ta: 'சேமிக்கவும்',
    te: 'సేవ్ చేయండి',
  },
  'cancel': {
    en: 'Cancel',
    hi: 'रद्द करें',
    kn: 'ರದ್ದುಮಾಡಿ',
    ta: 'ரத்து செய்',
    te: 'రద్దు చేయండి',
  },
  'edit': {
    en: 'Edit Profile',
    hi: 'प्रोफ़ाइल संपादित करें',
    kn: 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ',
    ta: 'சுயவிவரத்தைத் திருத்து',
    te: 'ప్రొఫైల్ ఎడిట్ చేయండి',
  },
  'save_changes': {
    en: 'Save Changes',
    hi: 'परिवर्तन सहेजें',
    kn: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    ta: 'மாற்றங்களைச் சேமிக்கவும்',
    te: 'మార్పులను సేవ్ చేయండి',
  },
  'user_profile': {
    en: 'User Profile',
    hi: 'उपयोगकर्ता प्रोफ़ाइल',
    kn: 'ಬಳಕೆದಾರ ಪ್ರೊಫೈಲ್',
    ta: 'பயனர் சுயவிவரம்',
    te: 'వినియోగదారు ప్రొఫైల్',
  },
  'manage_account': {
    en: 'Manage your account information and preferences',
    hi: 'अपने खाता की जानकारी और प्राथमिकताएं प्रबंधित करें',
    kn: 'ನಿಮ್ಮ ಖಾತೆಯ ಮಾಹಿತಿ ಮತ್ತು ಆದ್ಯತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
    ta: 'உங்கள் கணக்கு தகவல் மற்றும் விருப்பங்களை நிர்வகிக்கவும்',
    te: 'మీ ఖాతా సమాచారం మరియు ప్రాధాన్యతలను నిర్వహించండి',
  },
  'account_info': {
    en: 'Account Information',
    hi: 'खाता की जानकारी',
    kn: 'ಖಾತೆಯ ಮಾಹಿತಿ',
    ta: 'கணக்கு தகவல்',
    te: 'ఖాతా సమాచారం',
  },
  'security': {
    en: 'Security',
    hi: 'सुरक्षा',
    kn: 'ಭದ್ರತೆ',
    ta: 'பாதுகாப்பு',
    te: 'భద్రత',
  },
  'activity': {
    en: 'Activity',
    hi: 'गतिविधि',
    kn: 'ಚಟುವಟಿಕೆ',
    ta: 'செயல்பாடு',
    te: 'కార్యకలాపాలు',
  },
  'sessions': {
    en: 'Sessions',
    hi: 'सत्र',
    kn: 'ಸೆಷನ್‌ಗಳು',
    ta: 'அமர்வுகள்',
    te: 'సెషన్లు',
  },
  'password': {
    en: 'Password',
    hi: 'पासवर्ड',
    kn: 'ಪಾಸ್‌ವರ್ಡ್',
    ta: 'கடவுச்சொல்',
    te: 'పాస్‌వర్డ్',
  },
  'change_password': {
    en: 'Change Password',
    hi: 'पासवर्ड बदलें',
    kn: 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ',
    ta: 'கடவுச்சொல்லை மாற்றவும்',
    te: 'పాస్‌వర్డ్ మార్చు',
  },
  'current_password': {
    en: 'Current Password',
    hi: 'वर्तमान पासवर्ड',
    kn: 'ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್',
    ta: 'தற்போதைய கடவுச்சொல்',
    te: 'ప్రస్తుత పాస్‌వర్డ్',
  },
  'new_password': {
    en: 'New Password',
    hi: 'नया पासवर्ड',
    kn: 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್',
    ta: 'புதிய கடவுச்சொல்',
    te: 'కొత్త పాస్‌వర్డ్',
  },
  'confirm_password': {
    en: 'Confirm New Password',
    hi: 'नया पासवर्ड की पुष्टि करें',
    kn: 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
    ta: 'புதிய கடவுச்சொல்லை உறுதிப்படுத்தவும்',
    te: 'కొత్త పాస్‌వర్డ్‌ను నిర్ధారించండి',
  },
  'update_password': {
    en: 'Update Password',
    hi: 'पासवर्ड अपडेट करें',
    kn: 'ಪಾಸ್‌ವರ್ಡ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ',
    ta: 'கடவுச்சொல்லை புதுப்பிக்கவும்',
    te: 'పాస్‌వర్డ్ అప్‌డేట్ చేయండి',
  },
  'two_factor': {
    en: 'Two-Factor Authentication',
    hi: 'दो-काचक प्रमाणीकरण',
    kn: 'ಎರಡು-ಅಂಶ ಪ್ರಮಾಣೀಕರಣ',
    ta: 'இரண்டு-காரணி அங்கீகாரம்',
    te: 'రెండు-ఫాక్టర్ ప్రామాణీకరణ',
  },
  'enable_2fa': {
    en: 'Enable 2FA',
    hi: '2FA सक्षम करें',
    kn: '2FA ಸಕ್ರಿಯಗೊಳಿಸಿ',
    ta: '2FA ஐ இயக்கவும்',
    te: '2FA ను ప్రారంభించండి',
  },
  '2fa_desc': {
    en: 'Add an extra layer of security to your account',
    hi: 'अपने खाते में एक अतिरिक्त सुरक्षा परत जोड़ें',
    kn: 'ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಹೆಚ್ಚುವಾದ ಭದ್ರತೆಯ ಪದರವನ್ನು ಸೇರಿಸಿ',
    ta: 'உங்கள் கணக்கில் கூடுதல் பாதுகாப்பு அடுக்கைச் சேர்க்கவும்',
    te: 'మీ ఖాతాలో అదనపు భద్రతా పొరపొందింపును జోడించండి',
  },
  'danger_zone': {
    en: 'Danger Zone',
    hi: 'खतरनाक क्षेत्र',
    kn: 'ಅಪಾಯಕಾರಿ ವಲಯ',
    ta: 'ஆபத்தார மண்டலம்',
    te: 'ప్రమాద మండలి',
  },
  'delete_account': {
    en: 'Delete Account',
    hi: 'खाता हटाएं',
    kn: 'ಖಾತೆಯನ್ನು ಅಳಿಸಿ',
    ta: 'கணக்கை நீக்கவும்',
    te: 'ఖాతాను తొలగించండి',
  },
  'recent_activity': {
    en: 'Recent Activity',
    hi: 'हाल की गतिविधि',
    kn: 'ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ',
    ta: 'சமீபத்திய செயல்பாடு',
    te: 'ఇటీవలి కార్యకలాపాలు',
  },
  'active_sessions': {
    en: 'Active Sessions',
    hi: 'सक्रिय सत्र',
    kn: 'ಸಕ್ರಿಯ ಸೆಷನ್‌ಗಳು',
    ta: 'செயலில் உள்ள அமர்வுகள்',
    te: 'చురుకుగా ఉన్న సెషన్లు',
  },
  'current': {
    en: 'Current',
    hi: 'वर्तमान',
    kn: 'ಪ್ರಸ್ತುತ',
    ta: 'தற்போதைய',
    te: 'ప్రస్తుత',
  },
  'revoke': {
    en: 'Revoke',
    hi: 'रद्द करें',
    kn: 'ರದ್ದುಮಾಡಿ',
    ta: 'ரத்து செய்',
    te: 'రద్దు చేయండి',
  },
  'appearance': {
    en: 'Appearance',
    hi: 'दिखावट',
    kn: 'ನೋಟ',
    ta: 'தோற்றம்',
    te: 'రూపం',
  },
  'theme': {
    en: 'Theme',
    hi: 'थीम',
    kn: 'ಥೀಮ್',
    ta: 'தீம்',
    te: 'థీమ్',
  },
  'light': {
    en: 'Light',
    hi: 'लाइट',
    kn: 'ಲೈಟ್',
    ta: 'ஒளி',
    te: 'లైట్',
  },
  'dark': {
    en: 'Dark',
    hi: 'डार्क',
    kn: 'ಡಾರ್ಕ್',
    ta: 'இருள்',
    te: 'డార్క్',
  },
  'system': {
    en: 'System',
    hi: 'सिस्टम',
    kn: 'ಸಿಸ್ಟಮ್',
    ta: 'கணினி',
    te: 'సిస్టమ్',
  },
  'font_size': {
    en: 'Font Size',
    hi: 'फ़ॉन्ट आकार',
    kn: 'ಫಾಂಟ್ ಗಾತ್ರ',
    ta: 'எழுத்துரு அளவு',
    te: 'ఫాంట్ సైజ్',
  },
  'small': {
    en: 'Small',
    hi: 'छोटा',
    kn: 'ಸಣ್ಣ',
    ta: 'சிறிய',
    te: 'చిన్న',
  },
  'medium': {
    en: 'Medium',
    hi: 'मध्यम',
    kn: 'ಮಧ್ಯಮ',
    ta: 'நடுத்தரம்',
    te: 'మీడియం',
  },
  'large': {
    en: 'Large',
    hi: 'बड़ा',
    kn: 'ದೊಡ್ಡ',
    ta: 'பெரிய',
    te: 'పెద్ద',
  },
  'language_region': {
    en: 'Language & Region',
    hi: 'भाषा और क्षेत्र',
    kn: 'ಭಾಷೆ ಮತ್ತು ಪ್ರದೇಶ',
    ta: 'மொழி மற்றும் பிராந்தியம்',
    te: 'భాష మరియు ప్రాంతం',
  },
  'timezone': {
    en: 'Timezone',
    hi: 'समय क्षेत्र',
    kn: 'ಸಮಯ ವಲಯ',
    ta: 'நேர மண்டலம்',
    te: 'టైమ్‌జోన్',
  },
  'saving': {
    en: 'Saving...',
    hi: 'सहेज रहा है...',
    kn: 'ಉಳಿಸುತ್ತಿದೆ...',
    ta: 'சேமிக்கிறது...',
    te: 'సేవ్ చేస్తోంది...',
  },
  'delete_confirm': {
    en: 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
    hi: 'क्या आप वाकई अपना खाता हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती और आपका सभी डेटा स्थायी रूप से खो जाएगा।',
    kn: 'ನೀವು ಖಚಿತವಾಗಿ ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಅಳಿಸಲು ಬಯಸುವಿರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ಹಿಂತಿರುಗಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ ಮತ್ತು ನಿಮ್ಮ ಎಲ್ಲಾ ಡೇಟಾ ಶಾಶ್ವತವಾಗಿ ನಷ್ಟವಾಗುತ್ತದೆ.',
    ta: 'நீங்கள் உங்கள் கணக்கை நிச்சயமாக நீக்க விரும்புகிறீர்களா? இந்த செயலைச் செயல்தவிர்க்க முடியாது மற்றும் உங்கள் அனைத்து தரவும் நிரந்தரமாக இழக்கப்படும்.',
    te: 'మీరు ఖచ్చితంగా మీ ఖాతాను తొలగించాలనుకుంటున్నారా? ఈ చర్యను తిరిగి పొందలేరు మరియు మీ అన్ని డేటా శాశ్వతంగా పోతుంది.',
  },
  'transit_tracker': {
    en: 'Transit Tracker',
    hi: 'ट्रांजिट ट्रैकर',
    kn: 'ಟ್ರಾನ್ಸಿಟ್ ಟ್ರ್ಯಾಕರ್',
    ta: 'டிரான்சிட் டிராக்கர்',
    te: 'ట్రాన్సిట్ ట్రాకర్',
  },
  'smart_monitoring': {
    en: 'Smart Public Transit Crowd Monitoring',
    hi: 'स्मार्ट पब्लिक ट्रांजिट क्राउड मॉनिटरिंग',
    kn: 'ಸ್ಮಾರ್ಟ್ ಪಬ್ಲಿಕ್ ಟ್ರಾನ್ಸಿಟ್ ಕ್ರೌಡ್ ಮಾನಿಟರಿಂಗ್',
    ta: 'ஸ்மார்ட் பொது போக்குவரத்து கூட்டக் கண்காணிப்பு',
    te: 'స్మార్ట్ పబ్లిక్ ట్రాన్సిట్ క్రౌడ్ మానిటరింగ్',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && translations['dashboard'][savedLanguage]) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return translations[key]?.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
