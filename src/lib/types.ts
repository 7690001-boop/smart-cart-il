export type RestrictionLevel = "strict" | "flexible";

export type PreferenceRules = {
  brand: RestrictionLevel;
  kosherRequired: boolean;
  kosherAuthorities?: string[];
  premiumOnly: boolean;
  packageSizeTolerancePercent: number;
  replaceable: boolean;
};

export type User = {
  id: string;
  email: string;
  password: string;
  name: string;
};

export type Store = {
  id: string;
  name: string;
};

export type CanonicalProduct = {
  id: string;
  name: string;
  category: string;
  brand?: string;
  kosherAuthorities: string[];
  premium: boolean;
  defaultSizeGram: number;
};

export type StoreSku = {
  id: string;
  storeId: string;
  canonicalProductId: string;
  skuName: string;
  brand?: string;
  sizeGram: number;
  kosherAuthorities: string[];
  premium: boolean;
  priceAgorot: number;
  updatedAt: string;
};

export type ShoppingListItem = {
  id: string;
  canonicalProductId: string;
  quantity: number;
  preferences: PreferenceRules;
};

export type ShoppingList = {
  id: string;
  userId: string;
  name: string;
  items: ShoppingListItem[];
};

export type ClusterReviewItem = {
  id: string;
  sourceName: string;
  candidateCanonicalId: string;
  confidence: number;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
};
