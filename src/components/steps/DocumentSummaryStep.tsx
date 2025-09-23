import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  FileText, 
  Volume2, 
  Globe, 
  CheckCircle,
  AlertTriangle,
  Shield,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';

interface DocumentSummaryStepProps {
  onComplete: (data: any) => void;
  onBack: () => void;
  workflowData: any;
}

const HINDI_TRANSLATIONS = {
  'Payment clause detected - review terms carefully': 'भुगतान खंड का पता चला - शर्तों की सावधानीपूर्वक समीक्षा करें',
  'Penalty clause - high risk if breached': 'दंड खंड - उल्लंघन होने पर उच्च जोखिम',
  'Property transfer clause - significant ownership implications': 'संपत्ति हस्तांतरण खंड - महत्वपूर्ण स्वामित्व निहितार्थ',
  'Liability clause - defines responsibility for damages': 'दायित्व खंड - नुकसान की जिम्मेदारी को परिभाषित करता है',
  'This document lacks a termination clause, which could lead to legal complications.': 'इस दस्तावेज़ में समाप्ति खंड का अभाव है, जिससे कानूनी जटिलताएं हो सकती हैं।',
  'This document lacks a jurisdiction clause, which could lead to legal complications.': 'इस दस्तावेज़ में न्यायाधिकार खंड का अभाव है, जिससे कानूनी जटिलताएं हो सकती हैं।',
  'Ensure payment terms are clearly defined with specific amounts and deadlines': 'सुनिश्चित करें कि भुगतान की शर्तें विशिष्ट राशि और समय सीमा के साथ स्पष्ट रूप से परिभाषित हैं',
  'Carefully review penalty amounts and conditions': 'दंड राशि और शर्तों की सावधानीपूर्वक समीक्षा करें',
  'Understand property transfer conditions and implications': 'संपत्ति हस्तांतरण की शर्तों और निहितार्थों को समझें',
  'Understand your liability exposure and consider insurance': 'अपने दायित्व जोखिम को समझें और बीमा पर विचार करें',
  'Add a clear termination clause to protect your interests.': 'अपने हितों की रक्षा के लिए एक स्पष्ट समाप्ति खंड जोड़ें।',
  'Add a clear jurisdiction clause to protect your interests.': 'अपने हितों की रक्षा के लिए एक स्पष्ट न्यायाधिकार खंड जोड़ें।'
};

