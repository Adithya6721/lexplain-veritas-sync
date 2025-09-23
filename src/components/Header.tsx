import { Button } from "@/components/ui/button";
import { Shield, User, Menu, LogOut, Settings, Moon, Sun } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const navigation = [
    { path: "/dashboard", name: "Dashboard" },
    { path: "/process", name: "Process Document" },
    { path: "/evidence", name: "Evidence Vault" },
    { path: "/settings", name: "Settings" }
  ];

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border/40">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4">
        <div className="mr-4 flex">
          <button onClick={() => navigate('/dashboard')} className="mr-6 flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              HexaVision
            </span>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navigation.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`transition-colors hover:text-foreground/80 ${
                location.pathname === item.path 
                  ? 'text-foreground' 
                  : 'text-foreground/60'
              }`}
            >
              {item.name}
            </button>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 md:hidden">
              {navigation.map((item) => (
                <DropdownMenuItem 
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={location.pathname === item.path ? 'bg-accent' : ''}
                >
                  {item.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};