import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Shield, 
  CheckCircle,
  Download,
  Save,
  Clock,
  MapPin,
  Fingerprint
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ConsentEvidenceStepProps {
  onComplete: (data: any) => void;
  onBack: () => void;
  workflowData: any;
}

export const ConsentEvidenceStep: React.FC<ConsentEvidenceStepProps> = ({ 
  onComplete, 
  onBack, 
  workflowData 
}) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [consentTimestamp, setConsentTimestamp] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [evidenceVault, setEvidenceVault] = useState<any[]>([]);
  const [isGeneratingEvidence, setIsGeneratingEvidence] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  React.useEffect(() => {
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

    // Load existing evidence vault
    loadEvidenceVault();
  }, []);

  const loadEvidenceVault = async () => {
    try {
      const { data, error } = await supabase
        .from('evidence_records')
        .select(`
          *,
          consent_records!inner(
            phone_number,
            timestamp,
            analysis_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedRecords = data.map(record => ({
        id: record.id,
        title: record.evidence_json?.document?.filename || 'Document Evidence',
        created: new Date(record.created_at).toLocaleDateString(),
        status: 'Valid',
        blockchainHash: record.blockchain_tx_hash,
        ipfsHash: record.ipfs_hash
      }));

      setEvidenceVault(formattedRecords);
    } catch (error) {
      console.error('Error loading evidence vault:', error);
    }
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
        setHasRecording(true);
        setConsentTimestamp(new Date().toISOString());
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

  const generateEvidence = async () => {
    if (!hasRecording) {
      toast({
        title: "Recording Required",
        description: "Please record your consent first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGeneratingEvidence(true);

      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
      
      // Create FormData for consent submission
      const formData = new FormData();
      formData.append('analysis_id', workflowData.documentId);
      formData.append('phone_number', '');
      formData.append('otp_code', '');
      formData.append('latitude', location?.latitude?.toString() || '');
      formData.append('longitude', location?.longitude?.toString() || '');
      formData.append('address', location?.address || '');
      formData.append('voice_file', audioBlob, 'consent-recording.webm');
      
      // Submit consent using fetch
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-consent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate evidence');
      }

      // Add to evidence vault
      const newEvidence = {
        id: result.evidence_id,
        title: workflowData.document?.name || 'Legal Document',
        created: new Date().toLocaleDateString(),
        status: 'Valid',
        blockchainHash: result.blockchain_tx_hash,
        ipfsHash: result.ipfs_hash
      };

      setEvidenceVault(prev => [newEvidence, ...prev]);

      toast({
        title: "Evidence Generated Successfully",
        description: "Your tamper-evident evidence record has been created"
      });

      onComplete({
        consentData: {
          timestamp: consentTimestamp,
          location: location,
          voiceRecorded: true,
          fingerprintCaptured: true
        },
        evidenceRecord: result
      });

    } catch (error: any) {
      console.error('Evidence generation error:', error);
      toast({
        title: "Evidence Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingEvidence(false);
    }
  };

  const downloadEvidence = async (evidence: any) => {
    try {
      const evidenceData = {
        evidence_id: evidence.id,
        document_title: evidence.title,
        created_date: evidence.created,
        status: evidence.status,
        blockchain_hash: evidence.blockchainHash,
        ipfs_hash: evidence.ipfsHash,
        consent_timestamp: consentTimestamp,
        location_data: location,
        verification_status: 'VERIFIED'
      };

      const dataStr = JSON.stringify(evidenceData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `evidence_${evidence.id}_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast({
        title: "Evidence Downloaded",
        description: "Evidence package has been downloaded"
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download evidence package",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Step 5: Consent & Evidence Management</h1>
        <p className="text-muted-foreground">
          Record your consent and generate tamper-evident evidence records
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Consent Recording */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2" />
              Voice Consent Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Please read this consent statement aloud:</p>
              <p className="text-sm italic leading-relaxed">
                "I hereby provide my consent for the analysis and verification of this legal document. 
                I understand the contents and implications of the clauses identified in this document. 
                I authorize the generation of tamper-evident evidence records for legal purposes."
              </p>
            </div>

            <div className="text-center space-y-4">
              {!hasRecording ? (
                <>
                  {!isRecording ? (
                    <Button 
                      onClick={startRecording} 
                      className="flex items-center space-x-2"
                      size="lg"
                    >
                      <Mic className="h-5 w-5" />
                      <span>Start Recording Consent</span>
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <Mic className="h-8 w-8 text-red-600" />
                      </div>
                      <p className="text-sm text-muted-foreground">Recording in progress...</p>
                      <Button 
                        onClick={stopRecording} 
                        variant="destructive"
                        className="flex items-center space-x-2"
                      >
                        <MicOff className="h-5 w-5" />
                        <span>Stop Recording</span>
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-success">Consent Recorded Successfully</p>
                    <div className="flex items-center justify-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(consentTimestamp!).toLocaleString()}</span>
                      </div>
                      {location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>Location Captured</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {hasRecording && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={generateEvidence}
                  disabled={isGeneratingEvidence}
                  className="w-full flex items-center space-x-2"
                  size="lg"
                >
                  <Shield className="h-5 w-5" />
                  <span>{isGeneratingEvidence ? 'Generating Evidence...' : 'Generate Evidence Record'}</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evidence Vault */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Evidence Vault
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evidenceVault.length > 0 ? (
                evidenceVault.map((evidence) => (
                  <div key={evidence.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{evidence.title}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          ID: {evidence.id}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Created: {evidence.created}</span>
                        </div>
                      </div>
                      <Badge className="bg-success/20 text-success">
                        <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                        {evidence.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs"
                        onClick={() => downloadEvidence(evidence)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Update
                      </Button>
                    </div>
                    {evidence.blockchainHash && (
                      <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <strong>Blockchain:</strong> {evidence.blockchainHash.substring(0, 20)}...
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No evidence records yet</p>
                  <p className="text-sm text-muted-foreground">Generate your first evidence record above</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Biometric Simulation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Fingerprint className="h-5 w-5 mr-2" />
            Biometric Verification (Simulated)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-sm font-medium">Fingerprint</p>
              <p className="text-xs text-muted-foreground">Captured & Verified</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-sm font-medium">Voice Pattern</p>
              <p className="text-xs text-muted-foreground">Recorded & Analyzed</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-sm font-medium">Location</p>
              <p className="text-xs text-muted-foreground">GPS Coordinates</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Summary
        </Button>
        
        {hasRecording && (
          <Button onClick={() => onComplete({
            consentData: {
              timestamp: consentTimestamp,
              location: location,
              voiceRecorded: true,
              fingerprintCaptured: true
            },
            evidenceVault: evidenceVault
          })}>
            Continue to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
};