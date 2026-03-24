import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBEDate } from "@/lib/utils";

type OcrStatus = "match" | "partial" | "none" | "corrected";

interface OcrField {
  field: string;
  value: string;
  status: OcrStatus;
}

const overrideReasons = ["OCR misread", "Blurry scan", "Incorrect extraction", "Other"];

interface Props {
  drawerItem: {
    id: string;
    merchantName: string;
    amount: string;
    date: string;
  };
}

export default function OcrExtractedDataCard({ drawerItem }: Props) {
  const initialFields: OcrField[] = [
    { field: "Tax ID (เลขผู้เสียภาษี)", value: "0105556176009", status: "match" },
    { field: "Buyer Name", value: drawerItem.merchantName, status: "match" },
    { field: "Buyer Address", value: "123 Sukhumvit Rd., Khlong Toei, Bangkok 10110", status: "partial" },
    { field: "Invoice Amount", value: drawerItem.amount, status: "match" },
    { field: "Invoice Date", value: formatBEDate(drawerItem.date), status: "match" },
    { field: "Invoice Number", value: "INV-" + drawerItem.id.slice(-6), status: "none" },
  ];

  const [fields, setFields] = useState<OcrField[]>(initialFields);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(fields[index].value);
    setOverrideReason("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
    setOverrideReason("");
  };

  const saveEdit = (index: number) => {
    if (!overrideReason) return;
    setFields((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, value: editValue, status: "corrected" as OcrStatus } : f
      )
    );
    cancelEdit();
  };

  const renderStatusBadge = (status: OcrStatus) => {
    switch (status) {
      case "match":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">✅ Match</Badge>;
      case "partial":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">⚠️ Partial Match</Badge>;
      case "corrected":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">✏️ Manually Corrected</Badge>;
      case "none":
        return <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">—</Badge>;
    }
  };

  return (
    <div className="mx-4 mb-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">AI Extracted Data — Please Review</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Field</TableHead>
                <TableHead className="text-xs">Value</TableHead>
                <TableHead className="text-xs text-right">Status</TableHead>
                <TableHead className="text-xs w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((row, idx) => (
                <TableRow key={row.field}>
                  <TableCell className="text-xs font-medium py-2 align-top">{row.field}</TableCell>
                  <TableCell className="text-xs py-2 align-top">
                    {editingIndex === idx ? (
                      <div className="space-y-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-7 text-xs"
                        />
                        <Select value={overrideReason} onValueChange={setOverrideReason}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Override Reason..." />
                          </SelectTrigger>
                          <SelectContent>
                            {overrideReasons.map((r) => (
                              <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className="h-6 text-xs px-2"
                            disabled={!overrideReason}
                            onClick={() => saveEdit(idx)}
                          >
                            <Check className="h-3 w-3 mr-1" /> Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs px-2"
                            onClick={cancelEdit}
                          >
                            <X className="h-3 w-3 mr-1" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <span>{row.value}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-2 align-top">
                    {editingIndex !== idx && renderStatusBadge(row.status)}
                  </TableCell>
                  <TableCell className="py-2 align-top">
                    {editingIndex !== idx && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => startEdit(idx)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
