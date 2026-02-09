import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "@/pages/auth";
import FacultyDashboard from "@/pages/faculty-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import { useStore } from "@/lib/store";

function Router() {
  const currentUser = useStore(state => state.currentUser);

  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <Switch>
      <Route path="/" component={currentUser.role === 'admin' ? AdminDashboard : FacultyDashboard} />
      <Route path="/admin" component={currentUser.role === 'admin' ? AdminDashboard : NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
