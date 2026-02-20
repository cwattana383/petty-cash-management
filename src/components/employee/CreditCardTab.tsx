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
}

export default function CreditCardTab({
  employeeName,
  last4Digit = "",
  cardHolderName,
  onChangeLast4,
  onChangeHolder,
}: Props) {
  const holder = cardHolderName ?? employeeName;

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
            <Label>Credit Card Number (Last 4 Digits)</Label>
            <Input
              maxLength={4}
              placeholder="0000"
              value={last4Digit}
              onChange={(e) => {
                if (/^\d{0,4}$/.test(e.target.value)) onChangeLast4?.(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Cardholder Name</Label>
            <Input
              placeholder="ชื่อบนบัตร"
              value={holder}
              onChange={(e) => onChangeHolder?.(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
