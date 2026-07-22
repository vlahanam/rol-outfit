import type { ProductVariant } from "@/types/api";

interface Props {
  attributeNames: string[];
  variants: ProductVariant[];
  selected: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}

function getAxisValues(axis: string, variants: ProductVariant[]): string[] {
  const seen = new Set<string>();
  for (const v of variants) {
    const val = v.attributes[axis];
    if (val) seen.add(val);
  }
  return [...seen];
}

function isValueEnabled(
  axis: string,
  value: string,
  selected: Record<string, string>,
  variants: ProductVariant[],
): boolean {
  return variants.some((v) => {
    if ((v.attributes[axis] ?? "") !== value) return false;
    if (v.stock <= 0) return false;
    for (const [k, sel] of Object.entries(selected)) {
      if (k === axis) continue;
      if (sel && (v.attributes[k] ?? "") !== sel) return false;
    }
    return true;
  });
}

export function VariantPicker({ attributeNames, variants, selected, onChange }: Props) {
  if (attributeNames.length === 0 || variants.length === 0) return null;

  const handleSelect = (axis: string, value: string) => {
    const next = { ...selected, [axis]: selected[axis] === value ? "" : value };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {attributeNames.map((axis) => {
        const values = getAxisValues(axis, variants);
        return (
          <div key={axis}>
            <h3 className="font-semibold mb-2">{axis}</h3>
            <div className="flex flex-wrap gap-2">
              {values.map((val) => {
                const enabled = isValueEnabled(axis, val, selected, variants);
                const active = selected[axis] === val;
                return (
                  <button
                    key={val}
                    onClick={() => enabled && handleSelect(axis, val)}
                    disabled={!enabled}
                    className={`px-4 py-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : enabled
                        ? "border-gray-300 hover:border-gray-400"
                        : "border-gray-200 text-gray-300 cursor-not-allowed line-through"
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
