import {
  Product as CoreProduct,
  ProductImage,
  RelatedProduct,
} from "../../core/models/product";

export type ProductStatus = "Active" | "Draft" | "Archived" | "Out of Stock";

export interface AdminProduct extends CoreProduct {
  status?: ProductStatus;
  purchaseRate: number;
  statusActive?: boolean; // Legacy support if needed, but should use isActive
}

export interface ProductCreatePayload {
  name: string;
  headline: string;
  slug: string;
  subtitle: string;
  category: string;
  purchaseRate: number;
  price: number;
  compareAtPrice?: number;
  newArrival: boolean;
  isActive: boolean;
  imgUrl: string;
  images: ProductImage[];
  benefitsTitle?: string;
  benefitsContent?: string;
  sideEffectsTitle?: string;
  sideEffectsContent?: string;
  usageTitle?: string;
  usageContent?: string;
}

export interface ProductUpdatePayload {
  name: string;
  headline: string;
  slug: string;
  subtitle: string;
  category: string;
  purchaseRate: number;
  price: number;
  compareAtPrice?: number;
  newArrival: boolean;
  isActive: boolean;
  imgUrl: string;
  images: ProductImage[];
  benefitsTitle?: string;
  benefitsContent?: string;
  sideEffectsTitle?: string;
  sideEffectsContent?: string;
  usageTitle?: string;
  usageContent?: string;
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
