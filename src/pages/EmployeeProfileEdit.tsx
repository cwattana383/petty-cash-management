import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { toast } from "sonner";
import CreditCardTab from "@/components/employee/CreditCardTab";
import ApprovalChainTab from "@/components/employee/ApprovalChainTab";
import { type ApprovalLevel } from "@/components/employee/employee-types";

const mockEmployeeStore: Record<string, any> = {
  "1": { id: "1", employeeCode: "EMP001", firstName: "Somchai", lastName: "Jaidee", email: "somchai@cpaxtra.co.th", telephone: "0657778899", department: "Finance and Accounting", branch: "HO", division: "Accounting", storeHeadOffice: "Head Office", roles: ["Cardholder", "Admin"], active: true, creditCardLast4: "4321", cardHolderName: "Somchai Jaidee", approvalLevels: [] },
  "2": { id: "2", employeeCode: "EMP002", firstName: "Somying", lastName: "Rakdee", email: "somying@cpaxtra.co.th", telephone: "0612345678", department: "Marketing", branch: "Bangkok", division: "Sales", storeHeadOffice: "Head Office", roles: ["Approver"], active: true, creditCardLast4: "", cardHolderName: "", approvalLevels: [] },
  "3": { id: "3", employeeCode: "EMP003", firstName: "Prawit", lastName: "Munkong", email: "prawit@cpaxtra.co.th", telephone: "0698765432", department: "Engineering", branch: "Chiang Mai", division: "IT", storeHeadOffice: "Store Chiang Mai", roles: ["Cardholder"], active: true, creditCardLast4: "8899", cardHolderName: "Prawit Munkong", approvalLevels: [] },
  "4": { id: "4", employeeCode: "EMP004", firstName: "Wipa", lastName: "Sukjai", email: "wipa@cpaxtra.co.th", telephone: "0623456789", department: "HR", branch: "HO", division: "HR", storeHeadOffice: "Head Office", roles: ["Cardholder", "Approver"], active: false, creditCardLast4: "", cardHolderName: "", approvalLevels: [] },
  "5": { id: "5", employeeCode: "EMP005", firstName: "Anan", lastName: "Sodsai", email: "anan@cpaxtra.co.th", telephone: "0634567890", department: "Sales", branch: "Phuket", division: "Sales", storeHeadOffice: "Store Phuket", roles: ["Cardholder"], active: true, creditCardLast4: "5566", cardHolderName: "Anan Sodsai", approvalLevels: [] },
};

const allRoles = ["Cardholder", "Approver", "Admin"];

export default function EmployeeProfileEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isView = searchParams.get("mode") === "view";

  const employee = id ? mockEmployeeStore[id] : null;
  if (!employee) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8 text-center">
        <p className="text-muted-foreground">Employee not found.</p>
        <Button variant="outline" onClick={() => navigate("/admin")}>Back to Admin</Button>
      </div>
    );
  }

  const [form, setForm] = useState({
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    telephone: employee.telephone,
    department: employee.department,
    branch: employee.branch,
    division: employee.division,
    storeHeadOffice: employee.storeHeadOffice,
    roles: [...employee.roles] as string[],
    active: employee.active,
    creditCardLast4: employee.creditCardLast4,
    cardHolderName: employee.cardHolderName,
  });
  const [approvalLevels, setApprovalLevels] = useState<ApprovalLevel[]>(employee.approvalLevels ?? []);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.department || !form.branch || form.roles.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success(`Employee ${form.firstName} ${form.lastName} updated successfully`);
    navigate("/admin");
  };

  const employeeName = `${form.firstName} ${form.lastName}`;
  const disabled = isView;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isView ? "View Employee Profile" : "Edit Employee Profile"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isView ? "Employee profile details" : "Update employee information"}
          </p>
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
                <Label>Employee Code</Label>
                <Input value={form.employeeCode} onChange={(e) => handleChange("employeeCode", e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-2">
                <Label>First Name <span className="text-destructive">*</span></Label>
                <Input value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-2">
                <Label>Last Name <span className="text-destructive">*</span></Label>
                <Input value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} disabled={disabled} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-2">
                <Label>Telephone</Label>
                <Input value={form.telephone} onChange={(e) => { const val = e.target.value; if (val === "" || /^[\d-]*$/.test(val)) handleChange("telephone", val); }} disabled={disabled} />
              </div>
              <div className="space-y-2">
                <Label>Store / Head Office</Label>
                <Input value={form.storeHeadOffice} onChange={(e) => handleChange("storeHeadOffice", e.target.value)} disabled={disabled} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Department <span className="text-destructive">*</span></Label>
                <Input value={form.department} onChange={(e) => handleChange("department", e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-2">
                <Label>Division</Label>
                <Input value={form.division} onChange={(e) => handleChange("division", e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-2">
                <Label>Branch <span className="text-destructive">*</span></Label>
                <Input value={form.branch} onChange={(e) => handleChange("branch", e.target.value)} disabled={disabled} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Role <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-6 h-10">
                  {allRoles.map((r) => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={form.roles.includes(r)}
                        disabled={disabled}
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
                  <Switch checked={form.active} onCheckedChange={(v) => handleChange("active", v)} disabled={disabled} />
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
        onChangeLast4={disabled ? undefined : (v) => handleChange("creditCardLast4", v)}
        onChangeHolder={disabled ? undefined : (v) => handleChange("cardHolderName", v)}
      />

      {/* Section 3: Approval Chain */}
      <ApprovalChainTab
        initialLevels={approvalLevels}
        onLevelsChange={setApprovalLevels}
        readOnly={disabled}
      />

      {/* Footer Buttons */}
      {!isView && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
          <Button onClick={handleSubmit}><Save className="h-4 w-4 mr-2" />Save</Button>
        </div>
      )}
      {isView && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => navigate("/admin")}>Back</Button>
          <Button onClick={() => navigate(`/admin/employee/${id}/edit`)}>Edit</Button>
        </div>
      )}
    </div>
  );
}
