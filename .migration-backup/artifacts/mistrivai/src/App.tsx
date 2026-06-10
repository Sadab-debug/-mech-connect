import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Mechanics from "@/pages/Mechanics";
import BookMechanic from "@/pages/BookMechanic";
import MyBookings from "@/pages/MyBookings";
import MechanicDashboard from "@/pages/MechanicDashboard";
import MechanicRegistration from "@/pages/MechanicRegistration";
import MechanicStatus from "@/pages/MechanicStatus";
import AdminDashboard from "@/pages/AdminDashboard";
import Chat from "@/pages/Chat";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Layout><Home /></Layout>} />
      <Route path="/login" component={() => <Layout><Login /></Layout>} />
      <Route path="/signup" component={() => <Layout><Signup /></Layout>} />
      <Route path="/mechanics" component={() => <Layout><Mechanics /></Layout>} />
      <Route path="/book/:id" component={() => <Layout><BookMechanic /></Layout>} />
      <Route path="/bookings" component={() => <Layout><MyBookings /></Layout>} />
      <Route path="/mechanic-dashboard" component={() => <Layout><MechanicDashboard /></Layout>} />
      <Route path="/mechanic-registration" component={() => <Layout><MechanicRegistration /></Layout>} />
      <Route path="/mechanic-status" component={() => <Layout><MechanicStatus /></Layout>} />
      <Route path="/admin" component={() => <Layout><AdminDashboard /></Layout>} />
      <Route path="/admin/users" component={() => <Layout><AdminDashboard /></Layout>} />
      <Route path="/admin/bookings" component={() => <Layout><AdminDashboard /></Layout>} />
      <Route path="/chat" component={() => <Layout><Chat /></Layout>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
