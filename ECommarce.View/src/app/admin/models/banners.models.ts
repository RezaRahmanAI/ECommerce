export interface AdminBanner {
  id: number;
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  displayOrder: number;
  isActive: boolean;
  type: "Hero" | "Promo" | "Spotlight";
}

export interface BannerCreatePayload {
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  displayOrder: number;
  isActive: boolean;
  type: "Hero" | "Promo" | "Spotlight";
}
