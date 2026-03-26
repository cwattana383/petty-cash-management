import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useRoles } from "@/lib/role-context";
import CreditCardTab from "@/components/employee/CreditCardTab";
import ApprovalChainTab from "@/components/employee/ApprovalChainTab";
import { type ApprovalLevel } from "@/components/employee/employee-types";

const roles = ["Cardholder", "Approver", "Admin"];

export default function EmployeeProfileCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get("email") ?? "";
  const { setRoles } = useRoles();
  const [form, setForm] = useState({
    employeeCode: "",
    firstName: "Somchai",
    lastName: "Jaidee",
    email: prefillEmail || "somchai@cpaxtra.co.th",
    storeHeadOffice: "",
    division: "",
    telephone: "0657778899",
    department: "",
    branch: "",
    roles: ["Cardholder"] as string[],
    active: true,
    creditCardLast4: "",
    cardHolderName: "",
  });
  const [approvalLevels, setApprovalLevels] = useState<ApprovalLevel[]>([]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.department || !form.branch || form.roles.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    setRoles(form.roles);
    toast.success(`Employee ${form.firstName} ${form.lastName} added successfully`);
    navigate("/claims");
    setTimeout(() => window.location.reload(), 100);
  };

  const employeeName = `${form.firstName} ${form.lastName}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Employee Profile</h1>
          <p className="text-sm text-muted-foreground">Add new employee information to the system</p>
        </div>
      </div>

      {/* Section 1: Employee Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-5 w-5 text-primary" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeCode">Employee Code</Label>
                <Input id="employeeCode" placeholder="e.g. EMP001" value={form.employeeCode} onChange={(e) => handleChange("employeeCode", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                <Input id="firstName" placeholder="e.g. Somchai" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                <Input id="lastName" placeholder="e.g. Jaidee" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="e.g. somchai@company.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Telephone</Label>
                <Input id="telephone" placeholder="Type a value" value={form.telephone} onChange={(e) => { const val = e.target.value; if (val === "" || /^[\d-]*$/.test(val)) handleChange("telephone", val); }} />
              </div>
              <div className="space-y-2">
                <Label>Store / Head Office</Label>
                <Input placeholder="e.g. Head Office" value={form.storeHeadOffice} onChange={(e) => handleChange("storeHeadOffice", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Department <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Finance and Accounting" value={form.department} onChange={(e) => handleChange("department", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Division</Label>
                <Input placeholder="e.g. Accounting" value={form.division} onChange={(e) => handleChange("division", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Branch <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. HO" value={form.branch} onChange={(e) => handleChange("branch", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Role <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-6 h-10">
                  {roles.map((r) => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={form.roles.includes(r)}
                        onCheckedChange={(checked) => {
                          setForm((prev) => ({
                            ...prev,
                            roles: checked
                              ? [...prev.roles, r]
                              : prev.roles.filter((role) => role !== r),
                          }));
                        }}
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex items-center h-10">
                  <Switch checked={form.active} onCheckedChange={(v) => handleChange("active", v)} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Credit Card */}
      <CreditCardTab
        employeeName={employeeName}
        last4Digit={form.creditCardLast4}
        cardHolderName={form.cardHolderName || employeeName}
        onChangeLast4={(v) => handleChange("creditCardLast4", v)}
        onChangeHolder={(v) => handleChange("cardHolderName", v)}
      />

      {/* Section 3: Approval Chain */}
      <ApprovalChainTab
        initialLevels={approvalLevels}
        onLevelsChange={setApprovalLevels}
      />

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
        <Button onClick={handleSubmit}><Save className="h-4 w-4 mr-2" />Save</Button>
      </div>
    </div>
  );
}
