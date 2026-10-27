import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CARD_REGISTER_LOCATIONS } from "@/lib/card-register-utils";

export default function CardRegisterLocationPicker({ value, onChange, label, range = false }: {
  value?: string;
  onChange: (code: string) => void;
  label: string;
  range?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = CARD_REGISTER_LOCATIONS.find((location) => location.code === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-label={label} aria-expanded={open} className="w-full justify-between font-normal bg-background rounded-lg min-w-0">
          <span className="truncate">{selected ? `${selected.code} ${selected.name}` : range ? label : ""}</span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[300px]" align="start">
        <Command>
          <CommandInput aria-label="Search locations" {...(range ? { placeholder: "ค้นหาสาขา..." } : {})} />
          <CommandList className="max-h-60">
            <CommandEmpty>No locations found</CommandEmpty>
            <CommandGroup>
              {CARD_REGISTER_LOCATIONS.map((location) => (
                <CommandItem key={location.code} value={`${location.code} ${location.name}`} onSelect={() => { onChange(location.code); setOpen(false); }}>
                  {location.code} {location.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}