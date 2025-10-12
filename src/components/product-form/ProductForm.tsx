"use client";

import React, { useState, forwardRef, useImperativeHandle } from "react";
import { v4 as uuidv4 } from "uuid";
import dynamic from "next/dynamic";
import ProductVariants from "./ProductVariants";
import { Size, Variant } from "./productVariants.types";
import { PRESET_SIZES } from "@/lib/productSizes";
import { slugify } from "@/lib/slugify";

const CKEditorApp = dynamic(() => import("@/components/ckeditor/App"), { ssr: false });

export type InitialValues = {
  name: string;
  slug: string;
  description: string;
  makeToOrder: boolean;
  variants: Variant[];
};

type Props = {
  action: (formData: FormData) => Promise<SubmitResult>;
  mode: "create" | "edit";
  initialValues?: InitialValues;
  onNameChange?: (name: string) => void; // callback to update floating header
};

export type ProductFormHandle = {
  submitForm: () => Promise<SubmitResult | null>;
};

export type SubmitResult = { success: boolean; error?: string; productId?: string };


const ProductForm = forwardRef<ProductFormHandle, Props>(
  ({ action, mode, initialValues, onNameChange }, ref) => {
    const [productName, setProductName] = useState(initialValues?.name ?? "");
    const [slug, setSlug] = useState(
      initialValues?.slug ?? slugify(initialValues?.name ?? "")
    );
    const [description, setDescription] = useState(initialValues?.description ?? "");
    const [makeToOrder, setMakeToOrder] = useState(initialValues?.makeToOrder ?? true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [variants, setVariants] = useState<Variant[]>(() => {
      if (!initialValues?.variants || mode === "create") {
        return [
          {
            id: uuidv4(),
            colour: "",
            colourCode: "#ffffff",
            price: "",
            stock: "",
            showColorPicker: false,
            sizes: PRESET_SIZES.map((size) => ({ size, enabled: false, stock: "" })),
          },
        ];
      }
      return initialValues.variants;
    });

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
          sizes: PRESET_SIZES.map((size) => ({ size, enabled: false, stock: "" })),
        },
      ]);
    };

    const handleRemoveVariant = (id: string) => {
      setVariants((prev) => {
        const index = prev.findIndex((v) => v.id === id);
        if (index <= 0) return prev; // never remove first variant
        return prev.filter((v, i) => i !== index);
      });
    };

    const handleVariantChange = (
      id: string,
      field: keyof Variant,
      value: string | boolean | Size[]
    ) => {
      setVariants((prev) =>
        prev.map((variant) =>
          variant.id === id ? { ...variant, [field]: value } : variant
        )
      );
    };

    const validateForm = (): string | null => {
      if (!productName.trim()) return "Product name is required";
      if (variants.some((v) => !v.colour)) return "All variants need a color";
      if (variants.some((v) => isNaN(parseFloat(v.price)))) return "All variants need a valid price";
      return null;
    };

    const submitForm = async (): Promise<SubmitResult | null> => {
      const validationError = validateForm();
      if (validationError) return { success: false, error: validationError };

      setIsSubmitting(true);

      const finalSlug =
        mode === "create"
          ? slugify(productName)
          : initialValues?.slug ?? slugify(productName);

      try {
        const formData = new FormData();
        formData.append("name", productName);
        formData.append("slug", finalSlug);
        formData.append("description", description);
        formData.append("makeToOrder", String(makeToOrder));
        formData.append(
          "variants",
          JSON.stringify(
            variants.map(({ id, showColorPicker, ...rest }) => ({
              ...rest,
              price: parseFloat(rest.price),
              stock: makeToOrder ? parseInt(rest.stock || "0") : null,
              sizes: rest.sizes
                .filter((s) => s.enabled)
                .map((s) => ({
                  size: s.size,
                  stock: makeToOrder ? null : parseInt(s.stock || "0"),
                })),
            }))
          )
        );
        formData.append("images", "[]"); // Placeholder for now

        // Call server action and get the real productId
        const result = await action(formData);
        return result; // <-- propagate productId and success status
      } catch (error: any) {
        if (error?.digest?.startsWith("NEXT_REDIRECT")) return null;
        console.error("Form submission error:", error);
        return { success: false, error: "An unexpected error occurred" };
      } finally {
        setIsSubmitting(false);
      }
    };

    // Expose submitForm via ref
    useImperativeHandle(ref, () => ({
      submitForm,
    }));

    // Call onNameChange whenever productName updates
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setProductName(newName);
      setSlug(slugify(newName));
      onNameChange?.(newName);
    };

    return (
      <div className="space-y-6" id="product-form">
        <div>
          <label className="block font-medium mb-1">Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={handleNameChange}
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Product Description</label>
          <CKEditorApp
            key={initialValues?.slug ?? "new"}
            onChange={(data: string) => setDescription(data)}
            data={description}
          />
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
      </div>
    );
  }
);

ProductForm.displayName = "ProductForm";

export default ProductForm;
