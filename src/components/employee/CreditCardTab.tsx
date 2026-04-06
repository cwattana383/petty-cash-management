import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";

interface Props {
  employeeName: string;
  last4Digit?: string;
  cardHolderName?: string;
  onChangeLast4?: (val: string) => void;
  onChangeHolder?: (val: string) => void;
  readOnly?: boolean;
  required?: boolean;
  showErrors?: boolean;
}

export default function CreditCardTab({
  employeeName,
  last4Digit = "",
  cardHolderName,
  onChangeLast4,
  onChangeHolder,
  readOnly,
  required,
  showErrors,
}: Props) {
  const holder = cardHolderName ?? employeeName;
  const last4Error = showErrors && required && !last4Digit;
  const holderError = showErrors && required && !holder.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-5 w-5 text-primary" />
          Credit Card Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Credit Card Number (Last 4 Digits){required && <span className="text-destructive">*</span>}</Label>
            <Input
              maxLength={4}
              placeholder="0000"
              value={last4Digit}
              disabled={readOnly}
              className={last4Error ? "border-destructive focus-visible:ring-destructive" : ""}
              onChange={(e) => {
                if (/^\d{0,4}$/.test(e.target.value)) onChangeLast4?.(e.target.value);
              }}
            />
            {last4Error && <p className="text-sm text-destructive">Please enter the last 4 digits of the card</p>}
          </div>
          <div className="space-y-2">
            <Label>Cardholder Name{required && <span className="text-destructive">*</span>}</Label>
            <Input
              placeholder="Cardholder name on card"
              value={holder}
              disabled={readOnly}
              className={holderError ? "border-destructive focus-visible:ring-destructive" : ""}
              onChange={(e) => onChangeHolder?.(e.target.value)}
            />
            {holderError && <p className="text-sm text-destructive">Please enter the cardholder name</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
