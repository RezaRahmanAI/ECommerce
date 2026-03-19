export interface AdminSettings {
  websiteName: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  whatsAppNumber?: string;
  freeShippingThreshold: number;
  deliveryMethods: DeliveryMethod[];
  shippingZones: ShippingZone[];
  // Payment fields
  stripeEnabled?: boolean;
  paypalEnabled?: boolean;
  stripePublishableKey?: string;
  facebookPixelId?: string;
  googleTagId?: string;
}

export interface ShippingZone {
  id: number;
  name: string;
  region: string;
  rates: string[];
}

export interface DeliveryMethod {
  id: number;
  name: string;
  cost: number;
  estimatedDays?: string;
  isActive: boolean;
}
