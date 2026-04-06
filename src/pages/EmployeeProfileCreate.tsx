import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useRolesOverview } from "@/hooks/use-roles";
import { useCreateEmployee } from "@/hooks/use-employees";
import CreditCardTab from "@/components/employee/CreditCardTab";
import ApprovalChainTab from "@/components/employee/ApprovalChainTab";
import type { ApprovalLevel } from "@/components/employee/employee-types";
import type { CreateApprovalLevelData } from "@/hooks/use-employees";
import { cn, isCorporateEmail } from "@/lib/utils";

export default function EmployeeProfileCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: availableRoles } = useRolesOverview();
  const createEmployee = useCreateEmployee();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: searchParams.get("email") ?? "",
    employeeCode: "",
    storeHeadOffice: "",
    division: "",
    telephone: "",
    department: "",
    branch: "",
    selectedRoleIds: [] as string[],
    creditCardLast4: "",
    cardHolderName: "",
    active: true,
  });

  const [approvalLevels, setApprovalLevels] = useState<Omit<ApprovalLevel, "id">[]>([]);
  const [saveAttempted, setSaveAttempted] = useState(false);

  const handleLevelsChange = useCallback((levels: Omit<ApprovalLevel, "id">[]) => {
    setApprovalLevels(levels);
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRole = (roleId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedRoleIds: prev.selectedRoleIds.includes(roleId)
        ? prev.selectedRoleIds.filter((id) => id !== roleId)
        : [...prev.selectedRoleIds, roleId],
    }));
  };

  const isCardholderSelected = (availableRoles ?? []).some(
    (r) => r.name === "Cardholder" && form.selectedRoleIds.includes(r.id),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveAttempted(true);
    if (!form.firstName || !form.lastName || !form.email || !form.department || !form.branch || form.selectedRoleIds.length === 0) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (!isCorporateEmail(form.email)) {
      return;
    }
    const effectiveCardHolderName = form.cardHolderName || `${form.firstName} ${form.lastName}`.trim();
    if (isCardholderSelected && (!form.creditCardLast4 || !effectiveCardHolderName)) {
      toast({ title: "Error", description: "Cardholder role requires Credit Card Last 4 Digits and Cardholder Name", variant: "destructive" });
      return;
    }

    createEmployee.mutate(
      {
        employeeCode: form.employeeCode,
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        branch: form.branch,
        department: form.department,
        telephone: form.telephone || undefined,
        storeHeadOffice: form.storeHeadOffice || undefined,
        division: form.division || undefined,
        active: form.active,
        creditCardLast4: form.creditCardLast4 || undefined,
        cardHolderName: form.cardHolderName || `${form.firstName} ${form.lastName}`.trim() || undefined,
        roleIds: form.selectedRoleIds,
        ...(approvalLevels.length > 0 && {
          approvalLevels: approvalLevels.map((al) => ({
            approverId: al.approverId,
            effectiveFrom: al.effectiveFrom,
            effectiveTo: al.effectiveTo || undefined,
            status: al.status,
          } as CreateApprovalLevelData)),
        }),
      },
      {
        onSuccess: () => {
          toast({ title: "Success", description: `Employee ${form.firstName} ${form.lastName} created successfully` });
          navigate("/admin");
        },
        onError: (err: Error) => {
          toast({ title: "Error", description: err?.message || "Failed to create employee", variant: "destructive" });
        },
      },
    );
  };

  const employeeName = `${form.firstName} ${form.lastName}`.trim();
  const roleOptions = availableRoles ?? [];
  const emailTrimmed = form.email.trim();
  const emailFieldError =
    saveAttempted && emailTrimmed.length > 0 && !isCorporateEmail(form.email)
      ? "กรุณาใช้อีเมล @cpaxtra.co.th เท่านั้น"
      : "";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Employee Profile</h1>
          <p className="text-sm text-muted-foreground">Add a new employee to the system</p>
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
                <Label htmlFor="employeeCode">Employee Code<span className="text-destructive">*</span></Label>
                <Input id="employeeCode" placeholder="e.g. EMP011" value={form.employeeCode} onChange={(e) => handleChange("employeeCode", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name<span className="text-destructive">*</span></Label>
                <Input id="firstName" placeholder="e.g. John" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                <Input id="lastName" placeholder="e.g. Doe" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email<span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. john.doe@cpaxtra.co.th"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={cn(emailFieldError && "border-destructive focus-visible:ring-destructive")}
                  aria-invalid={emailFieldError ? true : undefined}
                />
                {emailFieldError ? (
                  <p className="text-sm text-destructive">{emailFieldError}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Telephone</Label>
                <Input id="telephone" placeholder="Type a value" value={form.telephone} onChange={(e) => { const val = e.target.value; if (val === "" || /^[\d-]*$/.test(val)) handleChange("telephone", val); }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeHeadOffice">Branch/Head Office (Store / Head Office)</Label>
                <Input id="storeHeadOffice" placeholder="e.g. Head Office" value={form.storeHeadOffice} onChange={(e) => handleChange("storeHeadOffice", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="division">Division</Label>
                <Input id="division" placeholder="e.g. 92029 – Accounting" value={form.division} onChange={(e) => handleChange("division", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department<span className="text-destructive">*</span></Label>
                <Input id="department" placeholder="e.g. Finance and Accounting" value={form.department} onChange={(e) => handleChange("department", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch<span className="text-destructive">*</span></Label>
                <Input id="branch" placeholder="e.g. 099999 – HO" value={form.branch} onChange={(e) => handleChange("branch", e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-8">
              <div className="space-y-2">
                <Label>Role<span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-6 h-10">
                  {roleOptions.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={form.selectedRoleIds.includes(r.id)}
                        onCheckedChange={() => toggleRole(r.id)}
                      />
                      {r.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex items-center gap-3 h-10">
                  <Switch
                    checked={form.active}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: checked }))}
                  />
                  <span className="text-sm text-muted-foreground">{form.active ? "Active" : "Inactive"}</span>
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
        required={isCardholderSelected}
        showErrors={saveAttempted && isCardholderSelected}
      />

      {/* Section 3: Approval Chain */}
      <ApprovalChainTab onLevelsChange={handleLevelsChange} />

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={createEmployee.isPending}>
          <Save className="h-4 w-4 mr-2" />{createEmployee.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
