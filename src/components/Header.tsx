import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Shield, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">HexaVision</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Document Verification</p>
            </div>
          </div>
        </div>
        
        <nav className="flex items-center space-x-6">
          <Button 
            variant="ghost" 
            className={`text-muted-foreground hover:text-foreground ${isActive('/dashboard') ? 'text-primary' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className={`text-muted-foreground hover:text-foreground ${isActive('/process') ? 'text-primary' : ''}`}
            onClick={() => navigate('/process')}
          >
            Process Document
          </Button>
          <Button 
            variant="ghost" 
            className={`text-muted-foreground hover:text-foreground ${isActive('/evidence') ? 'text-primary' : ''}`}
            onClick={() => navigate('/evidence')}
          >
            Evidence Vault
          </Button>
        </nav>

        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-medium">adithya2410422</p>
            <p className="text-muted-foreground">adithya2410422@srm.edu.in</p>
          </div>
          <Button variant="outline" size="sm">Sign Out</Button>
        </div>
      </div>
    </header>
  );
};