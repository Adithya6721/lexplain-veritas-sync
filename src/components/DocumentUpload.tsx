import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  FileText, 
  Scan, 
  CheckCircle, 
  AlertTriangle, 
  Shield,
  Eye,
  Download,
  Loader2,
  ArrowRight
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";
import { DocumentAnalysis } from "./DocumentAnalysis";
import { ConsentCapture } from "./ConsentCapture";

export const DocumentUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'upload' | 'analysis' | 'consent' | 'complete'>('upload');
  const [consentData, setConsentData] = useState<any>(null);
  const [evidenceRecord, setEvidenceRecord] = useState<any>(null);

  const handleFileUpload = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user) return;

    try {
      setUploadedFile(file);
      setCurrentStep("Processing document...");
      setIsProcessing(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `documents/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          original_filename: file.name,
          file_path: filePath,
          mime_type: file.type,
          file_size: file.size,
          status: 'uploaded'
        })
        .select()
        .single();

      if (docError) throw docError;
      
      setDocumentId(docData.id);
      setUploadProgress(100);

      // Process with edge function
      setCurrentStep("Analyzing document content...");
      
      // Create FormData for edge function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);
      
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'upload-document',
        {
          body: formData
        }
      );

      if (analysisError) throw analysisError;
      
      // Check if analysis data is available or still processing
      if (analysisData.status === 'processing') {
        setDocumentId(analysisData.document_id);
        setOcrText("Document processing started...");
        setCurrentPhase('analysis');
      } else {
        setOcrText(analysisData.ocr_text || "No text extracted");
        setCurrentPhase('analysis');
      }
      
      toast({
        title: "Document uploaded successfully",
        description: "Starting AI analysis..."
      });

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to process document",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [user, toast]);

  const handleAnalysisComplete = (analysis: any) => {
    setAnalysisResult(analysis);
    setCurrentPhase('consent');
    toast({
      title: "Analysis Complete",
      description: "Review the analysis and provide consent to generate evidence."
    });
  };

  const handleConsentComplete = (consent: any) => {
    setConsentData(consent);
    setEvidenceRecord(consent.evidence_record);
    setCurrentPhase('complete');
    toast({
      title: "Evidence Generated",
      description: "Your tamper-evident evidence record has been created."
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024 // 20MB
  });

  const resetUpload = () => {
    setUploadedFile(null);
    setDocumentId(null);
    setOcrText("");
    setAnalysisResult(null);
    setUploadProgress(0);
    setCurrentStep("");
    setIsProcessing(false);
    setCurrentPhase('upload');
    setConsentData(null);
    setEvidenceRecord(null);
  };

  const downloadEvidence = async () => {
    if (!evidenceRecord) return;

    try {
      const evidenceData = {
        evidence_id: evidenceRecord.id,
        document_analysis: analysisResult,
        consent_data: consentData,
        blockchain_hash: evidenceRecord.blockchain_tx_hash,
        ipfs_hash: evidenceRecord.ipfs_hash,
        timestamp: evidenceRecord.created_at,
        verification_signature: evidenceRecord.signature
      };

      const dataStr = JSON.stringify(evidenceData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `evidence_${evidenceRecord.id}_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast({
        title: "Evidence Downloaded",
        description: "Evidence package has been downloaded as JSON file."
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download evidence package.",
        variant: "destructive"
      });
    }
  };

  // Phase-based rendering
  if (currentPhase === 'analysis' && ocrText && documentId) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Document Analysis</h1>
          <p className="text-muted-foreground">
            AI-powered clause extraction and risk assessment in progress
          </p>
        </div>
        <DocumentAnalysis 
          documentId={documentId}
          ocrText={ocrText}
          onAnalysisComplete={handleAnalysisComplete}
        />
      </div>
    );
  }

  if (currentPhase === 'consent' && analysisResult && documentId) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Biometric Consent Capture</h1>
          <p className="text-muted-foreground">
            Complete verification to generate tamper-evident evidence record
          </p>
        </div>
        <ConsentCapture 
          onConsentComplete={handleConsentComplete}
          analysisId={analysisResult.analysis_id || documentId}
        />
      </div>
    );
  }

  if (currentPhase === 'complete' && evidenceRecord) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Evidence Generation Complete</h1>
          <p className="text-muted-foreground">
            Your tamper-evident evidence record has been successfully created
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-success" />
              Evidence Record Generated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <h4 className="font-medium text-success">Verification Complete</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Your document has been analyzed and secured with cryptographic signatures, 
                biometric consent, and blockchain anchoring.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Evidence ID</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded">{evidenceRecord.id}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Blockchain Hash</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded truncate">
                  {evidenceRecord.blockchain_tx_hash || 'Pending...'}
                </p>
              </div>
            </div>

            <div className="flex space-x-4 justify-center">
              <Button onClick={downloadEvidence} className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Download Evidence Package</span>
              </Button>
              <Button variant="outline" onClick={() => window.open('/evidence', '_blank')}>
                <Eye className="h-4 w-4 mr-2" />
                View in Evidence Vault
              </Button>
              <Button variant="outline" onClick={resetUpload}>
                Process Another Document
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Process Legal Document</h1>
        <p className="text-muted-foreground">
          Upload your document for AI-powered analysis, clause extraction, and tamper-evident evidence generation
        </p>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { phase: 'upload', title: 'Upload', icon: Upload, desc: 'Select document' },
          { phase: 'analysis', title: 'Analyze', icon: Scan, desc: 'AI clause extraction' },
          { phase: 'consent', title: 'Consent', icon: Shield, desc: 'Biometric verification' },
          { phase: 'complete', title: 'Evidence', icon: CheckCircle, desc: 'Generate proof' }
        ].map((step, index) => {
          const Icon = step.icon;
          const isActive = currentPhase === step.phase;
          const isCompleted = ['upload', 'analysis', 'consent'].indexOf(currentPhase) > ['upload', 'analysis', 'consent'].indexOf(step.phase);
          
          return (
            <div
              key={index}
              className={`flex items-center p-4 rounded-lg border transition-all ${
                isActive ? 'border-primary bg-primary/5' : 
                isCompleted ? 'border-success bg-success/5' : 'border-border'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                isActive ? 'bg-primary text-primary-foreground' :
                isCompleted ? 'bg-success text-white' : 'bg-muted'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
              {index < 3 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto hidden md:block" />
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Section */}
      {!uploadedFile && (
        <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className={`text-center cursor-pointer transition-colors ${
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isDragActive ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <Upload className={`h-8 w-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {isDragActive ? 'Drop your document here' : 'Upload Legal Document'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop or click to select • PDF, DOC, DOCX, Images • Max 20MB
                  </p>
                  <Button className="mt-2">
                    Select File
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Section */}
      {isProcessing && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {currentStep}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Upload Progress</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};