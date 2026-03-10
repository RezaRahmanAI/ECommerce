export interface AdminReview {
  id: number;
  customerName: string;
  customerAvatar: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  date: string;
  productId: number;
  productName: string;
  reviewImage?: string;
  likes: number;
}

export interface ReviewUpdatePayload {
  rating: number;
  comment: string;
  reviewImage?: string | null;
}
