import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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

const INDIAN_LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' }
];

export const DocumentAnalysis = ({ documentId, ocrText, onAnalysisComplete }: DocumentAnalysisProps) => {
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing...');
  const [clauses, setClauses] = useState<ClauseAnalysis[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [overallRisk, setOverallRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    if (ocrText) {
      performAnalysis();
    }
  }, [ocrText]);

  const performAnalysis = async () => {
    try {
      // Step 1: Extract clauses using Hugging Face model
      setCurrentStep('Extracting legal clauses...');
      setAnalysisProgress(20);

      const extractedClauses = await extractClauses(ocrText);
      
      // Step 2: Analyze risk levels
      setCurrentStep('Analyzing risk levels...');
      setAnalysisProgress(40);

      const analyzedClauses = await analyzeRiskLevels(extractedClauses);
      setClauses(analyzedClauses);

      // Step 3: Check for missing critical clauses
      setCurrentStep('Checking for missing clauses...');
      setAnalysisProgress(60);

      const missingClauses = await checkMissingClauses(analyzedClauses);
      
      // Step 4: Generate translations
      setCurrentStep('Generating multilingual explanations...');
      setAnalysisProgress(80);

      const translatedAnalysis = await generateTranslations(analyzedClauses);
      setTranslations(translatedAnalysis);

      // Step 5: Calculate overall risk
      setCurrentStep('Finalizing analysis...');
      setAnalysisProgress(100);

      const finalAnalysis = {
        clauses: [...analyzedClauses, ...missingClauses],
        overall_risk: calculateOverallRisk([...analyzedClauses, ...missingClauses]),
        confidence: calculateConfidence(analyzedClauses),
        translations: translatedAnalysis,
        document_id: documentId,
        ocr_text: ocrText,
        analysis_timestamp: new Date().toISOString()
      };

      setOverallRisk(finalAnalysis.overall_risk);
      setConfidence(finalAnalysis.confidence);
      setClauses(finalAnalysis.clauses);
      
      setTimeout(() => {
        setIsAnalyzing(false);
        onAnalysisComplete(finalAnalysis);
      }, 1000);

    } catch (error) {
      console.error('Analysis failed:', error);
      // Fallback to heuristic analysis
      const fallbackAnalysis = await performHeuristicAnalysis(ocrText);
      setClauses(fallbackAnalysis.clauses);
      setOverallRisk(fallbackAnalysis.overall_risk);
      setConfidence(fallbackAnalysis.confidence);
      setIsAnalyzing(false);
      onAnalysisComplete(fallbackAnalysis);
    }
  };

  const extractClauses = async (text: string): Promise<ClauseAnalysis[]> => {
    try {
      // Try Hugging Face model first
      const response = await fetch('https://api-inference.huggingface.co/models/alea-institute/kl3m-doc-pico-contracts-001', {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ inputs: text })
      });

      if (response.ok) {
        const result = await response.json();
        return processHuggingFaceResult(result, text);
      }
      throw new Error('HuggingFace API failed');
    } catch (error) {
      // Fallback to heuristic extraction
      return extractClausesHeuristic(text);
    }
  };

  const extractClausesHeuristic = (text: string): ClauseAnalysis[] => {
    const clauses: ClauseAnalysis[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Payment terms detection
    const paymentTerms = sentences.filter(s => 
      /payment|pay|amount|rupees|₹|dollars?|\$|fee|cost|price/i.test(s)
    );
    
    paymentTerms.forEach((term, i) => {
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
    
    penaltyClauses.forEach((clause, i) => {
      clauses.push({
        id: `penalty_${i}`,
        type: 'penalty',
        text: clause.trim(),
        risk_level: /heavy|severe|substantial|significant/i.test(clause) ? 'high' : 'medium',
        confidence: 0.90,
        explanation: 'Penalty clause - understand consequences of non-compliance',
        legal_reference: 'Indian Contract Act, 1872 - Section 74',
        recommendation: 'Verify penalty amounts are reasonable and not excessive'
      });
    });

    // Liability terms
    const liabilityTerms = sentences.filter(s => 
      /liable|liability|responsible|responsibility|indemnify|indemnification/i.test(s)
    );
    
    liabilityTerms.forEach((term, i) => {
      clauses.push({
        id: `liability_${i}`,
        type: 'liability',
        text: term.trim(),
        risk_level: /unlimited|full|complete|entire/i.test(term) ? 'high' : 'medium',
        confidence: 0.88,
        explanation: 'Liability clause - defines your financial and legal obligations',
        legal_reference: 'Indian Contract Act, 1872 - Section 73',
        recommendation: 'Consider limiting liability where possible'
      });
    });

    // Termination clauses
    const terminationClauses = sentences.filter(s => 
      /terminat|cancel|end|expire|dissolution|breach/i.test(s)
    );
    
    terminationClauses.forEach((clause, i) => {
      clauses.push({
        id: `termination_${i}`,
        type: 'termination',
        text: clause.trim(),
        risk_level: 'medium',
        confidence: 0.82,
        explanation: 'Termination conditions - how and when the contract can end',
        legal_reference: 'Indian Contract Act, 1872 - Section 56',
        recommendation: 'Ensure termination conditions are mutual and fair'
      });
    });

    return clauses;
  };

  const detectPaymentRisk = (text: string): 'low' | 'medium' | 'high' => {
    if (/advance|upfront|full payment|lump sum/i.test(text)) return 'high';
    if (/installment|monthly|quarterly|partial/i.test(text)) return 'low';
    return 'medium';
  };

  const analyzeRiskLevels = async (clauses: ClauseAnalysis[]): Promise<ClauseAnalysis[]> => {
    return clauses.map(clause => ({
      ...clause,
      risk_level: clause.risk_level || assessRiskLevel(clause)
    }));
  };

  const assessRiskLevel = (clause: ClauseAnalysis): 'low' | 'medium' | 'high' => {
    const highRiskKeywords = ['unlimited', 'penalty', 'forfeit', 'breach', 'default', 'immediate', 'substantial'];
    const mediumRiskKeywords = ['liable', 'responsible', 'payment', 'termination'];
    
    const text = clause.text.toLowerCase();
    
    if (highRiskKeywords.some(keyword => text.includes(keyword))) return 'high';
    if (mediumRiskKeywords.some(keyword => text.includes(keyword))) return 'medium';
    return 'low';
  };

  const checkMissingClauses = async (clauses: ClauseAnalysis[]): Promise<ClauseAnalysis[]> => {
    const missingClauses: ClauseAnalysis[] = [];
    const clauseTypes = clauses.map(c => c.type);

    const essentialClauses = [
      { type: 'jurisdiction', text: 'Jurisdiction clause not found' },
      { type: 'termination', text: 'Termination conditions not specified' },
      { type: 'liability', text: 'Liability limitations not defined' }
    ];

    essentialClauses.forEach((essential, i) => {
      if (!clauseTypes.includes(essential.type as any)) {
        missingClauses.push({
          id: `missing_${i}`,
          type: essential.type as any,
          text: essential.text,
          risk_level: 'high',
          confidence: 0.95,
          explanation: 'Critical clause missing - high risk for legal disputes',
          recommendation: 'Include this clause to protect your interests',
          missing: true
        });
      }
    });

    return missingClauses;
  };

  const generateTranslations = async (clauses: ClauseAnalysis[]): Promise<Record<string, string>> => {
    const translations: Record<string, string> = {};
    
    // Simulate translation for key explanations
    clauses.forEach(clause => {
      if (clause.explanation) {
        INDIAN_LANGUAGES.forEach(lang => {
          const key = `${clause.id}_${lang.code}`;
          // In real implementation, use translation API
          translations[key] = `[${lang.native}] ${clause.explanation}`;
        });
      }
    });

    return translations;
  };

  const calculateOverallRisk = (clauses: ClauseAnalysis[]): 'low' | 'medium' | 'high' => {
    const riskScores = clauses.map(c => {
      switch (c.risk_level) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
      }
    });

    const avgRisk = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
    
    if (avgRisk >= 2.5) return 'high';
    if (avgRisk >= 1.5) return 'medium';
    return 'low';
  };

  const calculateConfidence = (clauses: ClauseAnalysis[]): number => {
    if (clauses.length === 0) return 0;
    
    const totalConfidence = clauses.reduce((sum, clause) => sum + clause.confidence, 0);
    return Math.round(totalConfidence / clauses.length * 100);
  };

  const processHuggingFaceResult = (result: any, originalText: string): ClauseAnalysis[] => {
    // Process HuggingFace model output and convert to ClauseAnalysis format
    // This is a placeholder - implement based on actual model output
    return extractClausesHeuristic(originalText);
  };

  const performHeuristicAnalysis = async (text: string) => {
    const clauses = extractClausesHeuristic(text);
    return {
      clauses,
      overall_risk: calculateOverallRisk(clauses),
      confidence: calculateConfidence(clauses),
      document_id: documentId,
      ocr_text: text,
      analysis_timestamp: new Date().toISOString()
    };
  };

  const playExplanation = (text: string, language = 'en') => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 
                     language === 'bn' ? 'bn-IN' : 
                     language === 'te' ? 'te-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Document Analysis Complete
            </div>
            <Badge className={getRiskBadgeColor(overallRisk)}>
              {overallRisk.toUpperCase()} RISK
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{clauses.length}</div>
              <p className="text-sm text-muted-foreground">Clauses Found</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{confidence}%</div>
              <p className="text-sm text-muted-foreground">Confidence</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {clauses.filter(c => c.missing).length}
              </div>
              <p className="text-sm text-muted-foreground">Missing Critical</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clause Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Extracted Clauses & Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clauses.map((clause) => {
              const ClauseIcon = CLAUSE_TYPES[clause.type]?.icon || FileText;
              return (
                <div key={clause.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <ClauseIcon className={`h-5 w-5 mt-1 ${CLAUSE_TYPES[clause.type]?.color || 'text-gray-500'}`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{CLAUSE_TYPES[clause.type]?.label || 'Other Clause'}</h4>
                          {clause.missing && (
                            <Badge variant="destructive" className="text-xs">
                              MISSING
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{clause.text}</p>
                        <p className="text-sm">{clause.explanation}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className={getRiskBadgeColor(clause.risk_level)}>
                        {clause.risk_level.toUpperCase()}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(clause.confidence * 100)}% confidence
                      </div>
                    </div>
                  </div>

                  {clause.legal_reference && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <strong>Legal Reference:</strong> {clause.legal_reference}
                    </div>
                  )}

                  {clause.recommendation && (
                    <div className="text-xs bg-blue-50 text-blue-800 p-2 rounded">
                      <strong>Recommendation:</strong> {clause.recommendation}
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => playExplanation(clause.explanation)}
                      >
                        <Volume2 className="h-4 w-4 mr-1" />
                        Listen
                      </Button>
                      <select className="px-2 py-1 text-xs border rounded">
                        <option value="en">English</option>
                        {INDIAN_LANGUAGES.map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.native}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};