import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { costCenters } from "@/lib/mock-data";

const purposeCategories = [
  "Travel",
  "Gift Voucher",
  "Petty Cash",
  "Marketing Event",
  "Training",
  "Other",
];

const purposeSubCategories: Record<string, string[]> = {
  Travel: ["Domestic", "International"],
  "Gift Voucher": ["Customer Gift", "Employee Gift", "Promotion"],
  "Petty Cash": ["Office Supplies", "Miscellaneous"],
  "Marketing Event": ["Exhibition", "Seminar", "Road Show"],
  Training: ["Internal", "External"],
  Other: ["Other"],
};

const payToOptions = ["Employee", "Vendor", "Company"];

export interface AdvanceData {
  purposeCategory: string;
  purposeSubCategory: string;
  payTo: string;
  expectationDate: Date | undefined;
  numberOfGiftVoucher: number;
  divisionGL: string;
  description: string;
  cc: string;
  name: string;
  amountIncVat: number;
  withholdingTax: number;
  paidAmount: number;
  fee: number;
}

interface AdvanceInfoProps {
  data: AdvanceData;
  onChange: (data: AdvanceData) => void;
  errors: Record<string, string>;
}

export default function AdvanceInformation({ data, onChange, errors }: AdvanceInfoProps) {
  const subCats = data.purposeCategory ? purposeSubCategories[data.purposeCategory] || [] : [];
  const showGiftVoucher = data.purposeCategory === "Gift Voucher";

  // Calculate paid amount
  useEffect(() => {
    const paid = Math.max(0, data.amountIncVat - data.withholdingTax - data.fee);
    if (paid !== data.paidAmount) {
      onChange({ ...data, paidAmount: paid });
    }
  }, [data.amountIncVat, data.withholdingTax, data.fee]);

  const update = (field: keyof AdvanceData, value: any) => {
    const newData = { ...data, [field]: value };
    // Reset sub category when category changes
    if (field === "purposeCategory") {
      newData.purposeSubCategory = "";
      newData.numberOfGiftVoucher = 0;
    }
    onChange(newData);
  };

  const formatCurrency = (val: number) => val.toFixed(2);

  const handleNumberInput = (field: keyof AdvanceData, val: string) => {
    const num = parseFloat(val) || 0;
    update(field, Math.max(0, num));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Expense Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
          {/* Left column */}
          <div className="space-y-4">
            <div>
              <Label>Purpose Category *</Label>
              <Select value={data.purposeCategory} onValueChange={(v) => update("purposeCategory", v)}>
                <SelectTrigger className={errors.purposeCategory ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {purposeCategories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.purposeCategory && <p className="text-xs text-destructive mt-1">{errors.purposeCategory}</p>}
            </div>

            <div>
              <Label>Pay To *</Label>
              <Select value={data.payTo} onValueChange={(v) => update("payTo", v)}>
                <SelectTrigger className={errors.payTo ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {payToOptions.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payTo && <p className="text-xs text-destructive mt-1">{errors.payTo}</p>}
            </div>

            <div>
              <Label>Expectation Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.expectationDate && "text-muted-foreground",
                      errors.expectationDate && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.expectationDate ? format(data.expectationDate, "dd/MM/yyyy") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.expectationDate}
                    onSelect={(d) => update("expectationDate", d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {errors.expectationDate && <p className="text-xs text-destructive mt-1">{errors.expectationDate}</p>}
            </div>

            {showGiftVoucher && (
              <div>
                <Label>Number of Gift Voucher (Book)</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.numberOfGiftVoucher || ""}
                  onChange={(e) => handleNumberInput("numberOfGiftVoucher", e.target.value)}
                />
              </div>
            )}

            <div>
              <Label>Division (GL)</Label>
              <Input value={data.divisionGL || "-"} disabled />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={data.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Type a value"
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label>CC</Label>
              <div className="flex gap-2">
                <Input
                  value={data.cc}
                  onChange={(e) => update("cc", e.target.value)}
                  placeholder="Type a value"
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-2" align="end">
                    <p className="text-xs text-muted-foreground mb-2">Select Cost Center</p>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {costCenters.map((cc) => (
                        <Button
                          key={cc}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => update("cc", cc)}
                        >
                          {cc}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div>
              <Label>Purpose Sub Category *</Label>
              <Select
                value={data.purposeSubCategory}
                onValueChange={(v) => update("purposeSubCategory", v)}
                disabled={subCats.length === 0}
              >
                <SelectTrigger className={errors.purposeSubCategory ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {subCats.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.purposeSubCategory && <p className="text-xs text-destructive mt-1">{errors.purposeSubCategory}</p>}
            </div>

            <div>
              <Label>Name</Label>
              <Input value={data.name || "-"} onChange={(e) => update("name", e.target.value)} />
            </div>

            <div>
              <Label>Amount (Include Vat) *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={data.amountIncVat || ""}
                onChange={(e) => handleNumberInput("amountIncVat", e.target.value)}
                className={errors.amountIncVat ? "border-destructive" : ""}
              />
              {errors.amountIncVat && <p className="text-xs text-destructive mt-1">{errors.amountIncVat}</p>}
            </div>

            <div>
              <Label>Withholding Tax Amount</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={data.withholdingTax || ""}
                onChange={(e) => handleNumberInput("withholdingTax", e.target.value)}
              />
            </div>

            <div>
              <Label>Paid Amount</Label>
              <Input value={formatCurrency(data.paidAmount)} disabled />
            </div>

            <div>
              <Label>Fee</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={data.fee || ""}
                onChange={(e) => handleNumberInput("fee", e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
