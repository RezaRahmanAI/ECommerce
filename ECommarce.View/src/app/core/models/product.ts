export interface ProductImage {
  id: number;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  color?: string;
}

export interface ProductVariant {
  id: number;
  sku?: string;
  size?: string;
  price?: number;
  stockQuantity: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  purchaseRate?: number;
  stockQuantity: number;
  isActive: boolean;

  isNew: boolean;
  isFeatured: boolean;

  categoryId: number;
  categoryName: string;
  subCategoryId?: number;
  subCategoryName?: string;
  collectionId?: number;
  collectionName?: string;

  imageUrl?: string;
  images: ProductImage[];
  variants: ProductVariant[];

  metaTitle?: string;
  metaDescription?: string;
  fabricAndCare?: string;
  shippingAndReturns?: string;

  // ilyn.global Design Fields
  tier?: string;
  tags?: string;
  sortOrder?: number;
}

export interface RelatedProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  slug: string;
  tier?: string;
}
