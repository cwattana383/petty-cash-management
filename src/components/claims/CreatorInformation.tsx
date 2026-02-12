import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreatorInfoProps {
  employee: string;
  store: string;
  company: string;
  telephone: string;
  email: string;
  division: string;
  onTelephoneChange: (value: string) => void;
}

export default function CreatorInformation({
  employee,
  store,
  company,
  telephone,
  email,
  division,
  onTelephoneChange,
}: CreatorInfoProps) {
  const handleTelChange = (val: string) => {
    // Allow only digits and dashes
    if (val === "" || /^[\d-]*$/.test(val)) {
      onTelephoneChange(val);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Creator Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label>Employee</Label>
          <Input value={employee} disabled />
        </div>
        <div>
          <Label>Store / Head Office</Label>
          <Input value={store} disabled />
        </div>
        <div>
          <Label>Company</Label>
          <Input value={company} disabled />
        </div>
        <div>
          <Label>Telephone</Label>
          <Input
            value={telephone}
            onChange={(e) => handleTelChange(e.target.value)}
            placeholder="Type a value"
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={email} disabled />
        </div>
        <div>
          <Label>Division</Label>
          <Input value={division} disabled />
        </div>
      </CardContent>
    </Card>
  );
}
