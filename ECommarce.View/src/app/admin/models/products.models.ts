import {
  Product as CoreProduct,
  ProductImage,
  ProductVariant,
  RelatedProduct,
} from "../../core/models/product";

export type ProductStatus = "Active" | "Draft" | "Archived" | "Out of Stock";

export interface ProductVariantEdit {
  id?: number;
  sku?: string;
  size?: string;
  color?: string;
  price?: number;
  stockQuantity: number;
}

export interface AdminProduct extends CoreProduct {
  status?: ProductStatus;
  statusActive?: boolean; // Legacy support if needed, but should use isActive
}

export interface ProductVariantOption {
  optionName: "Size" | "Color" | "Material" | string;
  values: string;
}

export interface ProductVariantRow {
  label: string;
  price: number;
  sku: string;
  quantity: number;
}

export interface ProductCreatePayload {
  name: string;
  description: string;
  category: string; // Changed from categoryId
  gender: string;
  price: number;
  salePrice?: number;
  purchaseRate: number;

  newArrival: boolean;
  isFeatured: boolean;

  statusActive: boolean;

  media: {
    mainImage: {
      type: string;
      label: string;
      imageUrl: string;
      alt: string;
      color?: string;
    };
    thumbnails: {
      type: string;
      label: string;
      imageUrl: string;
      alt: string;
      color?: string;
    }[];
  };

  variants: {
    colors: { name: string; hex: string; selected: boolean }[];
    sizes: { label: string; stock: number; selected: boolean }[];
  };

  inventoryVariants: {
    label: string;
    price: number;
    sku: string;
    inventory: number;
    imageUrl?: string;
  }[];

  meta: {
    fabricAndCare: string;
    shippingAndReturns: string;
  };

  ratings: {
    average: number;
    count: number;
  };

  // New Fields
  tier?: string;
  tags?: string;
  sortOrder?: number;
  subCategoryId?: number | null;
  collectionId?: number | null;
}

export interface ProductUpdatePayload {
  name: string;
  description: string;
  category: string;
  gender: string;
  price: number;
  salePrice?: number;
  purchaseRate: number;

  newArrival: boolean;
  isFeatured: boolean;

  statusActive: boolean;

  media: {
    mainImage: {
      type: string;
      label: string;
      imageUrl: string;
      alt: string;
      color?: string;
    };
    thumbnails: {
      type: string;
      label: string;
      imageUrl: string;
      alt: string;
      color?: string;
    }[];
  };

  variants: {
    colors: { name: string; hex: string; selected: boolean }[];
    sizes: { label: string; stock: number; selected: boolean }[];
  };

  inventoryVariants: {
    label: string;
    price: number;
    sku: string;
    inventory: number;
    imageUrl?: string;
  }[];

  meta: {
    fabricAndCare: string;
    shippingAndReturns: string;
  };

  // New Fields
  tier?: string;
  tags?: string;
  sortOrder?: number;
  subCategoryId?: number | null;
  collectionId?: number | null;
}

export type ProductsStatusTab = "All Items" | "Active" | "Drafts" | "Archived";

export interface ProductsQueryParams {
  searchTerm: string;
  category: string;
  statusTab: string;
  isNew?: boolean;
  isFeatured?: boolean;
  page: number;
  pageSize: number;
}
