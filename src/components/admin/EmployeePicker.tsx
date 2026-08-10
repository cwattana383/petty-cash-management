import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { EMPLOYEE_DIRECTORY, employeeFullName, type DirectoryEmployee } from "@/lib/employee-directory-mock-data";

interface Props {
  value?: string;
  onSelect: (employee: DirectoryEmployee) => void;
  className?: string;
}

export default function EmployeePicker({ value, onSelect, className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    const list = !q
      ? EMPLOYEE_DIRECTORY
      : EMPLOYEE_DIRECTORY.filter((e) =>
          [e.employeeId, e.firstName, e.lastName].some((f) => f.toLowerCase().includes(q)),
        );
    return list.slice(0, 50);
  }, [debounced]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between font-normal ${className ?? ""}`}
        >
          <span className={value ? "" : "text-muted-foreground"}>
            {value || "Search by employee ID, first name or last name"}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by employee ID, first name or last name"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-72">
            <CommandEmpty>No employees found</CommandEmpty>
            <CommandGroup>
              {results.map((e) => (
                <CommandItem
                  key={e.employeeId}
                  value={e.employeeId}
                  onSelect={() => {
                    onSelect(e);
                    setOpen(false);
                  }}
                  className="flex items-start gap-2"
                >
                  <Check className={`h-4 w-4 mt-0.5 ${value === e.employeeId ? "opacity-100" : "opacity-0"}`} />
                  <span className="flex flex-col">
                    <span className="font-semibold">{employeeFullName(e)}</span>
                    <span className="text-xs text-muted-foreground">
                      {e.employeeId} · {e.department}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
