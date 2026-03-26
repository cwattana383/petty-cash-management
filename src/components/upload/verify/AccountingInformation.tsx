import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark } from "lucide-react";
import { currentUser } from "@/lib/mock-data";

export interface AccountingData {
  claimant: string;
  department: string;
  expenseType: string;
  pettyCashFund: string;
  reimbursementType: string;
  accountingDate: string;
  description: string;
  segments: string[];
}

interface Props {
  data: AccountingData;
  onChange: (d: AccountingData) => void;
}

const segmentLabels = [
  "Company", "Department", "Account", "Sub Account", "Product",
  "Project", "Intercompany", "Location", "Future1", "Future2", "Future3",
];

const expenseTypes = ["Travel", "Meals", "Office Supplies", "Transportation", "Training", "Entertainment", "Other"];
const funds = ["PCF-BKK-001", "PCF-CNX-001", "PCF-HQ-001"];

export default function AccountingInformation({ data, onChange }: Props) {
  const set = (key: keyof AccountingData, val: string) => onChange({ ...data, [key]: val });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Landmark className="h-4 w-4" /> Accounting Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Claimant</Label>
            <Input value={data.claimant} disabled className="h-8 text-sm bg-muted/50" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Department</Label>
            <Input value={data.department} disabled className="h-8 text-sm bg-muted/50" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Expense Type</Label>
            <Select value={data.expenseType} onValueChange={(v) => set("expenseType", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {expenseTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Petty Cash Fund</Label>
            <Select value={data.pettyCashFund} onValueChange={(v) => set("pettyCashFund", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {funds.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Reimbursement Type</Label>
            <Select value={data.reimbursementType} onValueChange={(v) => set("reimbursementType", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Reimburse">Reimburse</SelectItem>
                <SelectItem value="Clear Advance">Clear Advance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Accounting Date</Label>
            <Input type="date" value={data.accountingDate} onChange={(e) => set("accountingDate", e.target.value)} className="h-8 text-sm" />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Input value={data.description} onChange={(e) => set("description", e.target.value)} className="h-8 text-sm" />
        </div>

        {/* 11-Segment Account Combination Preview */}
        <div className="pt-2 border-t">
          <Label className="text-xs font-semibold mb-2 block">🔹 Account Combination Preview (11 Segments)</Label>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1">
            {segmentLabels.map((label, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground min-w-[70px]">{idx + 1}. {label}:</span>
                <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs">
                  {data.segments[idx] || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
