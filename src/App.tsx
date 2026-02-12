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
import DocumentList from "./pages/app/documents/DocumentList";
import ReviewBooster from "./pages/app/reviews/ReviewBooster";
import SupportTickets from "./pages/app/support/SupportTickets";
import BillingPage from "./pages/app/billing/BillingPage";
import SuperAdminDealers from "./pages/app/admin/SuperAdminDealers";
import TeamManagement from "./pages/app/team/TeamManagement";
import CustomerList from "./pages/app/customers/CustomerList";
import CustomerCreate from "./pages/app/customers/CustomerCreate";
import CustomerProfile from "./pages/app/customers/CustomerProfile";
import VehicleList from "./pages/app/vehicles/VehicleList";
import VehicleCreate from "./pages/app/vehicles/VehicleCreate";
import VehicleProfile from "./pages/app/vehicles/VehicleProfile";
import VehicleChecks from "./pages/app/checks/VehicleChecks";
import LeadList from "./pages/app/leads/LeadList";
import LeadCreate from "./pages/app/leads/LeadCreate";
import LeadProfile from "./pages/app/leads/LeadProfile";
import InvoiceList from "./pages/app/invoices/InvoiceList";
import InvoiceCreate from "./pages/app/invoices/InvoiceCreate";
import WarrantyList from "./pages/app/warranties/WarrantyList";
import WarrantyCreate from "./pages/app/warranties/WarrantyCreate";
import AftersalesModule from "./pages/app/aftersales/AftersalesModule";
import AftersalesCaseCreate from "./pages/app/aftersales/AftersalesCaseCreate";
import AftersalesCaseDetail from "./pages/app/aftersales/AftersalesCaseDetail";
import CourtesyCarList from "./pages/app/courtesy/CourtesyCarList";
import CourtesyCarCreate from "./pages/app/courtesy/CourtesyCarCreate";
import TaskList from "./pages/app/tasks/TaskList";
import TaskCreate from "./pages/app/tasks/TaskCreate";
import AuditLog from "./pages/app/audit/AuditLog";
import SettingsPage from "./pages/app/settings/SettingsPage";
import ReportsPage from "./pages/app/reports/ReportsPage";
import NotFound from "./pages/NotFound";

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

              {/* Leads */}
              <Route path="leads" element={<LeadList />} />
              <Route path="leads/new" element={<LeadCreate />} />
              <Route path="leads/:id" element={<LeadProfile />} />

              {/* Invoices */}
              <Route path="invoices" element={<InvoiceList />} />
              <Route path="invoices/new" element={<InvoiceCreate />} />

              {/* Warranties */}
              <Route path="warranties" element={<WarrantyList />} />
              <Route path="warranties/new" element={<WarrantyCreate />} />

              {/* Aftersales */}
              <Route path="aftersales" element={<AftersalesModule />} />
              <Route path="aftersales/new" element={<AftersalesCaseCreate />} />
              <Route path="aftersales/:id" element={<AftersalesCaseDetail />} />

              {/* Courtesy Cars */}
              <Route path="courtesy-cars" element={<CourtesyCarList />} />
              <Route path="courtesy-cars/new" element={<CourtesyCarCreate />} />

              {/* Tasks */}
              <Route path="tasks" element={<TaskList />} />
              <Route path="tasks/new" element={<TaskCreate />} />

              {/* Audit Log */}
              <Route path="audit" element={<AuditLog />} />

              {/* Settings */}
              <Route path="settings" element={<SettingsPage />} />

              {/* More modules */}
              <Route path="reviews" element={<ReviewBooster />} />
              <Route path="documents" element={<DocumentList />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="support" element={<SupportTickets />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="admin/dealers" element={<SuperAdminDealers />} />
              <Route path="team" element={<TeamManagement />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
