import { Product, ProductVariant, VariantSize, Image } from "@/generated/prisma";
import { v4 as uuidv4 } from "uuid";
import { PRESET_SIZES } from "@/lib/productSizes";
import { Variant, Size } from "@/components/product-form/productVariants.types";

/**
 * Form-friendly types
 */
export interface ProductFormInitialValues {
  name: string;
  slug: string;
  description: string;
  makeToOrder: boolean;
  variants: Variant[];
  images?: Array<{ basename: string; extension: string }>;
}

/**
 * Maps a Prisma Product to the form's InitialValues
 * Ensures stock fields are strings for the form
 * Preserves null/undefined as empty strings, so submission converts them back to null
 */
export function mapProductToInitialValues(
  product: Product & {
    variants: (ProductVariant & { sizes: VariantSize[] })[];
    images: Image[];
  }
): ProductFormInitialValues {
  const makeToOrder = product.makeToOrder ?? true;

  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    makeToOrder,
    variants: product.variants.map((variant) => ({
      id: variant.id || uuidv4(),
      colour: variant.colour,
      colourCode: variant.colourCode ?? "#ffffff",
      price: variant.price?.toString() ?? "",
      stock: makeToOrder
        ? variant.stock != null
          ? String(variant.stock)
          : "" // empty string if null/undefined
        : "", // if not makeToOrder, stock is per-size
      showColorPicker: false,
      sizes: PRESET_SIZES.map((size) => {
        const match = variant.sizes?.find((s) => s.size === size);
        return {
          size,
          enabled: !!match,
          stock: makeToOrder
            ? "" // total stock mode ignores per-size
            : match?.stock != null
            ? String(match.stock)
            : "", // empty string if null/undefined
        } as Size;
      }),
    })),
    images: product.images.map((img) => ({
      basename: img.basename,
      extension: img.extension,
    })),
  };
}
