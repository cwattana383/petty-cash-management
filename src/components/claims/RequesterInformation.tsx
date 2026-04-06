import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@/lib/types";
import { users, currentUser } from "@/lib/mock-data";
import { Search } from "lucide-react";

export type RequestType = "Owner" | "Other";

export interface RequesterData {
  requestType: RequestType;
  employeeId: string;
  employee: string;
  store: string;
  company: string;
  telephone: string;
  email: string;
  division: string;
  department: string;
  branch: string;
}

interface RequesterInfoProps {
  data: RequesterData;
  creatorData: {
    employee: string;
    store: string;
    company: string;
    email: string;
    division: string;
  };
  onChange: (data: RequesterData) => void;
}

export default function RequesterInformation({ data, creatorData, onChange }: RequesterInfoProps) {
  const isOwner = data.requestType === "Owner";

  const handleTypeChange = (type: RequestType) => {
    if (type === "Owner") {
      onChange({
        requestType: "Owner",
        employeeId: "",
        employee: creatorData.employee,
        store: creatorData.store,
        company: creatorData.company,
        telephone: currentUser.telephone || "",
        email: creatorData.email,
        division: creatorData.division,
        department: "9993010460 Finance and Accounting",
        branch: "099999 – HO",
      });
    } else {
      onChange({
        requestType: "Other",
        employeeId: "",
        employee: "",
        store: "",
        company: "",
        telephone: "",
        email: "",
        division: "",
        department: "",
        branch: "",
      });
    }
  };

  const handleEmployeeSelect = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      onChange({
        ...data,
        employeeId: user.id,
        employee: user.name,
        store: user.branch,
        company: "ABC Co., Ltd.",
        telephone: user.telephone || "",
        email: user.email,
        division: user.department,
      });
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Requester Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Employee *</Label>
            {isOwner ? (
              <Input value={data.employee} disabled />
            ) : (
              <div className="relative">
                <Select value={data.employeeId} onValueChange={handleEmployeeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Search employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.employeeCode} - {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div>
            <Label>Telephone</Label>
            <Input value={data.telephone} disabled />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={data.email} disabled />
          </div>
          <div>
            <Label>แผนก (Department)</Label>
            <Input value={data.department} disabled />
          </div>
          <div>
            <Label>Division</Label>
            <Input value={data.division} disabled />
          </div>
          <div>
            <Label>สาขา (Branch)</Label>
            <Input value={data.branch} disabled />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
