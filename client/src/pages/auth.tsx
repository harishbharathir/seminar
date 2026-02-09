import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const login = useStore((state) => state.login);
  const { toast } = useToast();
  
  const [facultyEmail, setFacultyEmail] = useState("faculty@campus.edu");
  const [adminEmail, setAdminEmail] = useState("admin@campus.edu");

  const handleLogin = (role: 'faculty' | 'admin') => {
    const email = role === 'faculty' ? facultyEmail : adminEmail;
    if (!email) {
      toast({ title: "Error", description: "Please enter an email address", variant: "destructive" });
      return;
    }
    
    login(email, role);
    toast({ title: "Welcome back", description: `Logged in as ${role}` });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-display font-bold tracking-tight text-primary">CampusBook</h1>
            <p className="text-muted-foreground">Secure seminar hall booking system for academia.</p>
          </div>

          <Tabs defaultValue="faculty" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="faculty">Faculty</TabsTrigger>
              <TabsTrigger value="admin">Administrator</TabsTrigger>
            </TabsList>
            
            <TabsContent value="faculty">
              <Card className="border-none shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Faculty Access</CardTitle>
                  <CardDescription>Book seminar halls for lectures and events.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="f-email">Email Address</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="f-email" 
                        placeholder="dr.smith@campus.edu" 
                        className="pl-9"
                        value={facultyEmail}
                        onChange={(e) => setFacultyEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button className="w-full" size="lg" onClick={() => handleLogin('faculty')}>
                    Enter Dashboard
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="admin">
              <Card className="border-none shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Admin Portal</CardTitle>
                  <CardDescription>Manage halls, bookings, and system settings.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="a-email">Admin Email</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="a-email" 
                        placeholder="admin@campus.edu" 
                        className="pl-9"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button className="w-full" size="lg" onClick={() => handleLogin('admin')}>
                    Access Admin Panel
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:block relative bg-muted">
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
        <img 
          src="/src/assets/images/login-bg.jpg" 
          alt="Modern University Campus" 
          className="h-full w-full object-cover grayscale-50"
        />
        <div className="absolute bottom-0 left-0 p-12 text-white bg-gradient-to-t from-black/80 to-transparent w-full">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed">
              "Efficiency in logistics allows us to focus on what matters most: education and innovation."
            </p>
            <footer className="text-sm opacity-80">— Campus Administration</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
