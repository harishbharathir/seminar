import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Settings } from "lucide-react";
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
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Navbar */}
      <header className="bg-background border-b h-16 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <div className="font-display font-bold text-xl text-primary flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
              CB
            </div>
            CampusBook
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            <Button variant={location === '/' ? 'secondary' : 'ghost'} asChild size="sm">
              <Link href="/">Dashboard</Link>
            </Button>
            {currentUser.role === 'admin' && (
              <Button variant={location === '/admin' ? 'secondary' : 'ghost'} asChild size="sm">
                <Link href="/admin">Manage Halls</Link>
              </Button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-right hidden sm:block">
            <div className="font-medium">{currentUser.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{currentUser.role}</div>
          </div>
          <Button variant="outline" size="icon" onClick={logout} title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl font-display font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
