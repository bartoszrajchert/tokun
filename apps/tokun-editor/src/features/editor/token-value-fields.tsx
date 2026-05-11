import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createStructuredColor,
  defaultTokenValue,
  isBuiltInTokenType,
  isRecord,
  normalizeHexColor,
  type TokenReferenceOption,
  type TokenType,
} from "@/lib/token-documents";
import { Check, ChevronsUpDown, Plus, Settings2, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type ValueFieldProps = {
  type: string;
  value: unknown;
  referenceOptions?: TokenReferenceOption[];
  onChange: (value: unknown) => void;
};

type NestedValueFieldProps = ValueFieldProps & {
  label: string;
};

const compositeTypes = new Set<TokenType>([
  "border",
  "transition",
  "shadow",
  "gradient",
  "typography",
]);

const fontWeightOptions = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const strokeStyleOptions = [
  "solid",
  "dashed",
  "dotted",
  "double",
  "groove",
  "ridge",
  "outset",
  "inset",
];
const lineCapOptions = ["butt", "round", "square"];

export function TokenValueControl({
  type,
  value,
  referenceOptions = [],
  onChange,
}: ValueFieldProps) {
  if (isBuiltInTokenType(type) && compositeTypes.has(type)) {
    return (
      <CompositeValueButton
        type={type}
        value={value}
        referenceOptions={referenceOptions}
        onChange={onChange}
      />
    );
  }

  return (
    <TypedValueField
      type={type}
      value={value}
      referenceOptions={referenceOptions}
      onChange={onChange}
    />
  );
}

function NestedValueField({
  label,
  type,
  value,
  referenceOptions = [],
  onChange,
}: NestedValueFieldProps) {
  return (
    <Field label={label}>
      <TypedValueField
        type={type}
        value={value}
        referenceOptions={referenceOptions}
        onChange={onChange}
      />
    </Field>
  );
}

function TypedValueField({
  type,
  value,
  referenceOptions = [],
  onChange,
}: ValueFieldProps) {
  return (
    <ReferenceableValue
      type={type}
      value={value}
      referenceOptions={referenceOptions}
      defaultValue={() => defaultTokenValue(type)}
      onChange={onChange}
    >
      {(literalValue) => (
        <LiteralValueField
          type={type}
          value={literalValue}
          referenceOptions={referenceOptions}
          onChange={onChange}
        />
      )}
    </ReferenceableValue>
  );
}

function LiteralValueField({
  type,
  value,
  referenceOptions = [],
  onChange,
}: ValueFieldProps) {
  if (!isBuiltInTokenType(type)) {
    return <JsonValueField value={value} onChange={onChange} />;
  }

  switch (type) {
    case "color":
      return <ColorField value={value} onChange={onChange} />;
    case "dimension":
      return (
        <UnitField
          value={value}
          units={["px", "rem"]}
          defaultUnit="px"
          onChange={onChange}
        />
      );
    case "duration":
      return (
        <UnitField
          value={value}
          units={["ms", "s"]}
          defaultUnit="ms"
          onChange={onChange}
        />
      );
    case "number":
      return <NumberField value={value} onChange={onChange} />;
    case "fontFamily":
      return <FontFamilyField value={value} onChange={onChange} />;
    case "fontWeight":
      return <FontWeightField value={value} onChange={onChange} />;
    case "cubicBezier":
      return <CubicBezierField value={value} onChange={onChange} />;
    case "strokeStyle":
      return (
        <StrokeStyleField
          value={value}
          referenceOptions={referenceOptions}
          onChange={onChange}
        />
      );
    case "border":
      return (
        <BorderField
          value={value}
          referenceOptions={referenceOptions}
          onChange={onChange}
        />
      );
    case "transition":
      return (
        <TransitionField
          value={value}
          referenceOptions={referenceOptions}
          onChange={onChange}
        />
      );
    case "shadow":
      return (
        <ShadowField
          value={value}
          referenceOptions={referenceOptions}
          onChange={onChange}
        />
      );
    case "gradient":
      return (
        <GradientField
          value={value}
          referenceOptions={referenceOptions}
          onChange={onChange}
        />
      );
    case "typography":
      return (
        <TypographyField
          value={value}
          referenceOptions={referenceOptions}
          onChange={onChange}
        />
      );
  }
}

function ReferenceableValue({
  type,
  value,
  referenceOptions,
  defaultValue,
  onChange,
  children,
}: {
  type: string;
  value: unknown;
  referenceOptions: TokenReferenceOption[];
  defaultValue: () => unknown;
  onChange: (value: unknown) => void;
  children: (value: unknown) => ReactNode;
}) {
  const referenceMode = isReferenceValue(value);
  const typedReferenceOptions = getTypedReferenceOptions(
    type,
    referenceOptions,
  );
  const firstReference = typedReferenceOptions[0]?.reference;

  return (
    <div className="grid gap-2 sm:grid-cols-[7rem_1fr]">
      <Select
        value={referenceMode ? "reference" : "value"}
        onValueChange={(value) => {
          if (value === "reference") {
            if (firstReference) {
              onChange(firstReference);
            }
            return;
          }

          onChange(defaultValue());
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="value">Value</SelectItem>
          <SelectItem value="reference" disabled={!firstReference}>
            Reference
          </SelectItem>
        </SelectContent>
      </Select>
      {referenceMode ? (
        <ReferencePicker
          value={value}
          options={typedReferenceOptions}
          onChange={onChange}
        />
      ) : (
        children(value)
      )}
    </div>
  );
}

function ReferencePicker({
  value,
  placeholder = "Select reference",
  options,
  onChange,
}: {
  value?: `{${string}}`;
  placeholder?: string;
  options: TokenReferenceOption[];
  onChange: (value: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.reference === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-0 justify-between"
          disabled={options.length === 0}
        >
          <span className="truncate">
            {selectedOption?.reference ?? value ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[24rem] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tokens..." />
          <CommandList>
            <CommandEmpty>No matching tokens.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={`${option.fileId}:${option.reference}`}
                  value={`${option.reference} ${option.filePath} ${option.type ?? ""}`}
                  onSelect={() => {
                    onChange(option.reference);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={
                      option.reference === value
                        ? "h-4 w-4 opacity-100"
                        : "h-4 w-4 opacity-0"
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{option.reference}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {option.filePath}
                      {option.type ? ` · ${option.type}` : ""}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ColorField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const hex = getColorHex(value);
  const [hexText, setHexText] = useState(hex);

  useEffect(() => {
    setHexText(hex);
  }, [hex]);

  const updateHex = (nextHex: string) => {
    setHexText(nextHex);

    if (isValidHexColor(nextHex)) {
      onChange(createStructuredColor(nextHex));
    }
  };

  return (
    <div className="grid grid-cols-[2.75rem_1fr] gap-2">
      <Input
        type="color"
        value={hex}
        onChange={(event) => updateHex(event.target.value)}
        aria-label="Color swatch"
      />
      <Input
        value={hexText}
        onChange={(event) => updateHex(event.target.value)}
        onBlur={() =>
          setHexText(
            isValidHexColor(hexText) ? normalizeHexColor(hexText) : hex,
          )
        }
      />
    </div>
  );
}

function UnitField({
  value,
  units,
  defaultUnit,
  onChange,
}: {
  value: unknown;
  units: string[];
  defaultUnit: string;
  onChange: (value: unknown) => void;
}) {
  const unitValue = isRecord(value) ? value : { value: 0, unit: defaultUnit };
  const numericValue =
    typeof unitValue.value === "number"
      ? unitValue.value
      : Number(unitValue.value ?? 0);
  const unit =
    typeof unitValue.unit === "string" ? unitValue.unit : defaultUnit;

  return (
    <div className="grid grid-cols-[1fr_5.5rem] gap-2">
      <Input
        type="number"
        value={numericValue}
        onChange={(event) =>
          onChange({ ...unitValue, value: Number(event.target.value), unit })
        }
      />
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
    </div>
  );
}

function NumberField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  return (
    <Input
      type="number"
      value={typeof value === "number" ? value : Number(value ?? 0)}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

function FontFamilyField({
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
    <Input
      value={text}
      placeholder="Inter, Arial, sans-serif"
      onChange={(event) => {
        const next = event.target.value;
        onChange(
          next.includes(",")
            ? next.split(",").map((entry) => entry.trim())
            : next,
        );
      }}
    />
  );
}

function FontWeightField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const current =
    typeof value === "number" || typeof value === "string" ? value : 400;
  const isPreset =
    typeof current === "number" && fontWeightOptions.includes(current);

  return (
    <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
      <Select
        value={isPreset ? String(current) : "custom"}
        onValueChange={(value) => {
          if (value === "custom") {
            onChange(current);
            return;
          }

          onChange(Number(value));
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fontWeightOptions.map((weight) => (
            <SelectItem key={weight} value={String(weight)}>
              {weight}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      <Input
        value={String(current)}
        onChange={(event) => onChange(parseLooseScalar(event.target.value))}
      />
    </div>
  );
}

function CubicBezierField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const points = Array.isArray(value) ? value : [0.2, 0, 0, 1];

  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {[0, 1, 2, 3].map((index) => (
        <Input
          key={index}
          type="number"
          step="0.01"
          aria-label={`Cubic bezier point ${index + 1}`}
          value={typeof points[index] === "number" ? points[index] : 0}
          onChange={(event) => {
            const nextPoints = [...points];
            nextPoints[index] = Number(event.target.value);
            onChange(nextPoints);
          }}
        />
      ))}
    </div>
  );
}

function StrokeStyleField({
  value,
  referenceOptions = [],
  onChange,
}: {
  value: unknown;
  referenceOptions?: TokenReferenceOption[];
  onChange: (value: unknown) => void;
}) {
  const objectMode = isRecord(value);
  const strokeObject = objectMode
    ? value
    : { dashArray: [{ value: 4, unit: "px" }], lineCap: "butt" };
  const dashArray = Array.isArray(strokeObject.dashArray)
    ? strokeObject.dashArray
    : [];

  return (
    <div className="space-y-3">
      <Select
        value={
          objectMode ? "dash" : typeof value === "string" ? value : "solid"
        }
        onValueChange={(value) => {
          if (value === "dash") {
            onChange(strokeObject);
            return;
          }

          onChange(value);
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {strokeStyleOptions.map((style) => (
            <SelectItem key={style} value={style}>
              {style}
            </SelectItem>
          ))}
          <SelectItem value="dash">Dash pattern</SelectItem>
        </SelectContent>
      </Select>
      {objectMode ? (
        <div className="bg-muted/35 space-y-3 rounded-lg border p-3">
          <Field label="Line cap">
            <Select
              value={
                typeof strokeObject.lineCap === "string"
                  ? strokeObject.lineCap
                  : "butt"
              }
              onValueChange={(value) =>
                onChange({ ...strokeObject, lineCap: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lineCapOptions.map((lineCap) => (
                  <SelectItem key={lineCap} value={lineCap}>
                    {lineCap}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Dash array</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({
                    ...strokeObject,
                    dashArray: [...dashArray, { value: 4, unit: "px" }],
                  })
                }
              >
                <Plus size={14} />
                Dash
              </Button>
            </div>
            {dashArray.map((dash, index) => (
              <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
                <TypedValueField
                  type="dimension"
                  value={dash}
                  referenceOptions={referenceOptions}
                  onChange={(nextDash) => {
                    const nextDashArray = [...dashArray];
                    nextDashArray[index] = nextDash;
                    onChange({ ...strokeObject, dashArray: nextDashArray });
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    onChange({
                      ...strokeObject,
                      dashArray: dashArray.filter(
                        (_, dashIndex) => dashIndex !== index,
                      ),
                    })
                  }
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CompositeValueButton({
  type,
  value,
  referenceOptions = [],
  onChange,
}: ValueFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <ReferenceableValue
      type={type}
      value={value}
      referenceOptions={referenceOptions}
      defaultValue={() => defaultTokenValue(type)}
      onChange={onChange}
    >
      {(literalValue) => (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full min-w-0 justify-start"
            onClick={() => setOpen(true)}
          >
            <Settings2 size={14} />
            <span className="truncate">
              {summarizeValue(type, literalValue)}
            </span>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Edit {type} value</DialogTitle>
                <DialogDescription>
                  Composite values expose typed fields for each nested part.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[62dvh] overflow-auto pr-1">
                <LiteralValueField
                  type={type}
                  value={literalValue}
                  referenceOptions={referenceOptions}
                  onChange={onChange}
                />
              </div>
              <DialogFooter>
                <Button type="button" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </ReferenceableValue>
  );
}

function BorderField({
  value,
  referenceOptions = [],
  onChange,
}: {
  value: unknown;
  referenceOptions?: TokenReferenceOption[];
  onChange: (value: unknown) => void;
}) {
  const border = isRecord(value)
    ? value
    : (defaultTokenValue("border") as Record<string, unknown>);

  return (
    <div className="space-y-4">
      <NestedValueField
        label="Width"
        type="dimension"
        value={border.width}
        referenceOptions={referenceOptions}
        onChange={(width) => onChange({ ...border, width })}
      />
      <NestedValueField
        label="Style"
        type="strokeStyle"
        value={border.style}
        referenceOptions={referenceOptions}
        onChange={(style) => onChange({ ...border, style })}
      />
      <NestedValueField
        label="Color"
        type="color"
        value={border.color}
        referenceOptions={referenceOptions}
        onChange={(color) => onChange({ ...border, color })}
      />
    </div>
  );
}

function TransitionField({
  value,
  referenceOptions = [],
  onChange,
}: {
  value: unknown;
  referenceOptions?: TokenReferenceOption[];
  onChange: (value: unknown) => void;
}) {
  const transition = isRecord(value)
    ? value
    : (defaultTokenValue("transition") as Record<string, unknown>);

  return (
    <div className="space-y-4">
      <NestedValueField
        label="Duration"
        type="duration"
        value={transition.duration}
        referenceOptions={referenceOptions}
        onChange={(duration) => onChange({ ...transition, duration })}
      />
      <NestedValueField
        label="Delay"
        type="duration"
        value={transition.delay}
        referenceOptions={referenceOptions}
        onChange={(delay) => onChange({ ...transition, delay })}
      />
      <NestedValueField
        label="Timing function"
        type="cubicBezier"
        value={transition.timingFunction}
        referenceOptions={referenceOptions}
        onChange={(timingFunction) =>
          onChange({ ...transition, timingFunction })
        }
      />
    </div>
  );
}

function ShadowField({
  value,
  referenceOptions = [],
  onChange,
}: {
  value: unknown;
  referenceOptions?: TokenReferenceOption[];
  onChange: (value: unknown) => void;
}) {
  const originalIsArray = Array.isArray(value);
  const shadows = normalizeShadowList(value);

  const updateShadows = (nextShadows: Record<string, unknown>[]) => {
    onChange(
      originalIsArray || nextShadows.length > 1
        ? nextShadows
        : (nextShadows[0] ?? defaultShadowValue()),
    );
  };

  return (
    <div className="space-y-3">
      {shadows.map((shadow, index) => (
        <div
          key={index}
          className="bg-muted/35 space-y-4 rounded-lg border p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Shadow {index + 1}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                updateShadows(
                  shadows.filter((_, shadowIndex) => shadowIndex !== index),
                )
              }
            >
              <Trash2 size={14} />
              Remove
            </Button>
          </div>
          <NestedValueField
            label="Color"
            type="color"
            value={shadow.color}
            referenceOptions={referenceOptions}
            onChange={(color) =>
              updateShadow(index, { ...shadow, color }, shadows, updateShadows)
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            <NestedValueField
              label="Offset X"
              type="dimension"
              value={shadow.offsetX}
              referenceOptions={referenceOptions}
              onChange={(offsetX) =>
                updateShadow(
                  index,
                  { ...shadow, offsetX },
                  shadows,
                  updateShadows,
                )
              }
            />
            <NestedValueField
              label="Offset Y"
              type="dimension"
              value={shadow.offsetY}
              referenceOptions={referenceOptions}
              onChange={(offsetY) =>
                updateShadow(
                  index,
                  { ...shadow, offsetY },
                  shadows,
                  updateShadows,
                )
              }
            />
            <NestedValueField
              label="Blur"
              type="dimension"
              value={shadow.blur}
              referenceOptions={referenceOptions}
              onChange={(blur) =>
                updateShadow(index, { ...shadow, blur }, shadows, updateShadows)
              }
            />
            <NestedValueField
              label="Spread"
              type="dimension"
              value={shadow.spread}
              referenceOptions={referenceOptions}
              onChange={(spread) =>
                updateShadow(
                  index,
                  { ...shadow, spread },
                  shadows,
                  updateShadows,
                )
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shadow.inset === true}
              onChange={(event) =>
                updateShadow(
                  index,
                  { ...shadow, inset: event.target.checked || undefined },
                  shadows,
                  updateShadows,
                )
              }
            />
            Inset
          </label>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => updateShadows([...shadows, defaultShadowValue()])}
      >
        <Plus size={14} />
        Add shadow
      </Button>
    </div>
  );
}

function GradientField({
  value,
  referenceOptions = [],
  onChange,
}: {
  value: unknown;
  referenceOptions?: TokenReferenceOption[];
  onChange: (value: unknown) => void;
}) {
  const stops = Array.isArray(value)
    ? value.map((stop) => (isRecord(stop) ? stop : defaultGradientStop()))
    : [defaultGradientStop()];

  const updateStop = (index: number, stop: Record<string, unknown>) => {
    const nextStops = [...stops];
    nextStops[index] = stop;
    onChange(nextStops);
  };

  return (
    <div className="space-y-3">
      {stops.map((stop, index) => (
        <div
          key={index}
          className="bg-muted/35 grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_8rem_auto] md:items-end"
        >
          <NestedValueField
            label={`Stop ${index + 1} color`}
            type="color"
            value={stop.color}
            referenceOptions={referenceOptions}
            onChange={(color) => updateStop(index, { ...stop, color })}
          />
          <Field label="Position">
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={
                typeof stop.position === "number"
                  ? stop.position
                  : Number(stop.position ?? 0)
              }
              onChange={(event) =>
                updateStop(index, {
                  ...stop,
                  position: Number(event.target.value),
                })
              }
            />
          </Field>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() =>
              onChange(stops.filter((_, stopIndex) => stopIndex !== index))
            }
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange([...stops, defaultGradientStop()])}
      >
        <Plus size={14} />
        Add stop
      </Button>
    </div>
  );
}

function TypographyField({
  value,
  referenceOptions = [],
  onChange,
}: {
  value: unknown;
  referenceOptions?: TokenReferenceOption[];
  onChange: (value: unknown) => void;
}) {
  const typography = isRecord(value)
    ? value
    : (defaultTokenValue("typography") as Record<string, unknown>);

  return (
    <div className="space-y-4">
      <NestedValueField
        label="Font family"
        type="fontFamily"
        value={typography.fontFamily}
        referenceOptions={referenceOptions}
        onChange={(fontFamily) => onChange({ ...typography, fontFamily })}
      />
      <NestedValueField
        label="Font size"
        type="dimension"
        value={typography.fontSize}
        referenceOptions={referenceOptions}
        onChange={(fontSize) => onChange({ ...typography, fontSize })}
      />
      <NestedValueField
        label="Font weight"
        type="fontWeight"
        value={typography.fontWeight}
        referenceOptions={referenceOptions}
        onChange={(fontWeight) => onChange({ ...typography, fontWeight })}
      />
      <NestedValueField
        label="Letter spacing"
        type="dimension"
        value={typography.letterSpacing}
        referenceOptions={referenceOptions}
        onChange={(letterSpacing) => onChange({ ...typography, letterSpacing })}
      />
      <NestedValueField
        label="Line height"
        type="number"
        value={typography.lineHeight}
        referenceOptions={referenceOptions}
        onChange={(lineHeight) => onChange({ ...typography, lineHeight })}
      />
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

function getColorHex(value: unknown): string {
  if (typeof value === "string") {
    return normalizeHexColor(value);
  }

  if (isRecord(value) && typeof value.hex === "string") {
    return normalizeHexColor(value.hex);
  }

  return "#000000";
}

function isValidHexColor(value: string): boolean {
  return /^#?[\da-f]{6}$/i.test(value.trim());
}

function isReferenceValue(value: unknown): value is `{${string}}` {
  return typeof value === "string" && /^\{.+\}$/.test(value);
}

function parseLooseScalar(value: string): string | number {
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }

  return value;
}

function summarizeValue(type: string, value: unknown): string {
  if (isReferenceValue(value)) {
    return value;
  }

  switch (type) {
    case "border":
      return "Border value";
    case "transition":
      return "Transition timing";
    case "shadow":
      return `${Array.isArray(value) ? value.length : 1} shadow${Array.isArray(value) && value.length !== 1 ? "s" : ""}`;
    case "gradient":
      return `${Array.isArray(value) ? value.length : 0} gradient stops`;
    case "typography":
      return "Typography style";
    default:
      return "Edit value";
  }
}

function getTypedReferenceOptions(
  type: string,
  referenceOptions: TokenReferenceOption[],
): TokenReferenceOption[] {
  return referenceOptions.filter((option) => option.type === type);
}

function JsonValueField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(value, null, 2));
    setError(null);
  }, [value]);

  return (
    <div className="space-y-1.5">
      <Textarea
        className="min-h-24 font-mono text-xs"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          try {
            onChange(JSON.parse(text) as unknown);
            setError(null);
          } catch (error) {
            setError(error instanceof Error ? error.message : "Invalid JSON.");
          }
        }}
      />
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}

function defaultShadowValue(): Record<string, unknown> {
  return defaultTokenValue("shadow") as Record<string, unknown>;
}

function normalizeShadowList(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.map((entry) =>
      isRecord(entry) ? entry : defaultShadowValue(),
    );
  }

  return [isRecord(value) ? value : defaultShadowValue()];
}

function updateShadow(
  index: number,
  shadow: Record<string, unknown>,
  shadows: Record<string, unknown>[],
  updateShadows: (shadows: Record<string, unknown>[]) => void,
) {
  const nextShadows = [...shadows];
  nextShadows[index] = shadow;
  updateShadows(nextShadows);
}

function defaultGradientStop(): Record<string, unknown> {
  return { color: createStructuredColor("#6d5dfc"), position: 0 };
}
