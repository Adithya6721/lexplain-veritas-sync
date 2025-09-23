import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Eye, Shield, FileText, Lock } from "lucide-react";

const EVIDENCE_RECORDS = [
  {
    id: "evidence_1758556",
    title: "Affidavit Of Identity Example",
    created: "Sep 22, 2025",
    status: "Valid",
    creditsUsed: 12,
    riskLevel: "Low"
  },
  {
    id: "evidence_1758519",
    title: "test1",
    created: "Sep 22, 2025",
    status: "Valid",
    creditsUsed: 8,
    riskLevel: "Medium"
  },
  {
    id: "evidence_1758518",
    title: "Affidavit Of Identity Example",
    created: "Sep 22, 2025",
    status: "Valid",
    creditsUsed: 15,
    riskLevel: "Low"
  },
  {
    id: "evidence_1758517",
    title: "Property Agreement",
    created: "Sep 21, 2025",
    status: "Valid",
    creditsUsed: 22,
    riskLevel: "High"
  },
  {
    id: "evidence_1758516",
    title: "Loan Document",
    created: "Sep 21, 2025",
    status: "Valid",
    creditsUsed: 18,
    riskLevel: "Medium"
  },
  {
    id: "evidence_1758515",
    title: "Service Agreement",
    created: "Sep 20, 2025",
    status: "Valid",
    creditsUsed: 10,
    riskLevel: "Low"
  },
  {
    id: "evidence_1758514",
    title: "Employment Contract",
    created: "Sep 20, 2025",
    status: "Valid",
    creditsUsed: 14,
    riskLevel: "Low"
  }
];

export const EvidenceVault = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  const filteredRecords = EVIDENCE_RECORDS.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEvidenceRecord = EVIDENCE_RECORDS.find(r => r.id === selectedRecord);

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
                          <span>Credits: {record.creditsUsed}</span>
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
                      <Button size="sm" variant="outline" className="text-xs">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
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
                      <span className="text-muted-foreground">Credits Used:</span>
                      <span>{selectedEvidenceRecord.creditsUsed}</span>
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
                  <div className="pt-4 border-t">
                    <Button size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Full Evidence Package
                    </Button>
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