import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ProcessingWorkflow } from "@/components/ProcessingWorkflow";
import { EvidenceVault } from "@/components/EvidenceVault";
import { AuthProvider, useAuth } from "@/components/auth/AuthContext";
import { AuthForm } from "@/components/auth/AuthForm";
import { Settings } from "./pages/Settings";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthForm />} />
              <Route path="/welcome" element={<Index />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <Routes>
                    <Route path="/" element={<Navigate to="/process" replace />} />
                    <Route path="/process" element={<ProcessingWorkflow />} />
                    <Route path="/evidence" element={<EvidenceVault />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;