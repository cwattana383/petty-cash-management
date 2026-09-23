import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronDown, FileSpreadsheet, RotateCcw, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { STORE_LOCATIONS } from "@/lib/card-request-types";

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const ALL_LOCATIONS = "ALL";

type TaxMonth = { month: number; year: number } | null;

function currentTaxMonth(): TaxMonth {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}

function formatTaxMonth(v: TaxMonth) {
  if (!v) return "";
  return `${THAI_MONTHS[v.month]} ${v.year + 543}`;
}

export default function InputVatReportPanel() {
  const [taxMonth, setTaxMonth] = useState<TaxMonth>(currentTaxMonth());
  const [cardType, setCardType] = useState<string>("Fleet Card");
  const [location, setLocation] = useState<string>(ALL_LOCATIONS);
  const [errors, setErrors] = useState<{ taxMonth?: string; cardType?: string }>({});
  const [monthOpen, setMonthOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);

  const nowYear = new Date().getFullYear();
  const years = [nowYear - 2, nowYear - 1, nowYear, nowYear + 1];

  const selectedLocationLabel =
    location === ALL_LOCATIONS
      ? "All Locations"
      : (() => {
          const s = STORE_LOCATIONS.find((l) => l.storeCode === location);
          return s ? `${s.storeCode} – ${s.name}` : "All Locations";
        })();

  const handleReset = () => {
    setTaxMonth(currentTaxMonth());
    setCardType("Fleet Card");
    setLocation(ALL_LOCATIONS);
    setErrors({});
  };

  const handleGenerate = () => {
    const next: { taxMonth?: string; cardType?: string } = {};
    if (!taxMonth) next.taxMonth = "Please select a tax month.";
    if (!cardType) next.cardType = "Please select a card type.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    toast({ description: "Report parameters submitted successfully." });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-primary/10 p-2">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Input VAT Report <span className="text-muted-foreground font-normal">รายงานภาษีซื้อ</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Select the report parameters to generate the Input VAT Report.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tax Month */}
            <div className="space-y-2">
              <Label>
                Tax Month (เดือนภาษี) <span className="text-destructive">*</span>
              </Label>
              <Popover open={monthOpen} onOpenChange={setMonthOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={monthOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className={taxMonth ? "" : "text-muted-foreground"}>
                      {formatTaxMonth(taxMonth)}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-3" align="start">
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={String(taxMonth?.month ?? "")}
                      onValueChange={(v) =>
                        setTaxMonth((p) => ({
                          month: Number(v),
                          year: p?.year ?? nowYear,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {THAI_MONTHS.map((m, i) => (
                          <SelectItem key={m} value={String(i)}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={String(taxMonth?.year ?? "")}
                      onValueChange={(v) =>
                        setTaxMonth((p) => ({
                          month: p?.month ?? new Date().getMonth(),
                          year: Number(v),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {years.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y + 543}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>
              {errors.taxMonth && (
                <p className="text-xs text-destructive">{errors.taxMonth}</p>
              )}
            </div>

            {/* Card Type */}
            <div className="space-y-2">
              <Label>
                Card Type <span className="text-destructive">*</span>
              </Label>
              <Select value={cardType} onValueChange={setCardType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="Corporate Credit Card">Corporate Credit Card</SelectItem>
                  <SelectItem value="Fleet Card">Fleet Card</SelectItem>
                </SelectContent>
              </Select>
              {errors.cardType && (
                <p className="text-xs text-destructive">{errors.cardType}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location (สาขาที่)</Label>
              <Popover open={locOpen} onOpenChange={setLocOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={locOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">{selectedLocationLabel}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                  <Command>
                    <CommandInput placeholder="Search by location code or name" />
                    <CommandList className="max-h-72">
                      <CommandEmpty>No locations found</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Locations"
                          onSelect={() => {
                            setLocation(ALL_LOCATIONS);
                            setLocOpen(false);
                          }}
                        >
                          All Locations
                        </CommandItem>
                        {STORE_LOCATIONS.map((s) => (
                          <CommandItem
                            key={s.storeCode}
                            value={`${s.storeCode} ${s.name}`}
                            onSelect={() => {
                              setLocation(s.storeCode);
                              setLocOpen(false);
                            }}
                          >
                            {s.storeCode} – {s.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleGenerate}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
