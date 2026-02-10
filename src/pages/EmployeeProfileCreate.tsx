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
import { toast } from "sonner";

const departments = ["Sales", "Marketing", "Engineering", "Finance", "HR", "Operations"];
const branches = ["Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Khon Kaen"];
const costCenters = ["CC-100", "CC-200", "CC-300", "CC-400", "CC-500"];
const roles = ["Employee", "Manager", "Accounting", "Admin"];

export default function EmployeeProfileCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    department: "",
    branch: "",
    costCenter: "",
    role: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.department || !form.branch || !form.costCenter || !form.role) {
      toast.error("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    toast.success(`เพิ่มพนักงาน ${form.firstName} ${form.lastName} สำเร็จ`);
    navigate("/admin");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Employee Profile</h1>
          <p className="text-sm text-muted-foreground">เพิ่มข้อมูลพนักงานใหม่เข้าสู่ระบบ</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-5 w-5 text-primary" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">ชื่อ (First Name) <span className="text-destructive">*</span></Label>
                <Input
                  id="firstName"
                  placeholder="เช่น สมชาย"
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">นามสกุล (Last Name) <span className="text-destructive">*</span></Label>
                <Input
                  id="lastName"
                  placeholder="เช่น ใจดี"
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>แผนก (Department) <span className="text-destructive">*</span></Label>
                <Select value={form.department} onValueChange={(v) => handleChange("department", v)}>
                  <SelectTrigger><SelectValue placeholder="เลือกแผนก" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>สาขา (Branch) <span className="text-destructive">*</span></Label>
                <Select value={form.branch} onValueChange={(v) => handleChange("branch", v)}>
                  <SelectTrigger><SelectValue placeholder="เลือกสาขา" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ศูนย์ต้นทุน (Cost Center) <span className="text-destructive">*</span></Label>
                <Select value={form.costCenter} onValueChange={(v) => handleChange("costCenter", v)}>
                  <SelectTrigger><SelectValue placeholder="เลือก Cost Center" /></SelectTrigger>
                  <SelectContent>
                    {costCenters.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>บทบาท (Role) <span className="text-destructive">*</span></Label>
                <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                  <SelectTrigger><SelectValue placeholder="เลือก Role" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
                ยกเลิก
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                บันทึก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
