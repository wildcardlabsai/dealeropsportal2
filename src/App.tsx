import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PublicLayout } from "@/components/public/PublicLayout";
import { AppLayout } from "@/components/app/AppLayout";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import SecurityPage from "./pages/SecurityPage";
import SupportPage from "./pages/SupportPage";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Dashboard from "./pages/app/Dashboard";
import PlaceholderPage from "./pages/app/PlaceholderPage";
import CustomerList from "./pages/app/customers/CustomerList";
import CustomerCreate from "./pages/app/customers/CustomerCreate";
import CustomerProfile from "./pages/app/customers/CustomerProfile";
import VehicleList from "./pages/app/vehicles/VehicleList";
import VehicleCreate from "./pages/app/vehicles/VehicleCreate";
import VehicleProfile from "./pages/app/vehicles/VehicleProfile";
import VehicleChecks from "./pages/app/checks/VehicleChecks";
import NotFound from "./pages/NotFound";
import {
  Target, FileText, Shield, Wrench, CarFront,
  ClipboardCheck, Star, FolderOpen, BarChart3, MessageSquare,
  CreditCard, ScrollText, Settings
} from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public site */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            <Route path="/login" element={<PublicLayout />}>
              <Route index element={<Login />} />
            </Route>

            {/* Dealer app */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />

              {/* Customers */}
              <Route path="customers" element={<CustomerList />} />
              <Route path="customers/new" element={<CustomerCreate />} />
              <Route path="customers/:id" element={<CustomerProfile />} />

              {/* Vehicles */}
              <Route path="vehicles" element={<VehicleList />} />
              <Route path="vehicles/new" element={<VehicleCreate />} />
              <Route path="vehicles/:id" element={<VehicleProfile />} />

              {/* Vehicle Checks */}
              <Route path="checks" element={<VehicleChecks />} />

              {/* Placeholder modules */}
              <Route path="leads" element={<PlaceholderPage title="Leads Pipeline" description="Track and convert enquiries" icon={Target} />} />
              <Route path="invoices" element={<PlaceholderPage title="Invoices" description="Create and manage sale invoices" icon={FileText} />} />
              <Route path="warranties" element={<PlaceholderPage title="Warranties" description="Warranty management and tracking" icon={Shield} />} />
              <Route path="aftersales" element={<PlaceholderPage title="Aftersales" description="Complaint and case management" icon={Wrench} />} />
              <Route path="courtesy-cars" element={<PlaceholderPage title="Courtesy Cars" description="Loan vehicle tracking" icon={CarFront} />} />
              <Route path="tasks" element={<PlaceholderPage title="Tasks & Follow-ups" description="Manage your to-do list" icon={ClipboardCheck} />} />
              <Route path="reviews" element={<PlaceholderPage title="Review Booster" description="Automated review request campaigns" icon={Star} />} />
              <Route path="documents" element={<PlaceholderPage title="Documents" description="File manager and document generation" icon={FolderOpen} />} />
              <Route path="reports" element={<PlaceholderPage title="Reports & KPIs" description="Performance metrics and exports" icon={BarChart3} />} />
              <Route path="support" element={<PlaceholderPage title="Support Tickets" description="Get help from the DealerOps team" icon={MessageSquare} />} />
              <Route path="billing" element={<PlaceholderPage title="Billing & Plan" description="Manage your subscription" icon={CreditCard} />} />
              <Route path="audit" element={<PlaceholderPage title="Audit Log" description="View all system activity" icon={ScrollText} />} />
              <Route path="settings" element={<PlaceholderPage title="Settings" description="Dealership settings and preferences" icon={Settings} />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
