import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ClaimsProvider } from "@/lib/claims-context";
import Login from "./pages/Login";
import UploadDocument from "./pages/UploadDocument";
import MyClaims from "./pages/MyClaims";
import CreateClaim from "./pages/CreateClaim";
import ClaimDetail from "./pages/ClaimDetail";
import ApprovalInbox from "./pages/ApprovalInbox";
import AccountingReview from "./pages/AccountingReview";
import Reports from "./pages/Reports";
import Reconcile from "./pages/Reconcile";
import Admin from "./pages/Admin";
import EmployeeProfileCreate from "./pages/EmployeeProfileCreate";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ClaimsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <AuthGuard>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<MyClaims />} />
                      <Route path="/upload" element={<UploadDocument />} />
                      <Route path="/claims" element={<MyClaims />} />
                      <Route path="/claims/create" element={<CreateClaim />} />
                      <Route path="/claims/:id" element={<ClaimDetail />} />
                      <Route path="/approvals" element={<ApprovalInbox />} />
                      <Route path="/accounting" element={<AccountingReview />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/reconcile" element={<Reconcile />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/admin/employee/create" element={<EmployeeProfileCreate />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </AuthGuard>
              }
            />
          </Routes>
        </BrowserRouter>
      </ClaimsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
