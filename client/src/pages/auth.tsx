import { useState } from "react";
import { useStore, UserRole } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, ShieldCheck, User, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const login = useStore((state) => state.login);
  const signup = useStore((state) => state.signup);
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>("faculty");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || ( !isLogin && !name)) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    
    if (isLogin) {
      const success = login(email, role);
      if (success) {
        toast({ title: "Welcome back", description: `Logged in as ${role}` });
      } else {
        toast({ title: "Login Failed", description: "Invalid credentials or role", variant: "destructive" });
      }
    } else {
      const success = signup({ name, email, role });
      if (success) {
        toast({ title: "Account Created", description: `Welcome to CampusBook, ${name}` });
      } else {
        toast({ title: "Signup Failed", description: "User already exists with this email and role", variant: "destructive" });
      }
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
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="name" 
                        placeholder="Dr. John Doe" 
                        className="pl-9"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="email@campus.edu" 
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  {isLogin ? "Sign In" : "Sign Up"}
                </Button>
                
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-primary hover:underline"
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
