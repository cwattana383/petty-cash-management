import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { EXPENSE_TYPE_CONFIG } from "@/lib/expense-type-config";

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateCsv(): string {
  const header = "No.,Expense Type,Sub Expense Type,Policy,Required Documents,Optional Documents";
  const rows = EXPENSE_TYPE_CONFIG.map((item, i) => {
    const reqDocs = item.requiredDocs.length > 0
      ? item.requiredDocs.map((d) => d.label).join("\n")
      : "— (No document required)";
    const optDocs = item.optionalDocs.length > 0
      ? item.optionalDocs.map((d) => d.label).join("\n")
      : "—";
    return [
      String(i + 1),
      item.level1,
      item.level2,
      item.policyRule,
      reqDocs,
      optDocs,
    ].map(escapeCsvField).join(",");
  });
  return [header, ...rows].join("\r\n");
}

export default function AdminExportConfig() {
  const handleDownload = () => {
    const csv = generateCsv();
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "CCC_Config_Export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Button onClick={handleDownload} size="lg" className="gap-2">
        <Download className="h-5 w-5" />
        Download Config as CSV
      </Button>
    </div>
  );
}
