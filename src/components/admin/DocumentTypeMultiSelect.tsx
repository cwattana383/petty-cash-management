import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { ChevronsUpDown, X } from "lucide-react";

interface Props {
  label: string;
  items: { id: string; documentName: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export default function DocumentTypeMultiSelect({ label, items, selectedIds, onToggle, onRemove, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const selected = items.filter((d) => selectedIds.includes(d.id));

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {disabled ? (
        <div className="flex flex-wrap gap-1 min-h-[2rem] items-center">
          {selected.length === 0 ? (
            <span className="text-xs text-muted-foreground">None</span>
          ) : (
            selected.map((d) => (
              <Badge key={d.id} variant="secondary" className="text-xs">{d.documentName}</Badge>
            ))
          )}
        </div>
      ) : (
        <>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between text-sm font-normal">
                {selected.length === 0 ? `Select ${label.toLowerCase()}...` : `${selected.length} selected`}
                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
                <CommandList>
                  <CommandEmpty>No items found.</CommandEmpty>
                  {items.map((d) => (
                    <CommandItem key={d.id} onSelect={() => onToggle(d.id)} className="flex items-center gap-2">
                      <Checkbox checked={selectedIds.includes(d.id)} />
                      <span className="text-sm">{d.documentName}</span>
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selected.map((d) => (
                <Badge key={d.id} variant="secondary" className="text-xs gap-1">
                  {d.documentName}
                  <button type="button" onClick={() => onRemove(d.id)} className="ml-0.5 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
