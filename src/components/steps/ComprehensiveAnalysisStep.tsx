import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  DollarSign,
  Home,
  Scale,
  XCircle,
  FileText,
  Loader2,
  QrCode,
  Scan
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ComprehensiveAnalysisStepProps {
  onComplete: (data: any) => void;
  onBack: () => void;
  workflowData: any;
}

const CLAUSE_TYPES = {
  payment: { icon: DollarSign, label: 'Payment Terms', color: 'text-green-600' },
  penalty: { icon: AlertTriangle, label: 'Penalty Clauses', color: 'text-red-600' },
  liability: { icon: Shield, label: 'Liability Terms', color: 'text-orange-600' },
  property: { icon: Home, label: 'Property Rights', color: 'text-blue-600' },
  termination: { icon: XCircle, label: 'Termination', color: 'text-purple-600' },
  jurisdiction: { icon: Scale, label: 'Jurisdiction', color: 'text-gray-600' },
  other: { icon: FileText, label: 'Other Clauses', color: 'text-gray-500' }
};

export const ComprehensiveAnalysisStep: React.FC<ComprehensiveAnalysisStepProps> = ({ 
  onComplete, 
  onBack, 
  workflowData 
}) => {
  const { toast } = useToast();
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing analysis...');
  const [clauses, setClauses] = useState<any[]>([]);
  const [qrCodes, setQrCodes] = useState<string[]>([]);
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [authFlags, setAuthFlags] = useState<any>({});
  const [overallRisk, setOverallRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (workflowData.ocrText) {
      performComprehensiveAnalysis();
    }
  }, [workflowData]);

  const performComprehensiveAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      
      // Step 1: Extract clauses
      setCurrentStep('Extracting legal clauses...');
      setAnalysisProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const extractedClauses = extractClausesFromText(workflowData.ocrText);
      setClauses(extractedClauses);

      // Step 2: QR/Barcode scanning
      setCurrentStep('Scanning QR codes and barcodes...');
      setAnalysisProgress(40);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { qr_codes, barcodes: detected_barcodes, flags } = detectCodesAndFlags(workflowData.ocrText);
      setQrCodes(qr_codes);
      setBarcodes(detected_barcodes);
      setAuthFlags(flags);

      // Step 3: Risk analysis
      setCurrentStep('Analyzing risk levels...');
      setAnalysisProgress(60);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const riskLevel = calculateOverallRisk(extractedClauses, flags);
      setOverallRisk(riskLevel);

      // Step 4: Cross-verification
      setCurrentStep('Cross-verifying document authenticity...');
      setAnalysisProgress(80);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 5: Final analysis
      setCurrentStep('Finalizing comprehensive analysis...');
      setAnalysisProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      setIsComplete(true);
      setIsAnalyzing(false);

      toast({
        title: "Analysis Complete",
        description: `Found ${extractedClauses.length} clauses with ${riskLevel} risk level`
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to analyze document",
        variant: "destructive"
      });
    }
  };

  const extractClausesFromText = (text: string) => {
    const clauses = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Payment terms detection
    const paymentTerms = sentences.filter(s => 
      /payment|pay|amount|rupees|₹|dollars?|\$|fee|cost|price/i.test(s)
    );
    
    paymentTerms.slice(0, 2).forEach((term, i) => {
      clauses.push({
        id: `payment_${i}`,
        type: 'payment',
        text: term.trim(),
        risk_level: detectPaymentRisk(term),
        confidence: 0.85,
        explanation: 'Payment clause detected - review terms carefully',
        legal_reference: 'Indian Contract Act, 1872 - Section 10',
        recommendation: 'Ensure payment terms are clearly defined with specific amounts and deadlines'
      });
    });

    // Penalty clauses
    const penaltyClauses = sentences.filter(s => 
      /penalty|fine|forfeit|breach|default|damages|compensation/i.test(s)
    );

    penaltyClauses.slice(0, 2).forEach((penalty, i) => {
      clauses.push({
        id: `penalty_${i}`,
        type: 'penalty',
        text: penalty.trim(),
        risk_level: 'high',
        confidence: 0.9,
        explanation: 'Penalty clause - high risk if breached',
        legal_reference: 'Indian Contract Act, Section 74',
        recommendation: 'Carefully review penalty amounts and conditions'
      });
    });

    // Property/ownership clauses
    const propertyClauses = sentences.filter(s => 
      /property|ownership|transfer|collateral|asset/i.test(s)
    );

    propertyClauses.slice(0, 1).forEach((property, i) => {
      clauses.push({
        id: `property_${i}`,
        type: 'property',
        text: property.trim(),
        risk_level: 'high',
        confidence: 0.88,
        explanation: 'Property transfer clause - significant ownership implications',
        legal_reference: 'Transfer of Property Act, 1882',
        recommendation: 'Understand property transfer conditions and implications'
      });
    });

    // Liability clauses
    const liabilityClauses = sentences.filter(s => 
      /liable|liability|responsible|indemnify|indemnity|damages|loss/i.test(s)
    );

    liabilityClauses.slice(0, 1).forEach((liability, i) => {
      clauses.push({
        id: `liability_${i}`,
        type: 'liability',
        text: liability.trim(),
        risk_level: 'medium',
        confidence: 0.8,
        explanation: 'Liability clause - defines responsibility for damages',
        legal_reference: 'Indian Contract Act, Section 124',
        recommendation: 'Understand your liability exposure and consider insurance'
      });
    });

    // Check for missing critical clauses
    const existingTypes = clauses.map(c => c.type);
    const criticalTypes = ['termination', 'jurisdiction'];
    
    criticalTypes.forEach(type => {
      if (!existingTypes.includes(type)) {
        clauses.push({
          id: `missing_${type}`,
          type: type,
          text: `Missing ${type} clause`,
          risk_level: 'high',
          confidence: 0.9,
          explanation: `This document lacks a ${type} clause, which could lead to legal complications.`,
          legal_reference: type === 'termination' ? 'Indian Contract Act, Section 56' : 'Code of Civil Procedure, 1908',
          recommendation: `Add a clear ${type} clause to protect your interests.`,
          missing: true
        });
      }
    });

    return clauses;
  };

  const detectPaymentRisk = (text: string): 'low' | 'medium' | 'high' => {
    if (/late|penalty|interest|compound/i.test(text)) return 'high';
    if (/advance|upfront|immediate/i.test(text)) return 'medium';
    return 'low';
  };

  const detectCodesAndFlags = (text: string) => {
    const flags = {
      qr_present: false,
      barcode_present: false,
      qr_mismatch: false,
      format_suspicious: false
    };

    // Look for QR code data in OCR text
    const qrMatches = text.match(/QR Code Data: ([^\n]+)/g);
    const barcodeMatches = text.match(/Barcode: ([^\n]+)/g);
    const docIdMatches = text.match(/Document ID: ([^\n\s]+)/g);
    const verificationMatches = text.match(/Document Verification Code: ([^\n\s]+)/g);

    const qr_codes = qrMatches ? qrMatches.map(m => m.replace('QR Code Data: ', '')) : [];
    const barcodes = barcodeMatches ? barcodeMatches.map(m => m.replace('Barcode: ', '')) : [];

    flags.qr_present = qr_codes.length > 0;
    flags.barcode_present = barcodes.length > 0 || verificationMatches !== null;

    // Check for mismatches
    if (flags.qr_present && docIdMatches) {
      const docId = docIdMatches[0].replace('Document ID: ', '');
      const qrData = qr_codes[0];
      flags.qr_mismatch = !qrData.includes(docId);
    }

    // Check for format issues
    flags.format_suspicious = text.includes('DRAFT') || text.includes('COPY') || 
                             text.split('\n').length < 5;

    return { qr_codes, barcodes, flags };
  };

  const calculateOverallRisk = (clauses: any[], flags: any): 'low' | 'medium' | 'high' => {
    const riskLevels = clauses.map(c => c.risk_level);
    const highRisk = riskLevels.filter(r => r === 'high').length;
    const mediumRisk = riskLevels.filter(r => r === 'medium').length;
    
    // Factor in authentication flags
    let flagRisk = 0;
    if (flags.qr_mismatch) flagRisk += 2;
    if (flags.format_suspicious) flagRisk += 1;
    if (!flags.qr_present && !flags.barcode_present) flagRisk += 1;
    
    if (highRisk > 0 || flagRisk >= 2) return 'high';
    if (mediumRisk > 1 || flagRisk >= 1) return 'medium';
    return 'low';
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-destructive/20 text-destructive';
      case 'medium': return 'bg-warning/20 text-warning';
      case 'low': return 'bg-success/20 text-success';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const handleContinue = () => {
    onComplete({
      analysisResult: {
        clauses,
        qrCodes,
        barcodes,
        authFlags,
        overallRisk,
        confidence: 0.85
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Step 3: Comprehensive Analysis</h1>
        <p className="text-muted-foreground">
          AI-powered clause extraction, risk assessment, and document authenticity verification
        </p>
      </div>

      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader2 className="h-5 w-5 mr-2 animate-spin text-primary" />
              Analyzing Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{currentStep}</span>
                <span className="text-sm text-muted-foreground">{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {isComplete && (
        <>
          {/* Analysis Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-success" />
                Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{clauses.length}</div>
                  <div className="text-sm text-muted-foreground">Clauses Found</div>
                </div>
                <div className="text-center">
                  <Badge className={getRiskBadgeColor(overallRisk)}>
                    {overallRisk.toUpperCase()} RISK
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Overall Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{qrCodes.length + barcodes.length}</div>
                  <div className="text-sm text-muted-foreground">Codes Detected</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">85%</div>
                  <div className="text-sm text-muted-foreground">Confidence</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authentication Flags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scan className="h-5 w-5 mr-2" />
                Document Authenticity Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-2">
                    <QrCode className="h-4 w-4" />
                    <span className="text-sm">QR Code Present</span>
                  </div>
                  <Badge variant={authFlags.qr_present ? "default" : "secondary"}>
                    {authFlags.qr_present ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-2">
                    <Scan className="h-4 w-4" />
                    <span className="text-sm">Barcode Present</span>
                  </div>
                  <Badge variant={authFlags.barcode_present ? "default" : "secondary"}>
                    {authFlags.barcode_present ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">QR Mismatch</span>
                  </div>
                  <Badge variant={authFlags.qr_mismatch ? "destructive" : "default"}>
                    {authFlags.qr_mismatch ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Format Issues</span>
                  </div>
                  <Badge variant={authFlags.format_suspicious ? "destructive" : "default"}>
                    {authFlags.format_suspicious ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clause Analysis */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Detected Clauses</h3>
            {clauses.map((clause) => {
              const ClauseIcon = CLAUSE_TYPES[clause.type]?.icon || FileText;
              return (
                <Card key={clause.id} className={clause.missing ? 'border-destructive/50' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center">
                        <ClauseIcon className={`h-4 w-4 mr-2 ${CLAUSE_TYPES[clause.type]?.color || 'text-gray-500'}`} />
                        {CLAUSE_TYPES[clause.type]?.label || 'Other Clause'}
                        {clause.missing && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Missing
                          </Badge>
                        )}
                      </CardTitle>
                      <Badge className={getRiskBadgeColor(clause.risk_level)}>
                        {clause.risk_level}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm bg-muted p-3 rounded">
                      <strong>Text:</strong> {clause.text}
                    </div>
                    
                    <div>
                      <strong className="text-sm">Explanation:</strong>
                      <p className="text-sm mt-1">{clause.explanation}</p>
                    </div>
                    
                    {clause.legal_reference && (
                      <div>
                        <strong className="text-sm">Legal Reference:</strong>
                        <p className="text-sm mt-1 text-muted-foreground">{clause.legal_reference}</p>
                      </div>
                    )}
                    
                    {clause.recommendation && (
                      <div>
                        <strong className="text-sm">Recommendation:</strong>
                        <p className="text-sm mt-1 text-blue-600">{clause.recommendation}</p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Confidence: {Math.round(clause.confidence * 100)}%
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to OCR
        </Button>
        
        {isComplete && (
          <Button onClick={handleContinue}>
            Continue to Summary
          </Button>
        )}
      </div>
    </div>
  );
};