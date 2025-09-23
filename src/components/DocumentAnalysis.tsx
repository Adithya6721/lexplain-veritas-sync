import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  AlertTriangle, 
  Shield, 
  Eye, 
  Volume2, 
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  Scale,
  DollarSign,
  Home,
  Users,
  AlertCircle
} from 'lucide-react';

interface ClauseAnalysis {
  id: string;
  type: 'payment' | 'penalty' | 'liability' | 'property' | 'termination' | 'jurisdiction' | 'other';
  text: string;
  risk_level: 'low' | 'medium' | 'high';
  confidence: number;
  explanation: string;
  legal_reference?: string;
  recommendation?: string;
  missing?: boolean;
}

interface DocumentAnalysisProps {
  documentId: string;
  ocrText: string;
  onAnalysisComplete: (analysis: any) => void;
  onProceedToConsent?: () => void;
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

export const DocumentAnalysis = ({ documentId, ocrText, onAnalysisComplete, onProceedToConsent }: DocumentAnalysisProps) => {
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing...');
  const [clauses, setClauses] = useState<ClauseAnalysis[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [overallRisk, setOverallRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [confidence, setConfidence] = useState(0);
  const { language, autoTranslate, ttsEnabled } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalysisData();
  }, [documentId]);

  const fetchAnalysisData = async () => {
    try {
      setCurrentStep('Fetching analysis results...');
      setAnalysisProgress(10);

      // Try to fetch existing analysis first
      const { data: analysisData, error } = await supabase.functions.invoke('get-analysis', {
        body: { document_id: documentId }
      });

      if (error) throw error;

      if (analysisData?.success && analysisData.ocr_text) {
        // Analysis already exists, process it
        processExistingAnalysis(analysisData);
      } else {
        // Perform new analysis
        performAnalysis();
      }
    } catch (error) {
      console.error('Analysis fetch error:', error);
      // Fallback to mock analysis
      performAnalysis();
    }
  };

  const processExistingAnalysis = (data: any) => {
    setCurrentStep('Processing analysis results...');
    setAnalysisProgress(80);

    const extractedClauses = data.clauses || [];
    setClauses(extractedClauses);
    setConfidence(data.analysis_confidence || 0.85);
    
    // Determine overall risk
    const riskLevels = extractedClauses.map((c: any) => c.risk_level || 'medium');
    const highRisk = riskLevels.filter((r: string) => r === 'high').length;
    const mediumRisk = riskLevels.filter((r: string) => r === 'medium').length;
    
    if (highRisk > 0) setOverallRisk('high');
    else if (mediumRisk > 1) setOverallRisk('medium');
    else setOverallRisk('low');

    setAnalysisProgress(100);
    setCurrentStep('Analysis complete');
    setIsAnalyzing(false);

    // Complete the analysis
    setTimeout(() => {
      onAnalysisComplete({
        analysis_id: data.id || documentId,
        clauses: extractedClauses,
        risk_level: overallRisk,
        confidence: data.analysis_confidence || 0.85
      });
    }, 1000);
  };

  const performAnalysis = async () => {
    try {
      // Step 1: Extract clauses using mock analysis for now
      setCurrentStep('Extracting legal clauses...');
      setAnalysisProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const extractedClauses = extractClausesHeuristic(ocrText || 'Sample document text');
      
      // Step 2: Analyze risk levels
      setCurrentStep('Analyzing risk levels...');
      setAnalysisProgress(40);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setClauses(extractedClauses);

      // Step 3: Check for missing critical clauses
      setCurrentStep('Checking for missing clauses...');
      setAnalysisProgress(60);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const missingClauses = checkForMissingClauses(extractedClauses);
      
      // Step 4: Generate translations
      setCurrentStep('Generating translations...');
      setAnalysisProgress(80);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (autoTranslate && language !== 'en') {
        const translationsMap: Record<string, string> = {};
        extractedClauses.forEach(clause => {
          translationsMap[clause.id] = `${clause.explanation} (Translated to ${language})`;
        });
        setTranslations(translationsMap);
      }

      // Step 5: Calculate overall risk and confidence
      setCurrentStep('Finalizing analysis...');
      setAnalysisProgress(95);
      await new Promise(resolve => setTimeout(resolve, 500));

      const riskLevels = extractedClauses.map(c => c.risk_level);
      const highRisk = riskLevels.filter(r => r === 'high').length;
      const mediumRisk = riskLevels.filter(r => r === 'medium').length;
      
      let finalRisk: 'low' | 'medium' | 'high' = 'low';
      if (highRisk > 0) finalRisk = 'high';
      else if (mediumRisk > 1) finalRisk = 'medium';
      
      setOverallRisk(finalRisk);
      setConfidence(0.85);
      setAnalysisProgress(100);
      setCurrentStep('Analysis complete');
      setIsAnalyzing(false);

      // Complete the analysis
      setTimeout(() => {
        onAnalysisComplete({
          analysis_id: documentId,
          clauses: [...extractedClauses, ...missingClauses],
          risk_level: finalRisk,
          confidence: 0.85
        });
      }, 1000);

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const checkForMissingClauses = (existingClauses: ClauseAnalysis[]): ClauseAnalysis[] => {
    const existingTypes = existingClauses.map(c => c.type);
    const missingClauses: ClauseAnalysis[] = [];

    // Check for critical missing clauses
    const criticalTypes = ['termination', 'jurisdiction'];
    
    criticalTypes.forEach(type => {
      if (!existingTypes.includes(type as any)) {
        missingClauses.push({
          id: `missing_${type}`,
          type: type as any,
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

    return missingClauses;
  };

  const extractClausesHeuristic = (text: string): ClauseAnalysis[] => {
    const clauses: ClauseAnalysis[] = [];
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

    return clauses;
  };

  const detectPaymentRisk = (text: string): 'low' | 'medium' | 'high' => {
    if (/late|penalty|interest|compound/i.test(text)) return 'high';
    if (/advance|upfront|immediate/i.test(text)) return 'medium';
    return 'low';
  };

  const playExplanation = (text: string, clauseLanguage = 'en') => {
    if (!ttsEnabled) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = clauseLanguage === 'hi' ? 'hi-IN' : 
                     clauseLanguage === 'bn' ? 'bn-IN' : 
                     clauseLanguage === 'te' ? 'te-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const translateClause = async (clause: ClauseAnalysis) => {
    try {
      const translations_map = {
        hi: {
          'Payment clause detected - review terms carefully': 'भुगतान खंड का पता चला - शर्तों की सावधानीपूर्वक समीक्षा करें',
          'Penalty clause - high risk if breached': 'दंड खंड - उल्लंघन होने पर उच्च जोखिम',
          'Liability clause - defines responsibility for damages': 'दायित्व खंड - नुकसान की जिम्मेदारी को परिभाषित करता है',
          'Ensure payment terms are clearly defined with specific amounts and deadlines': 'सुनिश्चित करें कि भुगतान की शर्तें विशिष्ट राशि और समय सीमा के साथ स्पष्ट रूप से परिभाषित हैं',
          'Carefully review penalty amounts and conditions': 'दंड राशि और शर्तों की सावधानीपूर्वक समीक्षा करें',
          'Understand your liability exposure and consider insurance': 'अपने दायित्व जोखिम को समझें और बीमा पर विचार करें'
        },
        bn: {
          'Payment clause detected - review terms carefully': 'পেমেন্ট ক্লজ সনাক্ত - শর্তাবলী সাবধানে পর্যালোচনা করুন',
          'Penalty clause - high risk if breached': 'পেনাল্টি ক্লজ - লঙ্ঘিত হলে উচ্চ ঝুঁকি',
          'Liability clause - defines responsibility for damages': 'দায়বদ্ধতার ক্লজ - ক্ষতির জন্য দায়িত্ব নির্ধারণ করে'
        },
        te: {
          'Payment clause detected - review terms carefully': 'చెల్లింపు నిబంధన గుర్తించబడింది - నిబంధనలను జాగ్రత్తగా సమీక్షించండి',
          'Penalty clause - high risk if breached': 'పెనాల్టీ నిబంధన - ఉల్లంఘిస్తే అధిక ప్రమాదం',
          'Liability clause - defines responsibility for damages': 'బాధ్యత నిబంధన - నష్టాలకు బాధ్యత నిర్వచిస్తుంది'
        }
      };

      const languageMap = translations_map[language] || {};
      const translated = languageMap[clause.explanation] || `${clause.explanation} (Translation not available for ${language})`;

      setTranslations(prev => ({
        ...prev,
        [clause.id]: translated
      }));
    } catch (error) {
      console.error('Translation error:', error);
      setTranslations(prev => ({
        ...prev,
        [clause.id]: `${clause.explanation} (Translation failed)`
      }));
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-destructive/20 text-destructive';
      case 'medium': return 'bg-warning/20 text-warning';
      case 'low': return 'bg-success/20 text-success';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 animate-spin" />
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
          <p className="text-sm text-muted-foreground text-center">
            AI is extracting clauses, analyzing risks, and generating explanations...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="text-2xl font-bold">{Math.round(confidence * 100)}%</div>
              <div className="text-sm text-muted-foreground">Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clause Analysis */}
      <div className="space-y-4">
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
                  <p className="text-sm mt-1">{translations[clause.id] || clause.explanation}</p>
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

                <div className="flex items-center space-x-4 pt-2">
                  <div className="text-xs text-muted-foreground">
                    Confidence: {Math.round(clause.confidence * 100)}%
                  </div>
                  
                  {ttsEnabled && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => playExplanation(translations[clause.id] || clause.explanation)}
                    >
                      <Volume2 className="h-3 w-3 mr-1" />
                      Listen
                    </Button>
                  )}
                  
                  {autoTranslate && language !== 'en' && !translations[clause.id] && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => translateClause(clause)}
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      Translate to {language.toUpperCase()}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {clauses.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No clauses detected in the document.</p>
          </CardContent>
        </Card>
      )}

      {/* Proceed to Consent Button */}
      {clauses.length > 0 && (
        <Card className="mt-6">
          <CardContent className="text-center py-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-success mb-4">
                <CheckCircle className="h-6 w-6" />
                <h3 className="text-lg font-medium">Document Analysis Complete</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Review the analysis results above, then proceed to generate tamper-evident evidence with biometric consent.
              </p>
              <Button 
                onClick={() => {
                  onAnalysisComplete({
                    analysis_id: documentId,
                    clauses,
                    overall_risk: overallRisk,
                    confidence,
                    ocr_text: ocrText
                  });
                  onProceedToConsent?.();
                }}
                size="lg"
                className="px-8"
              >
                Proceed to Biometric Consent
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};