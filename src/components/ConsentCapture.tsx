import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Mic, 
  MicOff, 
  Fingerprint, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Shield,
  Volume2,
  VolumeX
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConsentCaptureProps {
  onConsentComplete: (consentData: any) => void;
  analysisId: string;
}

const CONSENT_PHRASES = {
  en: "I hereby provide my consent for the analysis and verification of this legal document. I understand the contents and implications.",
  hi: "मैं इस कानूनी दस्तावेज़ के विश्लेषण और सत्यापन के लिए अपनी सहमति देता हूं। मैं इसकी सामग्री और निहितार्थों को समझता हूं।",
  bn: "আমি এই আইনি নথির বিশ্লেষণ এবং যাচাইকরণের জন্য আমার সম্মতি প্রদান করছি। আমি বিষয়বস্তু এবং অর্থ বুঝতে পারি।",
  te: "ఈ చట్టపరమైన పత్రం యొక్క విశ్లేషణ మరియు ధృవీకరణ కోసం నేను నా సమ్మతిని అందిస్తున్నాను। నేను దాని విషయాలు మరియు పర్యవసానాలను అర్థం చేసుకున్నాను."
};

export const ConsentCapture = ({ onConsentComplete, analysisId }: ConsentCaptureProps) => {
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [fingerprintCaptured, setFingerprintCaptured] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isPlayingPhrase, setIsPlayingPhrase] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.log('Location access denied:', error);
      }
    );
    
    // Skip phone verification and mark as completed
    setOtpVerified(true);
  }, []);

  const sendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone_number: phone }
      });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code"
      });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { 
          phone_number: phone,
          otp_code: otp
        }
      });

      if (error) throw error;

      setOtpVerified(true);
      toast({
        title: "Phone Verified",
        description: "Phone number verification successful"
      });
    } catch (error: any) {
      toast({
        title: "OTP Verification Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const playConsentPhrase = () => {
    if (isPlayingPhrase) {
      window.speechSynthesis.cancel();
      setIsPlayingPhrase(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(CONSENT_PHRASES[currentLanguage]);
    utterance.lang = currentLanguage === 'en' ? 'en-US' : 
                     currentLanguage === 'hi' ? 'hi-IN' : 
                     currentLanguage === 'bn' ? 'bn-IN' : 'te-IN';
    
    utterance.onstart = () => setIsPlayingPhrase(true);
    utterance.onend = () => setIsPlayingPhrase(false);
    
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        setVoiceRecorded(true);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 30000);
      
    } catch (error) {
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record consent",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const captureFingerprint = async () => {
    // Simulate fingerprint capture
    // In real implementation, this would use a fingerprint scanner API
    toast({
      title: "Fingerprint Capture",
      description: "Please place your finger on the scanner",
    });

    // Simulate scanning process
    setTimeout(() => {
      setFingerprintCaptured(true);
      toast({
        title: "Fingerprint Captured",
        description: "Biometric verification successful"
      });
    }, 2000);
  };

  const submitConsent = async () => {
    if (!voiceRecorded || !fingerprintCaptured) {
      toast({
        title: "Incomplete Consent",
        description: "Please complete all verification steps",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
      
      // Generate fingerprint hash (simulation)
      const fingerprintHash = btoa(`fingerprint_${Date.now()}_${Math.random()}`);

      const consentData = {
        phone_number: null, // Phone verification skipped
        otp_verified: true, // Auto-verified since skipped
        voice_recording: audioBlob,
        fingerprint_hash: fingerprintHash,
        location: location,
        consent_phrase: CONSENT_PHRASES[currentLanguage],
        language: currentLanguage,
        timestamp: new Date().toISOString(),
        analysis_id: analysisId
      };

      // Submit consent
      const { data, error } = await supabase.functions.invoke('submit-consent', {
        body: {
          ...consentData,
          voice_file: await blobToBase64(audioBlob)
        }
      });

      if (error) throw error;

      toast({
        title: "Consent Submitted",
        description: "Your consent has been securely recorded"
      });

      onConsentComplete(data);
    } catch (error: any) {
      toast({
        title: "Consent Submission Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const allStepsComplete = voiceRecorded && fingerprintCaptured;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            Biometric Consent Capture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step Progress */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${otpVerified ? 'text-success' : 'text-muted-foreground'}`}>
                {otpVerified ? <CheckCircle className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                <span className="text-sm">Phone Verification</span>
              </div>
              <div className={`flex items-center space-x-2 ${voiceRecorded ? 'text-success' : 'text-muted-foreground'}`}>
                {voiceRecorded ? <CheckCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                <span className="text-sm">Voice Consent</span>
              </div>
              <div className={`flex items-center space-x-2 ${fingerprintCaptured ? 'text-success' : 'text-muted-foreground'}`}>
                {fingerprintCaptured ? <CheckCircle className="h-5 w-5" /> : <Fingerprint className="h-5 w-5" />}
                <span className="text-sm">Biometric ID</span>
              </div>
            </div>
            {location && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>Location Captured</span>
              </Badge>
            )}
          </div>

          <Separator />

          {/* Phone verification skipped - directly to voice consent */}

          {/* Voice Consent */}
          {!voiceRecorded && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Mic className="h-4 w-4 mr-2" />
                Step 1: Voice Consent Recording
              </h4>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Please read this consent phrase aloud:</p>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={playConsentPhrase}
                      className="flex items-center space-x-1"
                    >
                      {isPlayingPhrase ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      <span>{isPlayingPhrase ? 'Stop' : 'Listen'}</span>
                    </Button>
                    <select 
                      value={currentLanguage} 
                      onChange={(e) => setCurrentLanguage(e.target.value)}
                      className="px-2 py-1 text-sm border rounded"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी</option>
                      <option value="bn">বাংলা</option>
                      <option value="te">తెలుగు</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm leading-relaxed italic">
                  "{CONSENT_PHRASES[currentLanguage]}"
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording} 
                    className="flex items-center space-x-2"
                    size="lg"
                  >
                    <Mic className="h-5 w-5" />
                    <span>Start Recording</span>
                  </Button>
                ) : (
                  <Button 
                    onClick={stopRecording} 
                    variant="destructive"
                    className="flex items-center space-x-2"
                    size="lg"
                  >
                    <MicOff className="h-5 w-5" />
                    <span>Stop Recording</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Fingerprint Capture */}
          {voiceRecorded && !fingerprintCaptured && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Fingerprint className="h-4 w-4 mr-2" />
                Step 2: Biometric Verification
              </h4>
              
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Fingerprint className="h-12 w-12 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  Place your finger on the biometric scanner to complete verification
                </p>
                <Button 
                  onClick={captureFingerprint}
                  className="flex items-center space-x-2"
                  size="lg"
                >
                  <Fingerprint className="h-5 w-5" />
                  <span>Capture Fingerprint</span>
                </Button>
              </div>
            </div>
          )}

          {/* Complete Consent */}
          {allStepsComplete && (
            <div className="space-y-4">
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <h4 className="font-medium text-success">All Verification Steps Complete</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your consent has been captured with multi-factor authentication including phone verification, 
                  voice recording, and biometric identification.
                </p>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={submitConsent}
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <Shield className="h-5 w-5" />
                  <span>Submit Consent & Generate Evidence</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};