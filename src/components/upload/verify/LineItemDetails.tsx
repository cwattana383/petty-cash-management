import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ListOrdered } from "lucide-react";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  expenseCategory: string;
  glAccount: string;
  costCenter: string;
  projectCode: string;
}

interface Props {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
}

const expenseCategories = ["Travel", "Meals", "Office Supplies", "Transportation", "Training", "Entertainment", "Communication", "Other"];
const costCenters = ["CC-SALES-01", "CC-MKT-01", "CC-ENG-01", "CC-HR-01", "CC-FIN-01"];

export default function LineItemDetails({ lines, onChange }: Props) {
  const addLine = () => {
    onChange([
      ...lines,
      {
        id: `line-${Date.now()}`,
        description: "",
        quantity: 1,
        unitPrice: 0,
        lineAmount: 0,
        expenseCategory: "",
        glAccount: "",
        costCenter: "",
        projectCode: "",
      },
    ]);
  };

  const removeLine = (id: string) => onChange(lines.filter((l) => l.id !== id));

  const updateLine = (id: string, key: keyof LineItem, val: string | number) => {
    onChange(
      lines.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [key]: val };
        if (key === "quantity" || key === "unitPrice") {
          updated.lineAmount = Math.round(updated.quantity * updated.unitPrice * 100) / 100;
        }
        // Auto-map GL account based on expense category
        if (key === "expenseCategory") {
          const glMap: Record<string, string> = {
            Travel: "6110-00", Meals: "6120-00", "Office Supplies": "6130-00",
            Transportation: "6140-00", Training: "6150-00", Entertainment: "6160-00",
            Communication: "6170-00", Other: "6190-00",
          };
          updated.glAccount = glMap[val as string] || "";
        }
        return updated;
      })
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ListOrdered className="h-4 w-4" /> Line Item Details
          </CardTitle>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addLine}>
            <Plus className="h-3 w-3" /> Add Line
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No line items yet. Click "Add Line" to add.
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-8">#</TableHead>
                  <TableHead className="text-xs min-w-[140px]">Description</TableHead>
                  <TableHead className="text-xs w-16">Qty</TableHead>
                  <TableHead className="text-xs w-24">Unit Price</TableHead>
                  <TableHead className="text-xs w-24">Amount</TableHead>
                  <TableHead className="text-xs min-w-[110px]">Expense Cat.</TableHead>
                  <TableHead className="text-xs w-20">GL Acct</TableHead>
                  <TableHead className="text-xs min-w-[110px]">Cost Center</TableHead>
                  <TableHead className="text-xs w-20">Project</TableHead>
                  <TableHead className="text-xs w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, idx) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <Input className="h-7 text-xs" value={line.description} onChange={(e) => updateLine(line.id, "description", e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input className="h-7 text-xs" type="number" value={line.quantity || ""} onChange={(e) => updateLine(line.id, "quantity", parseFloat(e.target.value) || 0)} />
                    </TableCell>
                    <TableCell>
                      <Input className="h-7 text-xs" type="number" value={line.unitPrice || ""} onChange={(e) => updateLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)} />
                    </TableCell>
                    <TableCell className="text-xs font-medium">{line.lineAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Select value={line.expenseCategory} onValueChange={(v) => updateLine(line.id, "expenseCategory", v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{line.glAccount || "—"}</TableCell>
                    <TableCell>
                      <Select value={line.costCenter} onValueChange={(v) => updateLine(line.id, "costCenter", v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {costCenters.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input className="h-7 text-xs" value={line.projectCode} onChange={(e) => updateLine(line.id, "projectCode", e.target.value)} placeholder="Optional" />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLine(line.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