export const DocumentSummaryStep: React.FC<DocumentSummaryStepProps> = ({ 
  onComplete, 
  onBack, 
  workflowData 
}) => {
  const { toast } = useToast();
  const { language, ttsEnabled } = useLanguage();
  const [documentSummary, setDocumentSummary] = useState('');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    generateDocumentSummary();
    if (language === 'hi') {
      generateTranslations();
    }
  }, [workflowData, language]);

  const generateDocumentSummary = () => {
    const { analysisResult } = workflowData;
    if (!analysisResult) return;

    const { clauses, overallRisk, authFlags } = analysisResult;
    
    const summary = `
DOCUMENT ANALYSIS SUMMARY

Document Type: Legal Agreement
Overall Risk Level: ${overallRisk.toUpperCase()}
Total Clauses Identified: ${clauses.length}

KEY FINDINGS:
• ${clauses.filter(c => c.risk_level === 'high').length} High-risk clauses detected
• ${clauses.filter(c => c.risk_level === 'medium').length} Medium-risk clauses identified
• ${clauses.filter(c => c.missing).length} Critical clauses missing

AUTHENTICATION STATUS:
• QR Code Present: ${authFlags.qr_present ? 'Yes' : 'No'}
• Barcode Present: ${authFlags.barcode_present ? 'Yes' : 'No'}
• Format Issues: ${authFlags.format_suspicious ? 'Yes' : 'No'}

RECOMMENDATIONS:
${clauses.filter(c => c.risk_level === 'high').length > 0 ? '• Immediate legal review recommended due to high-risk clauses' : ''}
${clauses.filter(c => c.missing).length > 0 ? '• Add missing critical clauses before signing' : ''}
• Ensure all terms are clearly understood before proceeding
• Consider professional legal consultation for complex clauses
    `.trim();

    setDocumentSummary(summary);
  };

  const generateTranslations = () => {
    const { analysisResult } = workflowData;
    if (!analysisResult) return;

    const translationsMap: Record<string, string> = {};
    
    analysisResult.clauses.forEach((clause: any) => {
      if (HINDI_TRANSLATIONS[clause.explanation]) {
        translationsMap[`explanation_${clause.id}`] = HINDI_TRANSLATIONS[clause.explanation];
      }
      if (clause.recommendation && HINDI_TRANSLATIONS[clause.recommendation]) {
        translationsMap[`recommendation_${clause.id}`] = HINDI_TRANSLATIONS[clause.recommendation];
      }
    });

    setTranslations(translationsMap);
  };

  const playAudio = (text: string, clauseId: string, isHindi = false) => {
    if (!ttsEnabled) {
      toast({
        title: "TTS Disabled",
        description: "Text-to-speech is disabled in settings",
        variant: "destructive"
      });
      return;
    }

    if (isPlayingAudio === clauseId) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isHindi ? 'hi-IN' : 'en-US';
    utterance.rate = 0.9;
    
    utterance.onstart = () => setIsPlayingAudio(clauseId);
    utterance.onend = () => setIsPlayingAudio(null);
    utterance.onerror = () => {
      setIsPlayingAudio(null);
      toast({
        title: "TTS Error",
        description: "Failed to play audio",
        variant: "destructive"
      });
    };
    
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

  const handleContinue = () => {
    onComplete({
      documentSummary,
      translations
    });
  };

  const { analysisResult } = workflowData;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Step 4: Document Summary & Multilingual Explanations</h1>
        <p className="text-muted-foreground">
          Comprehensive document summary with Hindi translations and audio explanations
        </p>
      </div>

      {/* Document Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Document Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap font-mono">{documentSummary}</pre>
          </div>
          {ttsEnabled && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => playAudio(documentSummary, 'summary')}
                className="flex items-center space-x-2"
              >
                <Volume2 className="h-4 w-4" />
                <span>{isPlayingAudio === 'summary' ? 'Stop Audio' : 'Listen to Summary'}</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Clause Explanations */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Detailed Clause Explanations
          {language === 'hi' && (
            <Badge variant="outline" className="ml-2">
              Hindi Translations Available
            </Badge>
          )}
        </h3>
        
        {analysisResult?.clauses.map((clause: any) => (
          <Card key={clause.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {clause.type.charAt(0).toUpperCase() + clause.type.slice(1)} Clause
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
            <CardContent className="space-y-4">
              {/* English Explanation */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-sm flex items-center">
                    English Explanation
                  </strong>
                  {ttsEnabled && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => playAudio(clause.explanation, `en_${clause.id}`)}
                    >
                      <Volume2 className="h-3 w-3 mr-1" />
                      {isPlayingAudio === `en_${clause.id}` ? 'Stop' : 'Listen'}
                    </Button>
                  )}
                </div>
                <p className="text-sm bg-blue-50 p-3 rounded">{clause.explanation}</p>
              </div>

              {/* Hindi Translation */}
              {language === 'hi' && translations[`explanation_${clause.id}`] && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-sm flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      Hindi Translation (हिंदी अनुवाद)
                    </strong>
                    {ttsEnabled && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => playAudio(translations[`explanation_${clause.id}`], `hi_${clause.id}`, true)}
                      >
                        <Volume2 className="h-3 w-3 mr-1" />
                        {isPlayingAudio === `hi_${clause.id}` ? 'रोकें' : 'सुनें'}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm bg-orange-50 p-3 rounded" dir="ltr">
                    {translations[`explanation_${clause.id}`]}
                  </p>
                </div>
              )}

              <Separator />

              {/* Recommendation */}
              {clause.recommendation && (
                <div>
                  <strong className="text-sm">Recommendation:</strong>
                  <p className="text-sm mt-1 text-blue-600">{clause.recommendation}</p>
                  {language === 'hi' && translations[`recommendation_${clause.id}`] && (
                    <p className="text-sm mt-2 text-orange-600" dir="ltr">
                      <strong>सिफारिश:</strong> {translations[`recommendation_${clause.id}`]}
                    </p>
                  )}
                </div>
              )}

              {/* Legal Reference */}
              {clause.legal_reference && (
                <div>
                  <strong className="text-sm">Legal Reference:</strong>
                  <p className="text-sm mt-1 text-muted-foreground">{clause.legal_reference}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Analysis
        </Button>
        
        <Button onClick={handleContinue}>
          Continue to Consent & Evidence
        </Button>
      </div>
    </div>
  );
};