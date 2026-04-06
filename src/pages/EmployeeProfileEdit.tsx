import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useRolesOverview } from "@/hooks/use-roles";
import { useEmployee, useUpdateEmployee } from "@/hooks/use-employees";
import CreditCardTab from "@/components/employee/CreditCardTab";
import ApprovalChainTab from "@/components/employee/ApprovalChainTab";
import type { ApprovalLevel } from "@/components/employee/employee-types";
import type { CreateApprovalLevelData } from "@/hooks/use-employees";

export default function EmployeeProfileEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const isViewMode = searchParams.get("mode") === "view" || !location.pathname.endsWith("/edit");

  const { data: employee, isLoading: loadingEmployee } = useEmployee(id!);
  const { data: availableRoles } = useRolesOverview();
  const updateEmployee = useUpdateEmployee();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
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
  const [initialApprovalLevels, setInitialApprovalLevels] = useState<ApprovalLevel[]>([]);
  const [formInitialised, setFormInitialised] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);

  useEffect(() => {
    if (employee && !formInitialised) {
      const nameParts = (employee.name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setForm({
        firstName,
        lastName,
        email: employee.email || "",
        employeeCode: employee.employeeCode || "",
        storeHeadOffice: employee.storeHeadOffice || "",
        division: employee.division || "",
        telephone: employee.telephone || "",
        department: employee.department || "",
        branch: employee.branch || "",
        selectedRoleIds: employee.userRoles?.map((ur: { roleId?: string; role?: { id?: string } }) => ur.roleId || ur.role?.id) || [],
        creditCardLast4: employee.creditCardLast4 || "",
        cardHolderName: employee.cardHolderName || "",
        active: employee.active ?? true,
      });

      if (employee.userApprovalLevels && employee.userApprovalLevels.length > 0) {
        setInitialApprovalLevels(
          employee.userApprovalLevels.map((al: { id?: string; approverId?: string; approverUser?: { id?: string; name?: string }; effectiveFrom?: string; effectiveTo?: string; status?: boolean }) => ({
            id: al.id || crypto.randomUUID(),
            approverId: al.approverId || "",
            effectiveFrom: al.effectiveFrom || "",
            effectiveTo: al.effectiveTo || "",
            status: al.status ?? true,
          }))
        );
      }

      setFormInitialised(true);
    }
  }, [employee, formInitialised]);

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
        ? prev.selectedRoleIds.filter((rid) => rid !== roleId)
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
    const effectiveCardHolderName = form.cardHolderName || `${form.firstName} ${form.lastName}`.trim();
    if (isCardholderSelected && (!form.creditCardLast4 || !effectiveCardHolderName)) {
      toast({ title: "Error", description: "Cardholder role requires Credit Card Last 4 Digits and Cardholder Name", variant: "destructive" });
      return;
    }

    updateEmployee.mutate(
      {
        id: id!,
        data: {
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
          approvalLevels: approvalLevels.map((al) => ({
            approverId: al.approverId,
            effectiveFrom: al.effectiveFrom,
            effectiveTo: al.effectiveTo || undefined,
            status: al.status,
          } as CreateApprovalLevelData)),
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Success", description: `Employee ${form.firstName} ${form.lastName} updated successfully` });
          navigate("/admin");
        },
        onError: (err: Error) => {
          toast({ title: "Error", description: err?.message || "Failed to update employee", variant: "destructive" });
        },
      },
    );
  };

  const employeeName = `${form.firstName} ${form.lastName}`.trim();
  const roleOptions = availableRoles ?? [];

  if (loadingEmployee) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-muted-foreground">
        Loading employee data...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isViewMode ? "View Employee Profile" : "Edit Employee Profile"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isViewMode ? "View Employee" : "Edit Employee"}
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
                <Label htmlFor="employeeCode">Employee Code<span className="text-destructive">*</span></Label>
                <Input id="employeeCode" placeholder="e.g. EMP011" value={form.employeeCode} disabled onChange={(e) => handleChange("employeeCode", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name<span className="text-destructive">*</span></Label>
                <Input id="firstName" placeholder="e.g. John" value={form.firstName} disabled={isViewMode} onChange={(e) => handleChange("firstName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name<span className="text-destructive">*</span></Label>
                <Input id="lastName" placeholder="e.g. Doe" value={form.lastName} disabled={isViewMode} onChange={(e) => handleChange("lastName", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input id="email" type="email" placeholder="e.g. john.doe@cpaxtra.co.th" value={form.email} disabled onChange={(e) => handleChange("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Telephone</Label>
                <Input id="telephone" placeholder="Type a value" value={form.telephone} disabled={isViewMode} onChange={(e) => { const val = e.target.value; if (val === "" || /^[\d-]*$/.test(val)) handleChange("telephone", val); }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeHeadOffice">Branch/Head Office (Store / Head Office)</Label>
                <Input id="storeHeadOffice" placeholder="e.g. Head Office" value={form.storeHeadOffice} disabled={isViewMode} onChange={(e) => handleChange("storeHeadOffice", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="division">Division</Label>
                <Input id="division" placeholder="e.g. 92029 – Accounting" value={form.division} disabled={isViewMode} onChange={(e) => handleChange("division", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department<span className="text-destructive">*</span></Label>
                <Input id="department" placeholder="e.g. Finance and Accounting" value={form.department} disabled={isViewMode} onChange={(e) => handleChange("department", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch<span className="text-destructive">*</span></Label>
                <Input id="branch" placeholder="e.g. 099999 – HO" value={form.branch} disabled={isViewMode} onChange={(e) => handleChange("branch", e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-8">
              <div className="space-y-2">
                <Label>Role <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-6 h-10">
                  {roleOptions.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={form.selectedRoleIds.includes(r.id)}
                        onCheckedChange={() => toggleRole(r.id)}
                        disabled={isViewMode}
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
                    disabled={isViewMode}
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
        readOnly={isViewMode}
        required={isCardholderSelected}
        showErrors={saveAttempted && isCardholderSelected}
      />

      {/* Section 3: Approval Chain */}
      <ApprovalChainTab
        onLevelsChange={handleLevelsChange}
        initialLevels={initialApprovalLevels}
        readOnly={isViewMode}
      />

      {/* Footer Buttons */}
      {!isViewMode && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={updateEmployee.isPending}>
            <Save className="h-4 w-4 mr-2" />{updateEmployee.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}
