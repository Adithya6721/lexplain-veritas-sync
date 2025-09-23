import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../auth/AuthContext';

interface DocumentUploadStepProps {
  onComplete: (data: any) => void;
  workflowData: any;
}

export const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({ onComplete, workflowData }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(workflowData.document);

  const handleFileUpload = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `documents/${user.id}/${fileName}`;

      setUploadProgress(25);

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

      setUploadProgress(100);
      setUploadedFile(file);

      toast({
        title: "Document uploaded successfully",
        description: "Ready to proceed to OCR processing"
      });

      // Complete step with document data
      setTimeout(() => {
        onComplete({
          document: file,
          documentId: docData.id,
          filePath: filePath
        });
      }, 1000);

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [user, toast, onComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
    disabled: isUploading || !!uploadedFile
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Step 1: Upload Document</h1>
        <p className="text-muted-foreground">
          Upload your legal document for AI-powered analysis and verification
        </p>
      </div>

      {!uploadedFile ? (
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
                  <Button className="mt-2" disabled={isUploading}>
                    Select File
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-success" />
              Document Uploaded Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • {uploadedFile.type}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isUploading && (
        <Card>
          <CardContent className="pt-6">
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