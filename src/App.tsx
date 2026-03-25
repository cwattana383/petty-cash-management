import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ClaimsProvider } from "@/lib/claims-context";
import { RoleProvider } from "@/lib/role-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import Login from "./pages/Login";

import MyClaims from "./pages/MyClaims";
import CreateClaim from "./pages/CreateClaim";
import ClaimDetail from "./pages/ClaimDetail";
import ApprovalInbox from "./pages/ApprovalInbox";
import AccountingReview from "./pages/AccountingReview";
import AccountingClaimDetail from "./pages/AccountingClaimDetail";
import Reports from "./pages/Reports";

import Admin from "./pages/Admin";
import EmployeeProfileCreate from "./pages/EmployeeProfileCreate";
import Profile from "./pages/Profile";
import BankTransactions from "./pages/BankTransactions";
import PolicyManagement from "./pages/PolicyManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ClaimsProvider>
        <RoleProvider>
        <NotificationsProvider>
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
                        
                        <Route path="/claims" element={<MyClaims />} />
                        <Route path="/claims/create" element={<CreateClaim />} />
                        <Route path="/claims/:id" element={<ClaimDetail />} />
                        <Route path="/approvals" element={<ApprovalInbox />} />
                        <Route path="/accounting" element={<AccountingReview />} />
                        <Route path="/reports" element={<Reports />} />
                        
                        <Route path="/bank-transactions" element={<BankTransactions />} />
                        <Route path="/policy-management" element={<PolicyManagement />} />
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
        </NotificationsProvider>
        </RoleProvider>
      </ClaimsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
