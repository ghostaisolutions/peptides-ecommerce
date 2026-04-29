export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isFuture: boolean;
};

export type ProductAttribute = {
  label: string;
  value: string;
};

export type ProductImageMap = {
  primary: string;
  gallery?: string[];
  hover?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  subtitle: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  compareAtPrice?: number;
  images: ProductImageMap;
  stockQuantity: number;
  sku: string;
  badge?: string;
  includesComplimentaryKit: boolean;
  attributes: ProductAttribute[];
  variants?: ProductVariant[];
  isActive: boolean;
  isFeatured: boolean;
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  active: boolean;
  isDefault?: boolean;
  imageOverride?: string;
  sortOrder?: number;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type LegalContent = {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
};

export type CartItem = {
  productId: string;
  variantId?: string;
  quantity: number;
};

export type ResolvedCartItem = {
  product: Product;
  variant: ProductVariant;
  quantity: number;
};

export type PaymentMethod = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  mode: 'manual' | 'invoice' | 'placeholder';
};

export type DiscountType = 'percent' | 'fixed';

export type DiscountRule = {
  id: string;
  name: string;
  type: DiscountType;
  minQuantity: number;
  value: number;
  eligibleProductIds?: string[];
  eligibleCategoryIds?: string[];
  active: boolean;
  code?: string;
};

export type COADocument = {
  id: string;
  productId: string;
  productName?: string;
  batchNumber: string;
  purityPercent: number;
  labName: string;
  testDate: string;
  pdfUrl: string;
  active: boolean;
};

export type ShippingMethod = {
  id: string;
  name: string;
  carrier: string;
  price: number;
  eta: string;
  description: string;
  active: boolean;
  sortOrder: number;
};

export type AgeGateRegistrant = {
  id: string;
  firstName: string;
  email: string;
  dob: string;
  verifiedAt: string;
  createdAt: string;
};

export type OrderAcknowledgements = {
  informationAccurate: boolean;
  termsAccepted: boolean;
  verificationAccepted: boolean;
  ageConfirmed: boolean;
  researchDisclaimerAccepted: boolean;
};

export type OrderWorkflowStatus =
  | 'pending'
  | 'reviewing'
  | 'approved'
  | 'payment-sent'
  | 'completed'
  | 'cancelled';

export type OrderTimeline = {
  createdAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  paymentSentAt?: string;
  completedAt?: string;
  cancelledAt?: string;
};

export type ConversionStatus = 'unpaid' | 'paid';

export type OrderRequest = {
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentMethodId: string;
  shippingMethodId?: string;
  shippingMethodLabel?: string;
  notes?: string;
  acknowledgements: OrderAcknowledgements;
  items: Array<{
    productId?: string;
    productVariantId?: string;
    productName: string;
    variantName?: string;
    sku?: string;
    unitPrice: number;
    quantity: number;
  }>;
};

export type StoredOrderRequest = OrderRequest & {
  id: string;
  orderReference: string;
  paymentMethodLabel: string;
  shippingMethodId?: string;
  shippingMethodLabel?: string;
  status: OrderWorkflowStatus;
  conversionStatus: ConversionStatus;
  paymentInstructions?: string;
  paymentLink?: string;
  followUpAt?: string;
  needsFollowUp: boolean;
  timeline: OrderTimeline;
  createdAt: string;
  updatedAt: string;
};

export type SiteSetting = {
  id: string;
  key: string;
  value: string;
  section: string;
};
