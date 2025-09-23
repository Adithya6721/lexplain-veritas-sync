import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Globe, Moon, Sun, Volume2, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/hooks/useLanguage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';

const INDIAN_LANGUAGES = [
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

export const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { 
    language, 
    setLanguage, 
    autoTranslate, 
    setAutoTranslate, 
    ttsEnabled, 
    setTtsEnabled 
  } = useLanguage();
  const [notifications, setNotifications] = useLocalStorage('hexavision-notifications', true);
  const [biometricConsent, setBiometricConsent] = useLocalStorage('hexavision-biometric', true);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    toast({
      title: "Language Updated",
      description: `Interface language changed to ${INDIAN_LANGUAGES.find(l => l.code === value)?.name}`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
          <SettingsIcon className="h-8 w-8 mr-3 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your HexaVision preferences and security settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Language & Localization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2 text-primary" />
              Language & Localization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="default-language">Default Interface Language</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center space-x-2">
                        <span>{lang.name}</span>
                        <span className="text-muted-foreground text-sm">({lang.native})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-translate Documents</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically translate extracted text to your preferred language
                </p>
              </div>
              <Switch checked={autoTranslate} onCheckedChange={setAutoTranslate} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center">
                <Volume2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <Label>Text-to-Speech (TTS)</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable voice playback for document analysis
                  </p>
                </div>
              </div>
              <Switch checked={ttsEnabled} onCheckedChange={setTtsEnabled} />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 mr-2 text-primary" />
              ) : (
                <Sun className="h-5 w-5 mr-2 text-primary" />
              )}
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="flex items-center space-x-2"
                  >
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="flex items-center space-x-2"
                  >
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                  >
                    System
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-primary" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Biometric Consent Required</Label>
                <p className="text-sm text-muted-foreground">
                  Require fingerprint and voice verification for evidence generation
                </p>
              </div>
              <Switch checked={biometricConsent} onCheckedChange={setBiometricConsent} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about document processing status
                </p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end">
          <Button onClick={() => toast({
            title: "Settings Saved",
            description: "Your preferences have been saved successfully."
          })}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};