import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ListOrdered } from "lucide-react";

export interface LineItem {
  id: string;
  description: string;
  lineAmount: number;
  expenseCategory: string;
}

interface Props {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
}

const expenseCategories = ["Travel", "Meals", "Office Supplies", "Transportation", "Training", "Entertainment", "Communication", "Other"];

export default function LineItemDetails({ lines, onChange }: Props) {
  const addLine = () => {
    onChange([
      ...lines,
      {
        id: `line-${Date.now()}`,
        description: "",
        lineAmount: 0,
        expenseCategory: "",
      },
    ]);
  };

  const removeLine = (id: string) => onChange(lines.filter((l) => l.id !== id));

  const updateLine = (id: string, key: keyof LineItem, val: string | number) => {
    onChange(
      lines.map((l) => {
        if (l.id !== id) return l;
        return { ...l, [key]: val };
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
                  <TableHead className="text-xs min-w-[180px]">Description</TableHead>
                  <TableHead className="text-xs w-28">Amount</TableHead>
                  <TableHead className="text-xs min-w-[130px]">Expense Category</TableHead>
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
                      <Input className="h-7 text-xs" type="number" value={line.lineAmount || ""} onChange={(e) => updateLine(line.id, "lineAmount", parseFloat(e.target.value) || 0)} />
                    </TableCell>
                    <TableCell>
                      <Select value={line.expenseCategory} onValueChange={(v) => updateLine(line.id, "expenseCategory", v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
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
