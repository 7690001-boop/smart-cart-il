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
  role: "admin" | "user";
};

export type Store = {
  id: string;
  name: string;
  nameHe: string;
  city: string;
  latitude: number;
  longitude: number;
};

export type UserStoreFilterPreferences = {
  maxDistanceKm: number;
  whitelistStoreIds: string[];
  blacklistStoreIds: string[];
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

export type GovernmentCatalogItem = {
  sourceProductName: string;
  storeId: string;
  priceAgorot: number;
  brand?: string;
  sizeGram?: number;
  kosherAuthorities?: string[];
  premium?: boolean;
  barcode?: string;
  imageUrl?: string;
};

export type IngestionRunStatus = "success" | "failed";

export type IngestionRunRecord = {
  id: string;
  source: "government-catalog" | "retailer-web-feeds" | "unified-catalog";
  startedAt: string;
  finishedAt?: string;
  status: IngestionRunStatus;
  fetchedItems: number;
  ingestedRows: number;
  errorMessage?: string;
  sourceDetails?: Array<{
    sourceName: string;
    fetchedItems: number;
    status: IngestionRunStatus;
    errorMessage?: string;
  }>;
  correlationId?: string;
  idempotencyKey?: string;
};
