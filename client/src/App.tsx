import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/contexts/theme-provider";
import OpianBank from "@/pages/opian-bank";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import PaymentTest from "@/pages/payment-test";
import SubscriptionTest from "@/pages/subscription-test";
import SubscriptionSetup from "@/pages/subscription-setup";
import NotFound from "@/pages/not-found";

function ProtectedAscendancy() {
  const hasAccess = sessionStorage.getItem("opian_bank_access") === "granted";
  
  if (!hasAccess) {
    return <Redirect to="/" />;
  }
  
  return <Landing />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={OpianBank} />
      <Route path="/ascendancy" component={ProtectedAscendancy} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/payment-test" component={PaymentTest} />
      <Route path="/subscription-test" component={SubscriptionTest} />
      <Route path="/subscription-setup" component={SubscriptionSetup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
