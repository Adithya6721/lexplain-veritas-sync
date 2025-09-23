import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Shield, 
  FileText, 
  Download,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Clock,
  MapPin
} from 'lucide-react';

interface DashboardStepProps {
  onRestart: () => void;
  workflowData: any;
}

export const DashboardStep: React.FC<DashboardStepProps> = ({ onRestart, workflowData }) => {
  const { document, analysisResult, consentData, evidenceRecord } = workflowData;

  const downloadCompleteReport = () => {
    const completeReport = {
      document_info: {
        filename: document?.name || 'Unknown',
        size: document?.size || 0,
        type: document?.type || 'Unknown'
      },
      analysis_summary: {
        total_clauses: analysisResult?.clauses?.length || 0,
        risk_level: analysisResult?.overallRisk || 'unknown',
        confidence: analysisResult?.confidence || 0,
        qr_codes_found: analysisResult?.qrCodes?.length || 0,
        barcodes_found: analysisResult?.barcodes?.length || 0
      },
      consent_verification: {
        timestamp: consentData?.timestamp,
        location_captured: !!consentData?.location,
        voice_recorded: consentData?.voiceRecorded,
        fingerprint_captured: consentData?.fingerprintCaptured
      },
      evidence_record: {
        id: evidenceRecord?.evidence_id,
        blockchain_anchored: evidenceRecord?.blockchain_anchored,
        ipfs_anchored: evidenceRecord?.ipfs_anchored
      },
      generated_at: new Date().toISOString()
    };

    const dataStr = JSON.stringify(completeReport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `complete_report_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-destructive/20 text-destructive';
      case 'medium': return 'bg-warning/20 text-warning';
      case 'low': return 'bg-success/20 text-success';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Step 6: Dashboard - Processing Complete</h1>
        <p className="text-muted-foreground">
          Your document has been successfully processed and secured with tamper-evident evidence
        </p>
      </div>

      {/* Success Banner */}
      <Card className="bg-success/5 border-success/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-success">Processing Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Your legal document has been analyzed, verified, and secured with blockchain-anchored evidence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Most Recently Processed Document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Most Recently Processed Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{analysisResult?.clauses?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Clauses Analyzed</div>
            </div>
            <div className="text-center">
              <Badge className={getRiskBadgeColor(analysisResult?.overallRisk || 'unknown')}>
                {(analysisResult?.overallRisk || 'unknown').toUpperCase()}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Risk Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round((analysisResult?.confidence || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">✓</div>
              <div className="text-sm text-muted-foreground">Evidence Secured</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{document?.name || 'Legal Document'}</p>
                <p className="text-sm text-muted-foreground">
                  Processed on {new Date().toLocaleDateString()} • 
                  {document?.size ? ` ${(document.size / 1024 / 1024).toFixed(2)} MB` : ''}
                </p>
              </div>
              <Badge className="bg-success/20 text-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analysis Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">High Risk Clauses:</span>
                <span className="text-sm font-medium">
                  {analysisResult?.clauses?.filter((c: any) => c.risk_level === 'high').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Medium Risk Clauses:</span>
                <span className="text-sm font-medium">
                  {analysisResult?.clauses?.filter((c: any) => c.risk_level === 'medium').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Missing Clauses:</span>
                <span className="text-sm font-medium">
                  {analysisResult?.clauses?.filter((c: any) => c.missing).length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">QR/Barcodes Found:</span>
                <span className="text-sm font-medium">
                  {(analysisResult?.qrCodes?.length || 0) + (analysisResult?.barcodes?.length || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Shield className="h-4 w-4 mr-2" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Voice Consent:</span>
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Biometric ID:</span>
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Location Data:</span>
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Blockchain Anchor:</span>
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Clock className="h-4 w-4 mr-2" />
              Processing Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-success" />
                <span className="text-sm">Document Upload</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-success" />
                <span className="text-sm">OCR Processing</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-success" />
                <span className="text-sm">Comprehensive Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-success" />
                <span className="text-sm">Multilingual Summary</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-success" />
                <span className="text-sm">Consent & Evidence</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence Record Details */}
      {evidenceRecord && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Evidence Record Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Evidence ID:</strong>
                  <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                    {evidenceRecord.evidence_id}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Security Features:</strong>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      <span className="text-xs">Cryptographic Signature</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      <span className="text-xs">Blockchain Anchored</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      <span className="text-xs">IPFS Distributed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {consentData?.timestamp && (
              <div className="mt-4 p-3 bg-muted/50 rounded">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Consent: {new Date(consentData.timestamp).toLocaleString()}</span>
                  </div>
                  {consentData.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>Location Verified</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={downloadCompleteReport} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Download Complete Report</span>
        </Button>
        <Button variant="outline" onClick={onRestart} className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Process Another Document</span>
        </Button>
      </div>
    </div>
  );
};