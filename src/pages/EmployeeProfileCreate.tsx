import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRoles } from "@/lib/role-context";
import CreditCardTab from "@/components/employee/CreditCardTab";
import ApprovalChainTab from "@/components/employee/ApprovalChainTab";

const departments = ["9993010460 Finance and Accounting", "Sales", "Marketing", "Engineering", "Finance", "HR", "Operations"];
const branches = ["099999 – HO", "Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Khon Kaen"];
const costCenters = ["9999", "CC-100", "CC-200", "CC-300", "CC-400", "CC-500"];
const roles = ["Cardholder", "Approver", "Admin"];
const companies = ["CP Axtra Public Company Limited", "ABC Corporation", "XYZ Holdings", "DEF Group"];
const stores = ["Head Office", "Store Bangkok", "Store Chiang Mai", "Store Phuket"];
const divisions = ["92029 – Accounting", "Division A", "Division B", "Division C", "Division D"];

export default function EmployeeProfileCreate() {
  const navigate = useNavigate();
  const { setRoles } = useRoles();
  const [form, setForm] = useState({
    firstName: "Somchai",
    lastName: "Jaidee",
    email: "somchai@cpaxtra.co.th",
    storeHeadOffice: "",
    company: "CP Axtra Public Company Limited",
    division: "92029 – Accounting",
    telephone: "0657778899",
    department: "9993010460 Finance and Accounting",
    branch: "099999 – HO",
    costCenter: "9999",
    roles: ["Cardholder"] as string[],
    creditCardLast4: "",
    cardHolderName: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.department || !form.branch || !form.costCenter || form.roles.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    setRoles(form.roles);
    toast.success(`Employee ${form.firstName} ${form.lastName} added successfully`);
    // Navigate to /claims and reload to reflect new role
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
                <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                <Input id="firstName" placeholder="e.g. Somchai" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                <Input id="lastName" placeholder="e.g. Jaidee" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Telephone</Label>
                <Input id="telephone" placeholder="Type a value" value={form.telephone} onChange={(e) => { const val = e.target.value; if (val === "" || /^[\d-]*$/.test(val)) handleChange("telephone", val); }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="e.g. somchai@company.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Branch/Head Office (Store / Head Office)</Label>
                <Select value={form.storeHeadOffice} onValueChange={(v) => handleChange("storeHeadOffice", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Store / Head Office" /></SelectTrigger>
                  <SelectContent>{stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Select value={form.company} onValueChange={(v) => handleChange("company", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Company" /></SelectTrigger>
                  <SelectContent>{companies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Department <span className="text-destructive">*</span></Label>
                <Select value={form.department} onValueChange={(v) => handleChange("department", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Division</Label>
                <Select value={form.division} onValueChange={(v) => handleChange("division", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Division" /></SelectTrigger>
                  <SelectContent>{divisions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Branch <span className="text-destructive">*</span></Label>
                <Select value={form.branch} onValueChange={(v) => handleChange("branch", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                  <SelectContent>{branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cost Center <span className="text-destructive">*</span></Label>
                <Select value={form.costCenter} onValueChange={(v) => handleChange("costCenter", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Cost Center" /></SelectTrigger>
                  <SelectContent>{costCenters.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
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
      <ApprovalChainTab />

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
        <Button onClick={handleSubmit}><Save className="h-4 w-4 mr-2" />Save</Button>
      </div>
    </div>
  );
}
