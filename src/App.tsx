import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { ClaimsProvider } from "@/lib/claims-context";
import { RoleProvider } from "@/lib/role-context";
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
import EmployeeProfileEdit from "./pages/EmployeeProfileEdit";
import ExpenseTypeEdit from "./pages/ExpenseTypeEdit";
import Profile from "./pages/Profile";
import BankTransactions from "./pages/BankTransactions";
import PolicyManagement from "./pages/PolicyManagement";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ClaimsProvider>
          <RoleProvider>
            <Toaster />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
                          <Route path="/approvals" element={<RoleGuard allowedRoles={["Approver", "Admin"]}><ApprovalInbox /></RoleGuard>} />
                          <Route path="/accounting" element={<RoleGuard allowedRoles={["Admin"]}><AccountingReview /></RoleGuard>} />
                          <Route path="/accounting/:id" element={<RoleGuard allowedRoles={["Admin"]}><AccountingClaimDetail /></RoleGuard>} />
                          <Route path="/reports" element={<RoleGuard allowedRoles={["Admin"]}><Reports /></RoleGuard>} />

                          <Route path="/bank-transactions" element={<RoleGuard allowedRoles={["Admin"]}><BankTransactions /></RoleGuard>} />
                          <Route path="/policy-management" element={<RoleGuard allowedRoles={["Admin"]}><PolicyManagement /></RoleGuard>} />
                          <Route path="/admin" element={<RoleGuard allowedRoles={["Admin"]}><Admin /></RoleGuard>} />
                          <Route path="/admin/employee/create" element={<RoleGuard allowedRoles={["Admin"]}><EmployeeProfileCreate /></RoleGuard>} />
                          <Route path="/admin/employee/:id/edit" element={<RoleGuard allowedRoles={["Admin"]}><EmployeeProfileEdit /></RoleGuard>} />
                          <Route path="/admin/employee/:id" element={<RoleGuard allowedRoles={["Admin"]}><EmployeeProfileEdit /></RoleGuard>} />
                          <Route path="/admin/expense-type/create" element={<RoleGuard allowedRoles={["Admin"]}><ExpenseTypeEdit /></RoleGuard>} />
                          <Route path="/admin/expense-type/:id/edit" element={<RoleGuard allowedRoles={["Admin"]}><ExpenseTypeEdit /></RoleGuard>} />
                          <Route path="/admin/expense-type/:id" element={<RoleGuard allowedRoles={["Admin"]}><ExpenseTypeEdit /></RoleGuard>} />
                          <Route path="/notifications" element={<Notifications />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AppLayout>
                    </AuthGuard>
                  }
                />
              </Routes>
            </BrowserRouter>
          </RoleProvider>
        </ClaimsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
