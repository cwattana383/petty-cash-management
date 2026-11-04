import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatBEDate } from "@/lib/utils";

export function LibraryDatePicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" aria-label={label} className="w-[160px] justify-between font-normal">
          <span>{selected ? formatBEDate(selected) : ""}</span><CalendarDays className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selected} defaultMonth={selected} initialFocus
          formatters={{ formatCaption: (date) => `${format(date, "MMMM")} ${date.getFullYear() + 543}` }}
          onSelect={(date) => { onChange(date ? format(date, "yyyy-MM-dd") : ""); setOpen(false); }} />
      </PopoverContent>
    </Popover>
  );
}