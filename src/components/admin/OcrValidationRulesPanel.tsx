import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useRoles } from "@/lib/role-context";
import { Save, ShieldCheck, Info } from "lucide-react";

interface OcrConfig {
  amountToleranceThb: number;
  amountTolerancePct: number;
  dateToleranceDays: number;
}

const DEFAULTS: OcrConfig = {
  amountToleranceThb: 1,
  amountTolerancePct: 0.5,
  dateToleranceDays: 3,
};

export default function OcrValidationRulesPanel() {
  const { toast } = useToast();
  const { roles } = useRoles();
  const isAdmin = roles.includes("Admin");

  const [config, setConfig] = useState<OcrConfig>({ ...DEFAULTS });
  const [lastUpdated] = useState("2026-03-18 14:32");
  const [updatedBy] = useState("สมชาย ใจดี");

  const update = (field: keyof OcrConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

  const handleSave = () => {
    // Clamp values
    const saved: OcrConfig = {
      amountToleranceThb: clamp(config.amountToleranceThb, 0, 9999),
      amountTolerancePct: clamp(config.amountTolerancePct, 0, 100),
      dateToleranceDays: clamp(config.dateToleranceDays, 0, 30),
      ocrConfidenceThreshold: clamp(config.ocrConfidenceThreshold, 0, 100),
    };
    setConfig(saved);
    toast({ title: "OCR validation rules updated successfully" });
  };

  const handleReset = () => {
    setConfig({ ...DEFAULTS });
    toast({ title: "Settings reset to defaults" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">OCR Validation Rules</h2>
        <p className="text-sm text-muted-foreground">
          Configure tolerance thresholds for document matching during OCR validation.
        </p>
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Read-only view — only Finance Manager or IT Admin can edit these settings.</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Amount Matching</CardTitle>
          <CardDescription>Configure tolerance for matching invoice amounts against bank transactions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amt-thb">Amount Tolerance (THB)</Label>
              <div className="relative">
                <Input
                  id="amt-thb"
                  type="number"
                  min={0}
                  max={9999}
                  step={0.01}
                  value={config.amountToleranceThb}
                  onChange={(e) => update("amountToleranceThb", parseFloat(e.target.value) || 0)}
                  disabled={!isAdmin}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">THB</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amt-pct">Amount Tolerance (%)</Label>
              <div className="relative">
                <Input
                  id="amt-pct"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={config.amountTolerancePct}
                  onChange={(e) => update("amountTolerancePct", parseFloat(e.target.value) || 0)}
                  disabled={!isAdmin}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            System uses whichever tolerance is greater (absolute THB or % of transaction amount)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date Matching</CardTitle>
          <CardDescription>Configure tolerance for matching invoice dates against bank transaction dates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="date-days">Date Tolerance (Days)</Label>
            <div className="relative">
              <Input
                id="date-days"
                type="number"
                min={0}
                max={30}
                step={1}
                value={config.dateToleranceDays}
                onChange={(e) => update("dateToleranceDays", parseInt(e.target.value) || 0)}
                disabled={!isAdmin}
                className="pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">days</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Max number of days difference allowed between invoice date and bank transaction date
          </p>
        </CardContent>
      </Card>


      {isAdmin && (
        <div className="flex items-center gap-3">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}

      <Separator />

      <p className="text-xs text-muted-foreground">
        Last updated: {lastUpdated} by {updatedBy}
      </p>
    </div>
  );
}
