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

export const CONSENT_PHRASES = {
  en: "I hereby provide my consent for the analysis and verification of this legal document. I understand the contents and implications.",
  hi: "मैं इस कानूनी दस्तावेज़ के विश्लेषण और सत्यापन के लिए अपनी सहमति देता हूं। मैं इसकी सामग्री और निहितार्थों को समझता हूं।",
  bn: "আমি এই আইনি নথির বিশ্লেষণ এবং যাচাইকরণের জন্য আমার সম্মতি প্রদান করছি। আমি বিষয়বস্তু এবং অর্থ বুঝতে পারি।",
  te: "ఈ చట్టపరమైన పత్రం యొక్క విశ్లేషణ మరియు ధృవీకరణ కోసం నేను నా సమ్మతిని అందిస్తున్నాను। నేను దాని విషయాలు మరియు పర్యవసానాలను అర్థం చేసుకున్నాను.",
  mr: "मी या कायदेशीर कागदपत्राच्या विश्लेषण आणि पडताळणीसाठी माझी संमती देतो. मला त्यातील मजकूर आणि परिणाम समजले आहेत.",
  ta: "இந்த சட்ட ஆவணத்தின் பகுப்பாய்வு மற்றும் சரிபார்ப்புக்கு நான் எனது ஒப்புதல் அளிக்கிறேன். நான் உள்ளடக்கங்களையும் தாக்கங்களையும் புரிந்துகொள்கிறேன்.",
  gu: "હું આ કાનૂની દસ્તાવેજના વિશ્લેષણ અને ચકાસણી માટે મારી સંમતિ આપું છું. મને તેની વિષયવસ્તુ અને અસરો સમજાયા છે.",
  kn: "ಈ ಕಾನೂನು ದಾಖಲೆಯ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಪರಿಶೀಲನೆಗೆ ನಾನು ನನ್ನ ಒಪ್ಪಿಗೆಯನ್ನು ನೀಡುತ್ತೇನೆ. ನಾನು ವಿಷಯ ಮತ್ತು ಪರಿಣಾಮಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ।",
  ml: "ഈ നിയമ രേഖയുടെ വിശകലനത്തിനും പരിശോധനയ്ക്കും ഞാൻ എന്റെ സമ്മതം നൽകുന്നു. എനിക്ക് ഉള്ളടക്കവും പ്രത്യാഘാതങ്ങളും മനസ്സിലായി।",
  pa: "ਮੈਂ ਇਸ ਕਨੂੰਨੀ ਦਸਤਾਵੇਜ਼ ਦੇ ਵਿਸ਼ਲੇਸ਼ਣ ਅਤੇ ਤਸਦੀਕ ਲਈ ਆਪਣੀ ਸਹਿਮਤੀ ਦਿੰਦਾ ਹਾਂ। ਮੈਂ ਇਸਦੀ ਸਮਗਰੀ ਅਤੇ ਅਸਰਾਤ ਨੂੰ ਸਮਝਦਾ ਹਾਂ।"
};

export const CLAUSE_TYPES = {
  payment: { 
    icon: 'DollarSign', 
    label: 'Payment Terms', 
    color: 'text-green-600',
    description: 'Terms related to payments, amounts, and financial obligations'
  },
  penalty: { 
    icon: 'AlertTriangle', 
    label: 'Penalty Clauses', 
    color: 'text-red-600',
    description: 'Penalties and fines for breach of contract'
  },
  liability: { 
    icon: 'Shield', 
    label: 'Liability Terms', 
    color: 'text-orange-600',
    description: 'Legal liability and responsibility clauses'
  },
  property: { 
    icon: 'Home', 
    label: 'Property Rights', 
    color: 'text-blue-600',
    description: 'Property transfer and ownership terms'
  },
  termination: { 
    icon: 'XCircle', 
    label: 'Termination', 
    color: 'text-purple-600',
    description: 'Contract termination conditions'
  },
  jurisdiction: { 
    icon: 'Scale', 
    label: 'Jurisdiction', 
    color: 'text-gray-600',
    description: 'Legal jurisdiction and governing law'
  },
  other: { 
    icon: 'FileText', 
    label: 'Other Clauses', 
    color: 'text-gray-500',
    description: 'General contract terms and conditions'
  }
};