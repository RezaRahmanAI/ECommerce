export interface AdminReview {
  id: number;
  customerName: string; // Renamed from userName to match backend
  reviewImage?: string;
  rating: number;
  comment: string;
  date: string; // Renamed from createdAt
  productId: number;
  productName: string;
  likes: number;
}

export interface ReviewUpdatePayload {
  productId: number;
  customerName: string;
  reviewImage?: string;
  rating: number;
  comment: string;
}

export interface ReviewCreatePayload extends ReviewUpdatePayload {}
