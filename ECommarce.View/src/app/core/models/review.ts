export interface Review {
  id: number;
  productId: number;
  customerName: string;
  customerAvatar?: string;
  reviewImage?: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
}

export interface CreateReview {
  productId: number;
  customerName: string;
  rating: number;
  comment: string;
  reviewImage?: string;
}
