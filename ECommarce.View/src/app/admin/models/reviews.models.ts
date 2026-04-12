export interface AdminReview {
  id: number;
  customerName: string; // Renamed from userName to match backend
  customerAvatar: string; // Renamed from userAvatar
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  date: string; // Renamed from createdAt
  productId: number;
  productName: string;
  isFeatured: boolean;
  likes: number;
}

export interface ReviewUpdatePayload {
  productId: number;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  isFeatured: boolean;
}

export interface ReviewCreatePayload extends ReviewUpdatePayload {}
