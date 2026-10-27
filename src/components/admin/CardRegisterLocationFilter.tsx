import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CARD_REGISTER_LOCATIONS, matchesCardLocation } from "@/lib/card-register-utils";

export default function CardRegisterLocationFilter({ query, selectedCode, onChange }: {
  query: string;
  selectedCode: string;
  onChange: (query: string, code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const locations = CARD_REGISTER_LOCATIONS.filter((location) => matchesCardLocation(location.code, location.name, selectedCode ? "" : query));
  return (
    <Command shouldFilter={false} className="relative h-10 flex-1 min-w-[240px] overflow-visible rounded-lg border bg-background [&_[cmdk-input-wrapper]]:border-b-0"
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <CommandInput aria-label="Location" placeholder="Location (code or branch name)" className="h-10 pr-7"
        value={query} onFocus={() => setOpen(true)} onValueChange={(value) => { onChange(value, ""); setOpen(true); }}
        onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }} />
      {query && <Button type="button" variant="ghost" size="icon" aria-label="Clear Location" className="absolute right-1 top-1 h-8 w-8"
        onClick={() => { onChange("", ""); setOpen(false); }}><X className="h-3 w-3" /></Button>}
      {open && <CommandList className="absolute top-full left-0 z-50 mt-1 w-full min-w-[300px] max-h-60 rounded-md border bg-popover text-popover-foreground shadow-md">
        <CommandEmpty>ไม่พบสาขา</CommandEmpty>
        <CommandGroup>
          {locations.map((location) => <CommandItem key={location.code} value={`${location.code} ${location.name}`}
            onMouseDown={(event) => event.preventDefault()}
            onSelect={() => { onChange(`${location.code} ${location.name}`, location.code); setOpen(false); }}>
            {location.code} {location.name}
          </CommandItem>)}
        </CommandGroup>
      </CommandList>}
    </Command>
  );
}