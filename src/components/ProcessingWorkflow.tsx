import React, { useState, useEffect } from 'react';
import { StepProgress } from './StepProgress';
import { DocumentUploadStep } from './steps/DocumentUploadStep';
import { OCRProcessingStep } from './steps/OCRProcessingStep';
import { ComprehensiveAnalysisStep } from './steps/ComprehensiveAnalysisStep';
import { DocumentSummaryStep } from './steps/DocumentSummaryStep';
import { ConsentEvidenceStep } from './steps/ConsentEvidenceStep';
import { DashboardStep } from './steps/DashboardStep';
import { useAuth } from './auth/AuthContext';

const WORKFLOW_STEPS = [
  { id: 1, title: 'Upload', description: 'Upload document', status: 'upcoming' as const },
  { id: 2, title: 'OCR', description: 'Text extraction', status: 'upcoming' as const },
  { id: 3, title: 'Analysis', description: 'Comprehensive analysis', status: 'upcoming' as const },
  { id: 4, title: 'Summary', description: 'Multilingual explanations', status: 'upcoming' as const },
  { id: 5, title: 'Consent', description: 'Evidence management', status: 'upcoming' as const },
  { id: 6, title: 'Dashboard', description: 'Results overview', status: 'upcoming' as const }
];

export const ProcessingWorkflow: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowData, setWorkflowData] = useState<any>({
    document: null,
    ocrText: '',
    analysisResult: null,
    consentData: null,
    evidenceRecord: null
  });

  const steps = WORKFLOW_STEPS.map(step => ({
    ...step,
    status: step.id < currentStep ? 'completed' as const :
            step.id === currentStep ? 'current' as const : 'upcoming' as const
  }));

  const handleStepComplete = (stepNumber: number, data: any) => {
    setWorkflowData(prev => ({ ...prev, ...data }));
    if (stepNumber < 6) {
      setCurrentStep(stepNumber + 1);
    }
  };

  const handleStepBack = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <DocumentUploadStep
            onComplete={(data) => handleStepComplete(1, data)}
            workflowData={workflowData}
          />
        );
      case 2:
        return (
          <OCRProcessingStep
            onComplete={(data) => handleStepComplete(2, data)}
            onBack={() => handleStepBack(1)}
            workflowData={workflowData}
          />
        );
      case 3:
        return (
          <ComprehensiveAnalysisStep
            onComplete={(data) => handleStepComplete(3, data)}
            onBack={() => handleStepBack(2)}
            workflowData={workflowData}
          />
        );
      case 4:
        return (
          <DocumentSummaryStep
            onComplete={(data) => handleStepComplete(4, data)}
            onBack={() => handleStepBack(3)}
            workflowData={workflowData}
          />
        );
      case 5:
        return (
          <ConsentEvidenceStep
            onComplete={(data) => handleStepComplete(5, data)}
            onBack={() => handleStepBack(4)}
            workflowData={workflowData}
          />
        );
      case 6:
        return (
          <DashboardStep
            onRestart={() => {
              setCurrentStep(1);
              setWorkflowData({
                document: null,
                ocrText: '',
                analysisResult: null,
                consentData: null,
                evidenceRecord: null
              });
            }}
            workflowData={workflowData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StepProgress currentStep={currentStep} steps={steps} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {renderCurrentStep()}
      </div>
    </div>
  );
};