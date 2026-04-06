export interface CartItem {
  id: string;
  productId: number;
  headline: string;
  price: number;
  quantity: number;
  size?: string;
  imgUrl: string;
  imageAlt: string;
  discountPercentage?: number;
  compareAtPrice?: number | null;
}

export interface CartSummary {
  itemsCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  freeShippingProgress: number;
}
