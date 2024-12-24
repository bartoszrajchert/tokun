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

export function Dropdown({
  label,
  placeholder,
  value,
  setValue,
  items,
}: {
  label: string;
  placeholder: string;
  value: string;
  setValue: (format: string) => void;
  items: string[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <Label htmlFor="formatButton">{label}</Label>
          <Button
            id="formatButton"
            variant="outline"
            className="w-full justify-between mt-1"
          >
            {value ? value : placeholder} <ChevronsUpDown />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
          {items.map((formatName) => (
            <DropdownMenuRadioItem key={formatName} value={formatName}>
              {formatName}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
