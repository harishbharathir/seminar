import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Settings, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { currentUser, logout } = useStore();
  const [location] = useLocation();

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Enhanced Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-200 h-16 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="font-display font-bold text-xl text-blue-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Hall Scheduler
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            <Button 
              variant={location === '/' ? 'default' : 'ghost'} 
              asChild 
              size="sm"
              className={location === '/' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50 hover:text-blue-700'}
            >
              <Link href="/">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            {currentUser.role === 'admin' && (
              <Button 
                variant={location === '/admin' ? 'default' : 'ghost'} 
                asChild 
                size="sm"
                className={location === '/admin' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50 hover:text-blue-700'}
              >
                <Link href="/admin">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Halls
                </Link>
              </Button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-right hidden sm:block">
            <div className="font-medium text-blue-900">{currentUser.name}</div>
            <div className="text-xs text-blue-600 capitalize">{currentUser.role}</div>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={logout} 
            title="Logout"
            className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-blue-900 to-indigo-700 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-blue-600/80 font-medium">{subtitle}</p>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
