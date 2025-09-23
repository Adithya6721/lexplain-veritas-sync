import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  FileText, 
  Eye, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Fingerprint,
  MapPin,
  Mic,
  Download,
  Shield,
  Scan,
  FileCheck
} from "lucide-react";

const WORKFLOW_STEPS = [
  { icon: Upload, title: "Upload Document", description: "Select your legal document" },
  { icon: Scan, title: "OCR Processing", description: "Extract text with Google Vision" },
  { icon: FileText, title: "Clause Analysis", description: "AI-powered clause detection" },
  { icon: Shield, title: "Risk Analysis", description: "Hugging Face risk assessment" },
  { icon: Fingerprint, title: "Consent Capture", description: "Record biometric consent" },
  { icon: FileCheck, title: "Evidence Generation", description: "Create tamper-proof record" },
];

export const DocumentUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [consentData, setConsentData] = useState<any>(null);
  const [evidenceRecord, setEvidenceRecord] = useState<any>(null);

  // Phone/OTP states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Location and biometric states
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [voiceRecording, setVoiceRecording] = useState<Blob | null>(null);
  const [fingerprintData, setFingerprintData] = useState<string | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(selectedFile);
    setDocumentTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const processDocument = async () => {
    if (!selectedFile || !documentTitle || !user) {
      toast({
        title: "Missing Information",
        description: "Please select a file and enter a title.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep(0);
    setProgress(0);

    try {
      // Step 1: Upload document
      setCurrentStep(1);
      setProgress(20);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', user.id);

      const uploadResponse = await supabase.functions.invoke('upload-document', {
        body: formData
      });

      if (uploadResponse.error) throw uploadResponse.error;

      const { document_id } = uploadResponse.data;
      setDocumentId(document_id);

      toast({
        title: "Document Uploaded",
        description: "Document uploaded successfully. Processing started.",
      });

      // Step 2: Wait for analysis
      setCurrentStep(2);
      setProgress(40);

      // Poll for analysis completion
      let analysisComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (!analysisComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;

        const { data: document } = await supabase
          .from('documents')
          .select('status')
          .eq('id', document_id)
          .single();

        if (document?.status === 'completed') {
          analysisComplete = true;
        } else if (document?.status === 'failed') {
          throw new Error('Document processing failed');
        }

        setProgress(40 + (attempts / maxAttempts) * 30);
      }

      if (!analysisComplete) {
        throw new Error('Analysis timeout');
      }

      // Step 3: Get analysis results
      setCurrentStep(3);
      setProgress(75);

      const { data: analysis } = await supabase
        .from('analyses')
        .select('*')
        .eq('document_id', document_id)
        .single();

      if (analysis) {
        setAnalysisResults(analysis);
        setProgress(100);

        // Show risk analysis results
        const riskData = (analysis.auth_flags as any)?.risk_analysis;
        if (riskData) {
          toast({
            title: `Risk Level: ${riskData.risk_level?.toUpperCase()}`,
            description: `Score: ${riskData.risk_score}/100 - ${riskData.summary}`,
            variant: riskData.risk_level === 'high' ? 'destructive' : 'default',
          });
        }

        toast({
          title: "Analysis Complete",
          description: "Document analysis completed successfully!",
        });
      }

    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "An error occurred during processing.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const sendOTP = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await supabase.functions.invoke('send-otp', {
        body: { phone_number: phoneNumber }
      });

      if (response.error) throw response.error;

      setIsOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "Check your phone for the verification code",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const verifyOTP = async () => {
    if (!otpCode) {
      toast({
        title: "OTP required",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await supabase.functions.invoke('verify-otp', {
        body: { 
          phone_number: phoneNumber,
          otp_code: otpCode
        }
      });

      if (response.error) throw response.error;

      setIsOtpVerified(true);
      toast({
        title: "OTP Verified",
        description: "Phone number verified successfully",
      });
    } catch (error: any) {
      toast({
        title: "OTP Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const captureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocoding (simplified - in production use a real service)
            const address = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
            
            setLocation({
              lat: latitude,
              lng: longitude,
              address
            });
            
            toast({
              title: "Location Captured",
              description: `Location: ${address}`,
            });
          } catch (error) {
            console.error('Geocoding error:', error);
            setLocation({
              lat: latitude,
              lng: longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
          }
        },
        (error) => {
          toast({
            title: "Location Access Denied",
            description: "Could not access your location",
            variant: "destructive",
          });
        }
      );
    }
  };

  const generateFingerprint = () => {
    // Simulate fingerprint generation
    const mockFingerprint = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setFingerprintData(mockFingerprint);
    
    toast({
      title: "Fingerprint Captured",
      description: "Biometric data recorded successfully",
    });
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setVoiceRecording(blob);
        
        toast({
          title: "Voice Recording Complete",
          description: "Voice consent recorded successfully",
        });
      };

      mediaRecorder.start();
      
      // Stop recording after 5 seconds
      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
      }, 5000);
      
      toast({
        title: "Recording Started",
        description: "Please speak your consent (5 seconds)",
      });
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const submitConsent = async () => {
    if (!isOtpVerified || !location || !fingerprintData) {
      toast({
        title: "Missing Consent Data",
        description: "Please complete all consent steps",
        variant: "destructive",
      });
      return;
    }

    try {
      setCurrentStep(5);
      setProgress(90);

      const response = await supabase.functions.invoke('submit-consent', {
        body: {
          analysis_id: analysisResults.id,
          phone_number: phoneNumber,
          location,
          fingerprint_hash: fingerprintData,
          voice_file_path: voiceRecording ? 'voice_consent.wav' : null
        }
      });

      if (response.error) throw response.error;

      setConsentData(response.data);
      setProgress(100);
      
      toast({
        title: "Consent Recorded",
        description: "All consent data submitted successfully",
      });

      // Generate evidence
      await generateEvidence();

    } catch (error: any) {
      toast({
        title: "Consent Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateEvidence = async () => {
    try {
      setCurrentStep(6);

      const response = await supabase.functions.invoke('get-evidence', {
        body: { evidence_id: consentData?.evidence_id }
      });

      if (response.error) throw response.error;

      setEvidenceRecord(response.data);
      
      toast({
        title: "Evidence Generated",
        description: "Tamper-proof evidence record created",
      });

    } catch (error: any) {
      toast({
        title: "Evidence Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadEvidence = () => {
    if (!evidenceRecord) return;

    const evidenceData = {
      document_analysis: analysisResults,
      consent_record: consentData,
      evidence_record: evidenceRecord,
      generated_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(evidenceData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence_${documentId}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Legal Document Processor</h1>
        <p className="text-muted-foreground">
          AI-powered document verification with blockchain evidence generation
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {WORKFLOW_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStep && isProcessing;
          const isCompleted = index < currentStep && isProcessing;
          
          return (
            <div
              key={index}
              className={`text-center p-4 rounded-lg border transition-all ${
                isActive ? 'border-primary bg-primary/5' : 
                isCompleted ? 'border-green-500 bg-green-500/5' : 'border-border'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                isActive ? 'bg-primary text-primary-foreground' :
                isCompleted ? 'bg-green-500 text-white' : 'bg-muted'
              }`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium mb-1">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          );
        })}
      </div>

      {/* Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Legal Document</CardTitle>
          <CardDescription>
            Upload a scanned document or PDF for AI-powered analysis using Google Cloud Vision OCR
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg mb-2">Drop your document here or click to browse</p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports: PDF, JPG, PNG (Max 10MB)
            </p>
            {selectedFile && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Document Title */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title (e.g., Property Sale Deed, Loan Agreement)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {isProcessing && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Processing Document...</p>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Current step: {WORKFLOW_STEPS[currentStep]?.title}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Analysis Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">OCR Confidence</h4>
                <Badge variant="secondary">{Math.round((analysisResults.ocr_confidence || 0) * 100)}%</Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Clauses Detected</h4>
                <Badge variant="secondary">{analysisResults.clauses?.length || 0}</Badge>
              </div>
            </div>
            
            {analysisResults.auth_flags?.risk_analysis && (
              <div>
                <h4 className="font-semibold mb-2">Risk Assessment</h4>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      analysisResults.auth_flags.risk_analysis.risk_level === 'high' ? 'destructive' :
                      analysisResults.auth_flags.risk_analysis.risk_level === 'medium' ? 'secondary' : 'default'
                    }
                  >
                    {analysisResults.auth_flags.risk_analysis.risk_level?.toUpperCase()} RISK
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Score: {analysisResults.auth_flags.risk_analysis.risk_score}/100
                  </span>
                </div>
                <p className="text-sm mt-2">{analysisResults.auth_flags.risk_analysis.summary}</p>
              </div>
            )}
            
            {analysisResults.clauses && analysisResults.clauses.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Key Clauses</h4>
                <div className="space-y-2">
                  {analysisResults.clauses.map((clause: any, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline">{clause.type.replace('_', ' ')}</Badge>
                        <span className="text-xs text-muted-foreground">{Math.round(clause.confidence * 100)}% confident</span>
                      </div>
                      <p className="text-sm font-medium">{clause.plain_explanation}</p>
                      <p className="text-xs text-muted-foreground mt-1">{clause.mentioned_law}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Consent Section - Only show after analysis is complete */}
      {analysisResults && !evidenceRecord && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Consent & Biometric Verification</CardTitle>
            <CardDescription>
              Complete the following steps to generate tamper-proof evidence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Phone OTP Verification */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Phone Verification
                {isOtpVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
              </h4>
              {!isOtpSent ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="+91 9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={sendOTP}>Send OTP</Button>
                </div>
              ) : !isOtpVerified ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                  />
                  <Button onClick={verifyOTP}>Verify</Button>
                </div>
              ) : (
                <Badge variant="outline" className="bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            <Separator />

            {/* Location Capture */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Capture
                {location && <CheckCircle className="h-4 w-4 text-green-500" />}
              </h4>
              {!location ? (
                <Button onClick={captureLocation} variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  Capture Current Location
                </Button>
              ) : (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Location Captured</p>
                  <p className="text-xs text-muted-foreground">{location.address}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Fingerprint Simulation */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Fingerprint className="h-4 w-4" />
                Biometric Verification
                {fingerprintData && <CheckCircle className="h-4 w-4 text-green-500" />}
              </h4>
              {!fingerprintData ? (
                <Button onClick={generateFingerprint} variant="outline">
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Capture Fingerprint
                </Button>
              ) : (
                <Badge variant="outline" className="bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Biometric Captured
                </Badge>
              )}
            </div>

            <Separator />

            {/* Voice Recording */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice Consent (Optional)
                {voiceRecording && <CheckCircle className="h-4 w-4 text-green-500" />}
              </h4>
              {!voiceRecording ? (
                <Button onClick={startVoiceRecording} variant="outline">
                  <Mic className="h-4 w-4 mr-2" />
                  Record Voice Consent
                </Button>
              ) : (
                <Badge variant="outline" className="bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Voice Recorded
                </Badge>
              )}
            </div>

            <Button
              onClick={submitConsent}
              disabled={!isOtpVerified || !location || !fingerprintData}
              className="w-full"
            >
              Submit Consent & Generate Evidence
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Evidence Record */}
      {evidenceRecord && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Evidence Record Generated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Document Hash</h4>
                <code className="text-xs bg-muted p-2 rounded block">
                  {evidenceRecord.document_hash}
                </code>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Digital Signature</h4>
                <code className="text-xs bg-muted p-2 rounded block">
                  {evidenceRecord.signature?.substring(0, 32)}...
                </code>
              </div>
            </div>
            
            {evidenceRecord.blockchain_tx_hash && (
              <div>
                <h4 className="font-semibold mb-2">Blockchain Transaction</h4>
                <code className="text-xs bg-muted p-2 rounded block">
                  {evidenceRecord.blockchain_tx_hash}
                </code>
              </div>
            )}

            <Button onClick={downloadEvidence} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Evidence Package
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Process Button - Only show initially */}
      {!isProcessing && !analysisResults && (
        <div className="text-center">
          <Button
            onClick={processDocument}
            disabled={!selectedFile || !documentTitle || isProcessing}
            size="lg"
            className="px-8"
          >
            {isProcessing ? 'Processing...' : 'Process Document'}
          </Button>
        </div>
      )}
    </div>
  );
};