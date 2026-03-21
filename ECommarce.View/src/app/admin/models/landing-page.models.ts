export interface ProductLandingPageDto {
  id: number;
  productId: number;
  headline: string;
  videoUrl?: string;
  subtitle?: string;
  benefitsTitle?: string;
  benefitsContent?: string;
  reviewsTitle?: string;
  sideEffectsTitle?: string;
  sideEffectsContent?: string;
  usageTitle?: string;
  usageContent?: string;
  themeColor?: string;
}

export interface UpdateProductLandingPageDto {
  productId: number;
  headline: string;
  videoUrl?: string;
  subtitle?: string;
  benefitsTitle?: string;
  benefitsContent?: string;
  reviewsTitle?: string;
  sideEffectsTitle?: string;
  sideEffectsContent?: string;
  usageTitle?: string;
  usageContent?: string;
  themeColor?: string;
}
