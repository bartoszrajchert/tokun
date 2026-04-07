import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { ChevronsUpDown } from "lucide-react";

export type DropdownItem = {
  value: string;
  label: string;
};

export function Dropdown({
  id,
  label,
  placeholder,
  value,
  setValue,
  items,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  setValue: (format: string) => void;
  items: Array<string | DropdownItem>;
}) {
  const normalizedItems = items.map((item) =>
    typeof item === "string"
      ? {
          value: item,
          label: item,
        }
      : item,
  );

  const selectedItem = normalizedItems.find((item) => item.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <Label htmlFor={id}>{label}</Label>
          <Button
            id={id}
            variant="outline"
            type="button"
            className="mt-1 w-full justify-between"
          >
            {selectedItem ? selectedItem.label : placeholder} <ChevronsUpDown />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
          {normalizedItems.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
