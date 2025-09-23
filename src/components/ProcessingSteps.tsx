import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProcessingStepsProps {
  currentStep: number;
  steps: Array<{
    title: string;
    description: string;
    status: 'completed' | 'processing' | 'pending' | 'error';
  }>;
}

export const ProcessingSteps = ({ currentStep, steps }: ProcessingStepsProps) => {
  const getStepIcon = (status: string, index: number) => {
    if (status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-success" />;
    } else if (status === 'processing') {
      return <Clock className="h-5 w-5 text-primary animate-spin" />;
    } else if (status === 'error') {
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    } else {
      return (
        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">{index + 1}</span>
        </div>
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success">Complete</Badge>;
      case 'processing':
        return <Badge className="bg-primary/20 text-primary">Processing</Badge>;
      case 'error':
        return <Badge className="bg-destructive/20 text-destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`flex items-start space-x-4 p-4 rounded-lg border transition-all ${
            step.status === 'processing'
              ? 'border-primary bg-primary/5'
              : step.status === 'completed'
              ? 'border-success bg-success/5'
              : step.status === 'error'
              ? 'border-destructive bg-destructive/5'
              : 'border-border'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getStepIcon(step.status, index)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{step.title}</h4>
              {getStatusBadge(step.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};