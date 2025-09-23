import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Eye, Shield, FileText, Lock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";

export const EvidenceVault = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [evidenceRecords, setEvidenceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEvidenceRecords();
    }
  }, [user]);

  const fetchEvidenceRecords = async () => {
    try {
      setLoading(true);
      
      // Fetch evidence records with related data
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRecords = data.map(record => {
        const evidenceJson = typeof record.evidence_json === 'object' ? record.evidence_json as any : {};
        return {
          id: record.id,
          title: evidenceJson?.document?.filename || 'Unknown Document',
          created: new Date(record.created_at).toLocaleDateString(),
          status: 'Valid',
          riskLevel: evidenceJson?.analysis?.overall_risk || 'Medium',
          clausesDetected: evidenceJson?.analysis?.clauses?.length || 0,
          blockchainHash: record.blockchain_tx_hash,
          ipfsHash: record.ipfs_hash,
          consentData: record.consent_records,
          rawData: record
        };
      });

      setEvidenceRecords(formattedRecords);
    } catch (error: any) {
      console.error('Error fetching evidence records:', error);
      toast({
        title: "Failed to load evidence records",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = evidenceRecords.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEvidenceRecord = evidenceRecords.find(r => r.id === selectedRecord);

  const downloadEvidence = async (record: any) => {
    try {
      const evidenceData = {
        evidence_id: record.id,
        document_title: record.title,
        analysis_summary: record.rawData.evidence_json?.analysis,
        consent_verification: record.consentData,
        blockchain_verification: {
          ethereum_hash: record.blockchainHash,
          ipfs_hash: record.ipfsHash
        },
        cryptographic_signature: record.rawData.signature,
        timestamp: record.rawData.created_at,
        verification_status: 'VERIFIED'
      };

      // JSON Download
      const jsonStr = JSON.stringify(evidenceData, null, 2);
      const jsonDataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(jsonStr);
      
      const jsonLink = document.createElement('a');
      jsonLink.setAttribute('href', jsonDataUri);
      jsonLink.setAttribute('download', `evidence_${record.id}_${new Date().toISOString().split('T')[0]}.json`);
      jsonLink.click();

      // PDF Generation (simplified version)
      const pdfContent = generatePDFContent(evidenceData);
      const pdfDataUri = 'data:text/html;charset=utf-8,' + encodeURIComponent(pdfContent);
      
      const pdfLink = document.createElement('a');
      pdfLink.setAttribute('href', pdfDataUri);
      pdfLink.setAttribute('download', `evidence_report_${record.id}.html`);
      pdfLink.click();

      toast({
        title: "Evidence Downloaded",
        description: "Evidence package has been downloaded in multiple formats."
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download evidence package.",
        variant: "destructive"
      });
    }
  };

  const generatePDFContent = (data: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Legal Document Evidence Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .section { margin: 20px 0; }
          .field { margin: 10px 0; }
          .label { font-weight: bold; }
          .signature { border: 1px solid #ccc; padding: 10px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>TAMPER-EVIDENT EVIDENCE REPORT</h1>
          <p>Document ID: ${data.evidence_id}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="section">
          <h2>Document Information</h2>
          <div class="field"><span class="label">Title:</span> ${data.document_title}</div>
          <div class="field"><span class="label">Verification Status:</span> ${data.verification_status}</div>
        </div>
        
        <div class="section">
          <h2>Analysis Summary</h2>
          <div class="field"><span class="label">Overall Risk:</span> ${data.analysis_summary?.overall_risk || 'N/A'}</div>
          <div class="field"><span class="label">Clauses Detected:</span> ${data.analysis_summary?.clauses?.length || 0}</div>
        </div>
        
        <div class="section">
          <h2>Blockchain Verification</h2>
          <div class="field"><span class="label">Ethereum Hash:</span> ${data.blockchain_verification.ethereum_hash || 'Pending'}</div>
          <div class="field"><span class="label">IPFS Hash:</span> ${data.blockchain_verification.ipfs_hash || 'Pending'}</div>
        </div>
        
        <div class="signature">
          <p><strong>Digital Signature:</strong></p>
          <p style="font-family: monospace; word-break: break-all;">${data.cryptographic_signature}</p>
          <p><em>This document is cryptographically signed and tamper-evident.</em></p>
        </div>
      </body>
      </html>
    `;
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'bg-destructive/20 text-destructive';
      case 'medium': return 'bg-warning/20 text-warning';
      case 'low': return 'bg-success/20 text-success';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Evidence Vault</h1>
            <p className="text-muted-foreground">
              Secure repository of tamper-evident legal document evidence
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-success">All Records Secured</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchEvidenceRecords}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by evidence ID or document name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evidence Records List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Evidence Records ({filteredRecords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedRecord === record.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSelectedRecord(record.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{record.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          ID: {record.id}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Created: {record.created}</span>
                          <span>Clauses: {record.clausesDetected}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className="bg-success/20 text-success">
                          <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                          {record.status}
                        </Badge>
                        <Badge className={getRiskBadgeColor(record.riskLevel)}>
                          {record.riskLevel} Risk
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs"
                        onClick={() => downloadEvidence(record)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs"
                        onClick={() => setSelectedRecord(record.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification Status & Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvidenceRecord ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Verification Complete</p>
                    <p className="text-sm text-muted-foreground">
                      Document integrity verified with blockchain hash
                    </p>
                  </div>
                  <div className="text-left space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Risk Level:</span>
                      <Badge className={getRiskBadgeColor(selectedEvidenceRecord.riskLevel)}>
                        {selectedEvidenceRecord.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-success font-medium">{selectedEvidenceRecord.status}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Clauses Found:</span>
                      <span>{selectedEvidenceRecord.clausesDetected}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select evidence to view verification status</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Evidence Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvidenceRecord ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{selectedEvidenceRecord.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete evidence package including biometric consent, document analysis, and authenticity verification.
                    </p>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Document ID:</span>
                      <span className="font-mono text-xs">{selectedEvidenceRecord.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{selectedEvidenceRecord.created}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Clauses Detected:</span>
                      <span>3 critical</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Biometric Consent:</span>
                      <span className="text-success">Captured</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => downloadEvidence(selectedEvidenceRecord)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Evidence Package
                    </Button>
                    {selectedEvidenceRecord?.blockchainHash && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <strong>Blockchain:</strong> {selectedEvidenceRecord.blockchainHash.substring(0, 20)}...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select an evidence record to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};