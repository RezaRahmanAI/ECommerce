export interface ProductImage {
  id: number;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
}

export interface Product {
  id: number;
  name: string;
  headline: string;
  slug: string;
  subtitle?: string;
  imgUrl: string;
  images: ProductImage[];
  benefitsTitle?: string;
  benefitsContent?: string;
  sideEffectsTitle?: string;
  sideEffectsContent?: string;
  usageTitle?: string;
  usageContent?: string;
  reviewsTitle?: string;
  stockQuantity?: number;
  purchaseRate: number;
  price: number;
  compareAtPrice?: number;
  isActive: boolean;
  isNew: boolean;
  categoryId?: number;
  categoryName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RelatedProduct {
  id: number;
  name: string;
  headline: string;
  price: number;
  compareAtPrice?: number;
  imgUrl: string;
  slug: string;
}
