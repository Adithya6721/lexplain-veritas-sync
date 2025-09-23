import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Shield, FileText, AlertTriangle, Plus, Eye, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
  const navigate = useNavigate();
  const stats = [
    { title: "Your Documents", value: "1", color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Completed", value: "0", color: "text-success", bgColor: "bg-success/10" },
    { title: "Evidence Records", value: "5", color: "text-info", bgColor: "bg-info/10" },
    { title: "High Risk Clauses", value: "1", color: "text-warning", bgColor: "bg-warning/10" },
  ];

  const recentDocuments = [
    {
      title: "Affidavit Of Identity",
      other: "Other • 25/9/2025",
      status: "processing",
    }
  ];

  const evidenceRecords = [
    {
      id: "evidence_1758556...",
      date: "22/9/2025 • 5:58:33 pm",
      status: "Valid",
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, adithya2410422!</h1>
        <p className="text-muted-foreground">
          AI-powered document analysis with biometric consent capture and tamper-evident evidence generation
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Process New Document</h3>
            <p className="text-muted-foreground mb-4">Upload and analyze a legal document</p>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => navigate('/process')}>
              Get Started <Upload className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-success-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">View Evidence Vault</h3>
            <p className="text-muted-foreground mb-4">Browse all evidence records</p>
            <Button variant="outline" onClick={() => navigate('/evidence')}>
              Get Started <Eye className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents and Evidence Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Your Recent Documents
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/process')}>
              <Plus className="h-4 w-4 mr-1" /> Add New
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">{doc.other}</p>
                  </div>
                  <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                    processing
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Your Evidence Records
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/evidence')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evidenceRecords.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{record.id}</p>
                    <p className="text-sm text-muted-foreground">{record.date}</p>
                  </div>
                  <Badge className="bg-success/20 text-success">
                    <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                    Valid
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Complete Document Processing Workflow
          </h3>
          <p className="text-muted-foreground mb-8">
            Experience the full power of AI-powered legal document verification with HexaVision
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button onClick={() => navigate('/process')} className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Process New Document</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/evidence')}>
              <Eye className="h-4 w-4 mr-2" />
              View Evidence Vault
            </Button>
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};