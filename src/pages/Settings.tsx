import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Globe, Moon, Sun, Volume2, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';

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
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [biometricConsent, setBiometricConsent] = useState(true);

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
              <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
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
              <SettingsIcon className="h-5 w-5 mr-2 text-primary" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Biometric Consent Required</Label>
                <p className="text-sm text-muted-foreground">
                  Always require fingerprint + voice for document consent
                </p>
              </div>
              <Switch checked={biometricConsent} onCheckedChange={setBiometricConsent} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center">
                <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <Label>Processing Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when document analysis completes
                  </p>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Data Retention</h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Document evidence is permanently stored with cryptographic signatures</p>
                <p>• Biometric data is hashed and cannot be reverse-engineered</p>
                <p>• All data is encrypted at rest and in transit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};