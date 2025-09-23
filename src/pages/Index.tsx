import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileText, Scan, Fingerprint, Globe, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Scan,
      title: "AI-Powered OCR",
      description: "Advanced text extraction from scanned documents with 99% accuracy"
    },
    {
      icon: FileText,
      title: "Clause Analysis",
      description: "Intelligent identification and explanation of legal clauses in plain language"
    },
    {
      icon: Globe,
      title: "Multi-language Support",
      description: "English ↔ Hindi translation with native text-to-speech capabilities"
    },
    {
      icon: Fingerprint,
      title: "Biometric Consent",
      description: "Secure biometric consent capture with voice and fingerprint verification"
    },
    {
      icon: Shield,
      title: "Tamper-Evident Records",
      description: "Blockchain-secured evidence generation with cryptographic verification"
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Fast document processing with live progress tracking and updates"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <Shield className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            HexaVision
          </h1>
          <h2 className="text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Portable Legal Document Verification & Understanding Device
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-4xl mx-auto">
            Transform legal document processing with AI-powered verification, multilingual support, 
            and tamper-evident evidence generation for secure, trustworthy document analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="px-8 py-3 text-lg"
              onClick={() => navigate('/dashboard')}
            >
              Get Started
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-3 text-lg"
              onClick={() => navigate('/process')}
            >
              Process Document
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-border hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Process Flow */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Complete Document Processing Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {[
              { title: "Upload", desc: "Drag & drop documents" },
              { title: "OCR", desc: "Text extraction" },
              { title: "Analysis", desc: "Clause identification" },
              { title: "Verify", desc: "Authenticity check" },
              { title: "Consent", desc: "Biometric capture" },
              { title: "Secure", desc: "Evidence generation" }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-3 font-bold">
                    {index + 1}
                  </div>
                  <h4 className="font-semibold mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground text-center">{step.desc}</p>
                </div>
                {index < 5 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-border transform -translate-y-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-primary/5 border-primary/20 max-w-2xl mx-auto">
            <CardContent className="p-12">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Ready to Secure Your Legal Documents?
              </h3>
              <p className="text-muted-foreground mb-8">
                Experience the future of legal document verification with HexaVision
              </p>
              <Button 
                size="lg" 
                className="px-8 py-3"
                onClick={() => navigate('/dashboard')}
              >
                Start Processing Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
