-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analyses table
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  ocr_text TEXT,
  ocr_confidence FLOAT,
  preprocessed_image_path TEXT,
  clauses JSONB DEFAULT '[]'::jsonb,
  auth_flags JSONB DEFAULT '{}'::jsonb,
  tts_audio_path TEXT,
  translation_hi TEXT,
  analysis_confidence FLOAT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consent_records table
CREATE TABLE public.consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  phone_number TEXT,
  otp_verified BOOLEAN DEFAULT false,
  fingerprint_hash TEXT,
  voice_file_path TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evidence_records table
CREATE TABLE public.evidence_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consent_id UUID NOT NULL REFERENCES public.consent_records(id) ON DELETE CASCADE,
  evidence_json JSONB NOT NULL,
  document_hash TEXT NOT NULL,
  signature TEXT NOT NULL,
  previous_hash TEXT,
  encrypted BOOLEAN DEFAULT false,
  encryption_metadata JSONB,
  blockchain_tx_hash TEXT,
  ipfs_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create otp_verifications table
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Public read access to analyses" 
ON public.analyses 
FOR SELECT 
USING (true);

CREATE POLICY "Service can manage analyses" 
ON public.analyses 
FOR ALL 
USING (true);

CREATE POLICY "Public read access to consent records" 
ON public.consent_records 
FOR SELECT 
USING (true);

CREATE POLICY "Service can manage consent records" 
ON public.consent_records 
FOR ALL 
USING (true);

CREATE POLICY "Public read access to evidence records" 
ON public.evidence_records 
FOR SELECT 
USING (true);

CREATE POLICY "Service can manage evidence records" 
ON public.evidence_records 
FOR ALL 
USING (true);

CREATE POLICY "Service can manage OTP verifications" 
ON public.otp_verifications 
FOR ALL 
USING (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('processed', 'processed', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', false);

-- Create storage policies
CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents');

CREATE POLICY "Service can manage processed files" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'processed');

CREATE POLICY "Service can manage audio files" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'audio');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
BEFORE UPDATE ON public.analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();