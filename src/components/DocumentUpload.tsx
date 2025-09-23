import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Scan, Shield, Fingerprint, FileCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WORKFLOW_STEPS = [
  { icon: Upload, title: "Upload Document", description: "Select your legal document" },
  { icon: Scan, title: "OCR Processing", description: "Extract text from document" },
  { icon: FileText, title: "Clause Analysis", description: "Identify key clauses" },
  { icon: Shield, title: "Authenticity Check", description: "Verify document integrity" },
  { icon: Fingerprint, title: "Consent Capture", description: "Record biometric consent" },
  { icon: FileCheck, title: "Evidence Generation", description: "Create tamper-proof record" },
];

export const DocumentUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }
    setFile(selectedFile);
    setDocumentTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
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
    if (!file || !documentTitle) return;

    setProcessing(true);
    setProgress(0);
    setCurrentStep(0);

    // Simulate processing steps
    for (let i = 0; i < WORKFLOW_STEPS.length; i++) {
      setCurrentStep(i);
      setProgress(((i + 1) / WORKFLOW_STEPS.length) * 100);
      
      // Simulate processing time for each step
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (i === 2) {
        // Show clause analysis results
        toast({
          title: "Clauses Detected",
          description: "Found payment terms, liability clauses, and transfer conditions",
        });
      } else if (i === 3) {
        // Show authenticity check
        toast({
          title: "Authenticity Verified",
          description: "Document passes integrity checks",
        });
      }
    }

    toast({
      title: "Document Processed Successfully",
      description: "Evidence record has been generated and stored securely",
    });

    setProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Legal Document Processor</h1>
        <p className="text-muted-foreground">
          AI-powered document verification with biometric consent capture
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {WORKFLOW_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStep && processing;
          const isCompleted = index < currentStep && processing;
          
          return (
            <div
              key={index}
              className={`text-center p-4 rounded-lg border transition-all ${
                isActive ? 'border-primary bg-primary/5' : 
                isCompleted ? 'border-success bg-success/5' : 'border-border'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                isActive ? 'bg-primary text-primary-foreground' :
                isCompleted ? 'bg-success text-success-foreground' : 'bg-muted'
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
          <p className="text-sm text-muted-foreground">
            Upload a scanned document or PDF for AI-powered text extraction
          </p>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg mb-2">Drop your document here or click to browse</p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports: PDF, JPG, PNG (Max 10MB)
            </p>
            {file && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
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
      {processing && (
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

      {/* Process Button */}
      <div className="text-center">
        <Button
          onClick={processDocument}
          disabled={!file || !documentTitle || processing}
          size="lg"
          className="px-8"
        >
          {processing ? 'Processing...' : 'Process Document'}
        </Button>
      </div>
    </div>
  );
};