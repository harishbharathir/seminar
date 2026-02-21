import { useState } from "react";
import { useLocation } from "wouter";
import { useStore, UserRole } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, ShieldCheck, User, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        // Login via API
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, password }),
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentUser({
            id: data.user.id,
            name: data.user.name || data.user.username,
            email: data.user.email || "",
            department: data.user.department,
            role: data.user.role,
          });
          toast({ title: "Welcome back", description: `Logged in as ${data.user.role}` });
          setLocation(data.user.role === "admin" ? "/admin" : "/");
        } else {
          const error = await res.json();
          toast({ title: "Login Failed", description: error.message || "Invalid credentials", variant: "destructive" });
        }
      } else {
        // Signup via API
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, password, role }),
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentUser({
            id: data.user.id,
            name: data.user.name || data.user.username,
            email: data.user.email || "",
            department: data.user.department,
            role: data.user.role,
          });
          toast({ title: "Account Created", description: `Welcome to CampusBook` });
          setLocation(role === "admin" ? "/admin" : "/");
        } else {
          const error = await res.json();
          toast({ title: "Signup Failed", description: error.message || "Failed to create account", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-4xl font-display font-bold tracking-tight text-primary">CampusBook</h1>
            <p className="text-muted-foreground">The ultimate seminar hall management platform.</p>
          </div>

          <Card className="border-none shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <Tabs value={role} onValueChange={(v) => setRole(v as UserRole)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="faculty">Faculty</TabsTrigger>
                  <TabsTrigger value="admin">Administrator</TabsTrigger>
                </TabsList>
              </Tabs>
              <CardTitle>{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
              <CardDescription>
                {isLogin
                  ? `Sign in to your ${role} account`
                  : `Join as a ${role} to manage bookings`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="your_username"
                      className="pl-9"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Loading..." : (isLogin ? "Sign In" : "Sign Up")}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-primary hover:underline"
                    disabled={isLoading}
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/30 mix-blend-multiply z-10" />
        <img
          src="/src/assets/images/login-bg.jpg"
          alt="Modern University"
          className="h-full w-full object-cover scale-105 animate-pulse-slow"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white bg-linear-to-t from-black/80 via-black/20 to-transparent z-20">
          <div className="max-w-md space-y-4">
            <h2 className="text-3xl font-display font-bold">Streamlined Logistics for Modern Education</h2>
            <p className="text-lg opacity-90 font-light">
              Join hundreds of faculty members managing their seminar halls with ease and precision.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
