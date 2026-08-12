import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Lock } from "lucide-react";

interface Props {
  employeeName?: string;
  last4Digit?: string;
  cardHolderName?: string;
  onChangeLast4?: (val: string) => void;
  onChangeHolder?: (val: string) => void;
  readOnly?: boolean;
  required?: boolean;
  showErrors?: boolean;
}

const CARD_ROWS = [
  { type: "Fleet Card", last4: "4821", status: "Active" },
  { type: "Credit Card", last4: "7390", status: "Suspended" },
  { type: "Fleet Card", last4: "1156", status: "Expired" },
];

export default function CreditCardTab(_props: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-5 w-5 text-primary" />
          Card information
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[12px] font-normal text-muted-foreground">
            <Lock className="h-3 w-3" />
            Read only
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <div
            className="grid gap-3 border-t border-border px-1 py-3 text-[12px] text-muted-foreground"
            style={{ gridTemplateColumns: "1fr 1.2fr 1fr", borderTopWidth: "0.5px" }}
          >
            <div>Card type</div>
            <div>Card number (last 4 digits)</div>
            <div>Card status</div>
          </div>
          {CARD_ROWS.map((row) => (
            <div
              key={`${row.type}-${row.last4}`}
              className="grid gap-3 border-t border-border px-1 py-3 text-[14px] text-foreground"
              style={{ gridTemplateColumns: "1fr 1.2fr 1fr", borderTopWidth: "0.5px" }}
            >
              <div>{row.type}</div>
              <div className="font-mono">{row.last4}</div>
              <div>{row.status}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
