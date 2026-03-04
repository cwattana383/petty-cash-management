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
const companies = ["บริษัท ซีพี แอ็กซ์ตร้า จำกัด (มหาชน)", "ABC Corporation", "XYZ Holdings", "DEF Group"];
const stores = ["Head Office", "Store Bangkok", "Store Chiang Mai", "Store Phuket"];
const divisions = ["92029 – Accounting", "Division A", "Division B", "Division C", "Division D"];

export default function EmployeeProfileCreate() {
  const navigate = useNavigate();
  const { setRoles } = useRoles();
  const [form, setForm] = useState({
    firstName: "สมชาย",
    lastName: "ใจดี",
    email: "somchai@cpaxtra.co.th",
    storeHeadOffice: "",
    company: "บริษัท ซีพี แอ็กซ์ตร้า จำกัด (มหาชน)",
    division: "92029 – Accounting",
    telephone: "0657778899",
    department: "9993010460 Finance and Accounting",
    branch: "099999 – HO",
    costCenter: "9999",
    roles: [] as string[],
    creditCardLast4: "",
    cardHolderName: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.department || !form.branch || !form.costCenter || form.roles.length === 0) {
      toast.error("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    setRoles(form.roles);
    toast.success(`เพิ่มพนักงาน ${form.firstName} ${form.lastName} สำเร็จ`);
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
          <p className="text-sm text-muted-foreground">เพิ่มข้อมูลพนักงานใหม่เข้าสู่ระบบ</p>
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
                <Label htmlFor="firstName">ชื่อ (First Name) <span className="text-destructive">*</span></Label>
                <Input id="firstName" placeholder="เช่น สมชาย" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">นามสกุล (Last Name) <span className="text-destructive">*</span></Label>
                <Input id="lastName" placeholder="เช่น ใจดี" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">โทรศัพท์ (Telephone)</Label>
                <Input id="telephone" placeholder="Type a value" value={form.telephone} onChange={(e) => { const val = e.target.value; if (val === "" || /^[\d-]*$/.test(val)) handleChange("telephone", val); }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล (Email)</Label>
                <Input id="email" type="email" placeholder="เช่น somchai@company.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>สาขา/สำนักงานใหญ่ (Store / Head Office)</Label>
                <Select value={form.storeHeadOffice} onValueChange={(v) => handleChange("storeHeadOffice", v)}>
                  <SelectTrigger><SelectValue placeholder="เลือก Store / Head Office" /></SelectTrigger>
                  <SelectContent>{stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>บริษัท (Company)</Label>
                <Select value={form.company} onValueChange={(v) => handleChange("company", v)}>
                  <SelectTrigger><SelectValue placeholder="เลือกบริษัท" /></SelectTrigger>
                  <SelectContent>{companies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>แผนก (Department) <span className="text-destructive">*</span></Label>
                <Select value={form.department} onValueChange={(v) => handleChange("department", v)}>
                  <SelectTrigger><SelectValue placeholder="เลือกแผนก" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ฝ่าย (Division)</Label>
                <Select value={form.division} onValueChange={(v) => handleChange("division", v)}>
                  <SelectTrigger><SelectValue placeholder="เลือก Division" /></SelectTrigger>
                  <SelectContent>{divisions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>สาขา (Branch) <span className="text-destructive">*</span></Label>
                <Select value={form.branch} onValueChange={(v) => handleChange("branch", v)}>
                  <SelectTrigger><SelectValue placeholder="เลือกสาขา" /></SelectTrigger>
                  <SelectContent>{branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>ศูนย์ต้นทุน (Cost Center) <span className="text-destructive">*</span></Label>
                <Select value={form.costCenter} onValueChange={(v) => handleChange("costCenter", v)}>
                  <SelectTrigger><SelectValue placeholder="เลือก Cost Center" /></SelectTrigger>
                  <SelectContent>{costCenters.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>บทบาท (Role) <span className="text-destructive">*</span></Label>
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
        <Button type="button" variant="outline" onClick={() => navigate("/admin")}>ยกเลิก</Button>
        <Button onClick={handleSubmit}><Save className="h-4 w-4 mr-2" />บันทึก</Button>
      </div>
    </div>
  );
}
