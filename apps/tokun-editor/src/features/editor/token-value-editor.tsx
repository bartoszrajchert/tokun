import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isRecord, type TokenType } from "@/lib/token-documents";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const colorSpaces = [
  "srgb",
  "srgb-linear",
  "hsl",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "display-p3",
  "a98-rgb",
  "prophoto-rgb",
  "rec2020",
  "xyz-d65",
  "xyz-d50",
] as const;

const dimensionUnits = ["px", "rem"] as const;
const durationUnits = ["ms", "s"] as const;
const strokeStyles = [
  "solid",
  "dashed",
  "dotted",
  "double",
  "groove",
  "ridge",
  "outset",
  "inset",
] as const;

export function TokenValueEditor({
  type,
  value,
  onChange,
}: {
  type: TokenType | string | undefined;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (type) {
    case "color":
      return <ColorValueEditor value={value} onChange={onChange} />;
    case "dimension":
      return (
        <UnitValueEditor
          label="Dimension"
          value={value}
          units={[...dimensionUnits]}
          defaultUnit="px"
          onChange={onChange}
        />
      );
    case "duration":
      return (
        <UnitValueEditor
          label="Duration"
          value={value}
          units={[...durationUnits]}
          defaultUnit="ms"
          onChange={onChange}
        />
      );
    case "number":
      return <NumberValueEditor value={value} onChange={onChange} />;
    case "fontFamily":
      return <FontFamilyValueEditor value={value} onChange={onChange} />;
    case "fontWeight":
      return (
        <ScalarValueEditor
          label="Font weight"
          value={value}
          onChange={onChange}
        />
      );
    case "cubicBezier":
      return <CubicBezierEditor value={value} onChange={onChange} />;
    case "strokeStyle":
      return <StrokeStyleEditor value={value} onChange={onChange} />;
    default:
      return <JsonFallbackEditor value={value} onChange={onChange} />;
  }
}

function ScalarValueEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  return (
    <Field label={label}>
      <Input
        value={
          typeof value === "string" || typeof value === "number"
            ? String(value)
            : ""
        }
        placeholder="Value or {reference.path}"
        onChange={(event) => onChange(parseLooseScalar(event.target.value))}
      />
    </Field>
  );
}

function NumberValueEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (typeof value === "string") {
    return (
      <ScalarValueEditor
        label="Number reference"
        value={value}
        onChange={onChange}
      />
    );
  }

  return (
    <Field label="Number">
      <Input
        type="number"
        value={typeof value === "number" ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}

function UnitValueEditor({
  label,
  value,
  units,
  defaultUnit,
  onChange,
}: {
  label: string;
  value: unknown;
  units: string[];
  defaultUnit: string;
  onChange: (value: unknown) => void;
}) {
  if (typeof value === "string") {
    return (
      <div className="space-y-2">
        <ScalarValueEditor
          label={`${label} reference`}
          value={value}
          onChange={onChange}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange({ value: 0, unit: defaultUnit })}
        >
          Use numeric value
        </Button>
      </div>
    );
  }

  const unitValue = isRecord(value) ? value : { value: 0, unit: defaultUnit };
  const numericValue =
    typeof unitValue.value === "number"
      ? unitValue.value
      : Number(unitValue.value ?? 0);
  const unit =
    typeof unitValue.unit === "string" ? unitValue.unit : defaultUnit;

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
      <Field label={label}>
        <Input
          type="number"
          value={numericValue}
          onChange={(event) =>
            onChange({ ...unitValue, value: Number(event.target.value), unit })
          }
        />
      </Field>
      <Field label="Unit">
        <Select
          value={unit}
          onValueChange={(value) =>
            onChange({
              ...unitValue,
              value: numericValue,
              unit: value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {units.map((unitOption) => (
              <SelectItem key={unitOption} value={unitOption}>
                {unitOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function ColorValueEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (typeof value === "string") {
    return (
      <div className="space-y-2">
        <ScalarValueEditor
          label="Color value"
          value={value}
          onChange={onChange}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange({
              colorSpace: "srgb",
              components: [0.43, 0.36, 0.99],
              alpha: 1,
              hex: "#6d5dfc",
            })
          }
        >
          Use structured color
        </Button>
      </div>
    );
  }

  const color = isRecord(value)
    ? value
    : { colorSpace: "srgb", components: [0, 0, 0], alpha: 1 };
  const colorSpace =
    typeof color.colorSpace === "string" ? color.colorSpace : "srgb";
  const components = Array.isArray(color.components) ? color.components : [];
  const alpha = typeof color.alpha === "number" ? color.alpha : 1;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Color space">
          <Select
            value={colorSpace}
            onValueChange={(value) => onChange({ ...color, colorSpace: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorSpaces.map((space) => (
                <SelectItem key={space} value={space}>
                  {space}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Alpha">
          <Input
            type="number"
            step="0.01"
            value={alpha}
            onChange={(event) =>
              onChange({ ...color, alpha: Number(event.target.value) })
            }
          />
        </Field>
      </div>
      <Field label="Components">
        <Input
          value={components.join(", ")}
          placeholder="0.43, 0.36, 0.99"
          onChange={(event) =>
            onChange({
              ...color,
              components: parseComponents(event.target.value),
            })
          }
        />
      </Field>
      <Field label="Hex fallback">
        <Input
          value={typeof color.hex === "string" ? color.hex : ""}
          placeholder="#6d5dfc"
          onChange={(event) =>
            onChange({ ...color, hex: event.target.value || undefined })
          }
        />
      </Field>
    </div>
  );
}

function FontFamilyValueEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const text = Array.isArray(value)
    ? value.map((entry) => String(entry)).join(", ")
    : typeof value === "string"
      ? value
      : "";

  return (
    <Field label="Font family">
      <Input
        value={text}
        placeholder="Inter, Arial, sans-serif or {reference.path}"
        onChange={(event) => {
          const next = event.target.value;
          onChange(
            next.includes(",")
              ? next.split(",").map((entry) => entry.trim())
              : next,
          );
        }}
      />
    </Field>
  );
}

function CubicBezierEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (typeof value === "string") {
    return (
      <ScalarValueEditor
        label="Cubic bezier reference"
        value={value}
        onChange={onChange}
      />
    );
  }

  const points = Array.isArray(value) ? value : [0.2, 0, 0, 1];

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {[0, 1, 2, 3].map((index) => (
        <Field key={index} label={`Point ${index + 1}`}>
          <Input
            type="number"
            step="0.01"
            value={typeof points[index] === "number" ? points[index] : 0}
            onChange={(event) => {
              const nextPoints = [...points];
              nextPoints[index] = Number(event.target.value);
              onChange(nextPoints);
            }}
          />
        </Field>
      ))}
    </div>
  );
}

function StrokeStyleEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (typeof value !== "string" || value.startsWith("{")) {
    return <JsonFallbackEditor value={value} onChange={onChange} />;
  }

  return (
    <Field label="Stroke style">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {strokeStyles.map((style) => (
            <SelectItem key={style} value={style}>
              {style}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function JsonFallbackEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));

  useEffect(() => {
    setText(JSON.stringify(value, null, 2));
  }, [value]);

  return (
    <div className="space-y-2">
      <Label>Composite value</Label>
      <Textarea
        className="min-h-40 font-mono text-xs"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          try {
            onChange(JSON.parse(text) as unknown);
          } catch {
            onChange(text);
          }
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange("")}
        >
          <Trash2 size={14} />
          Empty string
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange([])}
        >
          <Plus size={14} />
          Empty array
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function parseLooseScalar(value: string): string | number {
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }

  return value;
}

function parseComponents(value: string): (number | "none")[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => (entry === "none" ? "none" : Number(entry)));
}
