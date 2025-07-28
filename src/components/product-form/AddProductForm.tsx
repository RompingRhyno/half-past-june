"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import ProductVariants from "@/components/product-form/ProductVariants";
import { toast } from "sonner";
import { slugify } from "@/lib/slugify";

const CKEditorApp = dynamic(() => import("@/components/ckeditor/App"), { ssr: false });

const PRESET_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];

export type Size = {
  size: string;
  enabled: boolean;
  stock: string;
};

type Props = {
  action: (formData: FormData) => Promise<void>;
};

export default function AddProductForm({ action }: Props) {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [makeToOrder, setMakeToOrder] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variants, setVariants] = useState([
    {
      id: uuidv4(),
      colour: "",
      colourCode: "#ffffff",
      price: "",
      stock: "",
      showColorPicker: false,
      sizes: PRESET_SIZES.map((size) => ({
        size,
        enabled: false,
        stock: "",
      })),
    },
  ]);

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: uuidv4(),
        colour: "",
        colourCode: "#ffffff",
        price: "",
        stock: "",
        showColorPicker: false,
        sizes: PRESET_SIZES.map((size) => ({
          size,
          enabled: false,
          stock: "",
        })),
      },
    ]);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants((prev) => {
      const index = prev.findIndex((v) => v.id === id);
      if (index <= 0) return prev;
      return prev.filter((v, i) => i !== index);
    });
  };

  const handleVariantChange = (
    id: string,
    field: string,
    value: string | boolean | Size[]
  ) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === id ? { ...variant, [field]: value } : variant
      )
    );
  };

  const validateForm = () => {
    if (!productName.trim()) return "Product name is required";
    if (variants.some((v) => !v.colour)) return "All variants need a color";
    if (variants.some((v) => isNaN(parseFloat(v.price)))) return "All variants need a valid price";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);

    const generatedSlug = slugify(productName);

    try {
      const formData = new FormData();
      formData.append("name", productName);
      formData.append("slug", generatedSlug);
      formData.append("description", description);
      formData.append("makeToOrder", String(makeToOrder));
      formData.append("variants", JSON.stringify(
        variants.map(({ id, showColorPicker, ...rest }) => ({
          ...rest,
          price: parseFloat(rest.price),
          stock: rest.stock ? parseInt(rest.stock) : null,
          sizes: rest.sizes
            .filter((s) => s.enabled)
            .map((s) => ({
              size: s.size,
              stock: makeToOrder ? null : parseInt(s.stock),
            })),
        }))
      ));
      formData.append("images", "[]");

      await action(formData);
      // No need to push or show toast – redirect already happened
    } catch (error) {
      toast.error("An unexpected error occurred", {
        id: "product-create",
        duration: 5000,
      });
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Product Description</label>
          <CKEditorApp onChange={(data: string) => setDescription(data)} />
        </div>

        <div>
          <label className="block font-medium mb-1">Make to Order</label>
          <button
            type="button"
            onClick={() => setMakeToOrder((prev) => !prev)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${makeToOrder ? "bg-green-500" : "bg-gray-300"
              }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${makeToOrder ? "translate-x-6" : "translate-x-0"
                }`}
            />
          </button>
        </div>

        <ProductVariants
          variants={variants}
          makeToOrder={makeToOrder}
          onAddVariant={handleAddVariant}
          onRemoveVariant={handleRemoveVariant}
          onVariantChange={handleVariantChange}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className={`bg-blue-600 text-white rounded px-5 py-2 hover:bg-blue-700 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : "Create Product"}
        </button>
      </form>
    </div>
  );
}
