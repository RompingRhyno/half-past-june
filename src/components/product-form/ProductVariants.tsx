"use client";

import React from "react";
import { X } from "lucide-react";
import { HexColorPicker } from "react-colorful";

interface Size {
  size: string;
  enabled: boolean;
  stock: string;
}

interface Variant {
  id: string;
  colour: string;
  colourCode: string;
  price: string;
  stock: string;
  showColorPicker: boolean;
  sizes: Size[];
}

interface ProductVariantsProps {
  variants: Variant[];
  makeToOrder: boolean;
  onAddVariant: () => void;
  onRemoveVariant: (id: string) => void;
  onVariantChange: (id: string, field: string, value: string | boolean | Size[]) => void;
}

export default function ProductVariants({
  variants,
  makeToOrder,
  onAddVariant,
  onRemoveVariant,
  onVariantChange,
}: ProductVariantsProps) {
  // Toggle size enabled state and reset stock if disabling
  function handleToggleSize(variantId: string, sizeLabel: string) {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;

    const updatedSizes = variant.sizes.map((s) =>
      s.size === sizeLabel
        ? { ...s, enabled: !s.enabled, stock: !s.enabled ? "0" : s.stock } // set stock to "0" if enabling
        : s
    );

    onVariantChange(variantId, "sizes", updatedSizes);
  }

  // Update stock for a specific size in a variant
  function handleSizeStockChange(variantId: string, sizeLabel: string, value: string) {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;

    const updatedSizes = variant.sizes.map((s) =>
      s.size === sizeLabel ? { ...s, stock: value } : s
    );

    onVariantChange(variantId, "sizes", updatedSizes);
  }

  return (
    <div>
      {variants.map((variant, index) => (
        <div key={variant.id} className="relative space-y-4 border p-4 rounded-md mb-4">
          {index !== 0 && (
            <button
              type="button"
              onClick={() => onRemoveVariant(variant.id)}
              className="absolute top-2 right-2 text-red-600 hover:text-red-800"
            >
              <X size={18} />
            </button>
          )}
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              value={variant.colour}
              onChange={(e) => onVariantChange(variant.id, "colour", e.target.value)}
              placeholder="Colour"
              className="border rounded px-3 py-2 w-32"
            />
            <div className="relative inline-block">
              <div
                className="w-10 h-10 border rounded cursor-pointer"
                style={{ backgroundColor: variant.colourCode }}
                title="Pick colour"
                onClick={() => onVariantChange(variant.id, "showColorPicker", !variant.showColorPicker)}
              />
              {variant.showColorPicker && (
                <>
                  {/* Overlay */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => onVariantChange(variant.id, "showColorPicker", false)}
                  />
                  {/* Picker */}
                  <div className="absolute bg-gray-300 bg-opacity-95 rounded shadow-lg p-3 min-w-[180px] top-full left-0 mt-1 z-20">
                    <HexColorPicker
                      color={variant.colourCode}
                      onChange={(color) => onVariantChange(variant.id, "colourCode", color)}
                    />
                    <input
                      type="text"
                      value={variant.colourCode}
                      onChange={(e) => onVariantChange(variant.id, "colourCode", e.target.value)}
                      className="border border-gray-300 bg-white rounded px-2 py-1 w-full mt-3 text-sm font-mono"
                      placeholder="#ffffff"
                      maxLength={7}
                    />
                  </div>
                </>
              )}
            </div>
            <input
              type="number"
              value={variant.price}
              onChange={(e) => onVariantChange(variant.id, "price", e.target.value)}
              placeholder="Price"
              className="border rounded px-3 py-2 w-24"
            />
            {makeToOrder && (
              <input
                type="number"
                value={variant.stock}
                onChange={(e) => onVariantChange(variant.id, "stock", e.target.value)}
                placeholder="Total Stock"
                className="border rounded px-3 py-2 w-32"
              />
            )}
          </div>

          <div>
            <p className="font-medium mb-1">Sizes</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {variant.sizes.map((s) => (
                <button
                  key={s.size}
                  type="button"
                  className={`px-3 py-1 border rounded ${
                    s.enabled ? "bg-blue-500 text-white" : "bg-gray-100"
                  }`}
                  onClick={() => handleToggleSize(variant.id, s.size)}
                >
                  {s.size}
                </button>
              ))}
            </div>
            {!makeToOrder && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {variant.sizes
                  .filter((s) => s.enabled)
                  .map((s) => (
                    <input
                      key={s.size}
                      type="number"
                      value={s.stock}
                      onChange={(e) => handleSizeStockChange(variant.id, s.size, e.target.value)}
                      placeholder={`Stock for ${s.size}`}
                      className="border rounded px-3 py-2"
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={onAddVariant}
        className="bg-gray-300 hover:bg-gray-400 rounded px-4 py-2"
      >
        + Add Variant
      </button>
    </div>
  );
}
