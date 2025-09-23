import { useLocalStorage } from './useLocalStorage';

export const useLanguage = () => {
  const [language, setLanguage] = useLocalStorage('hexavision-language', 'en');
  const [autoTranslate, setAutoTranslate] = useLocalStorage('hexavision-auto-translate', true);
  const [ttsEnabled, setTtsEnabled] = useLocalStorage('hexavision-tts', true);

  return {
    language,
    setLanguage,
    autoTranslate,
    setAutoTranslate,
    ttsEnabled,
    setTtsEnabled
  };
};

export const INDIAN_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' }
];