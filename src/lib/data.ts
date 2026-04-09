import {
  CanonicalProduct,
  ClusterReviewItem,
  ShoppingList,
  Store,
  StoreSku,
  User
} from "@/lib/types";

export const users: User[] = [
  { id: "u1", email: "demo@smartcart.il", password: "demo123", name: "Demo User" }
];

export const stores: Store[] = [
  { id: "s1", name: "Shufersal" },
  { id: "s2", name: "Rami Levy" },
  { id: "s3", name: "Victory" }
];

export const canonicalProducts: CanonicalProduct[] = [
  {
    id: "cp1",
    name: "Milk 3%",
    category: "Dairy",
    brand: "Tnuva",
    kosherAuthorities: ["Rabanut"],
    premium: false,
    defaultSizeGram: 1000
  },
  {
    id: "cp2",
    name: "Eggs L 12",
    category: "Eggs",
    brand: "Galili",
    kosherAuthorities: ["Badatz", "Rabanut"],
    premium: false,
    defaultSizeGram: 720
  }
];

export const storeSkus: StoreSku[] = [
  {
    id: "sku1",
    storeId: "s1",
    canonicalProductId: "cp1",
    skuName: "Tnuva Milk 3% 1L",
    brand: "Tnuva",
    sizeGram: 1000,
    kosherAuthorities: ["Rabanut"],
    premium: false,
    priceAgorot: 670,
    updatedAt: new Date().toISOString()
  },
  {
    id: "sku2",
    storeId: "s2",
    canonicalProductId: "cp1",
    skuName: "Tara Milk 3% 1L",
    brand: "Tara",
    sizeGram: 1000,
    kosherAuthorities: ["Rabanut"],
    premium: false,
    priceAgorot: 620,
    updatedAt: new Date().toISOString()
  },
  {
    id: "sku3",
    storeId: "s3",
    canonicalProductId: "cp2",
    skuName: "Eggs L 12",
    brand: "Galili",
    sizeGram: 720,
    kosherAuthorities: ["Badatz"],
    premium: false,
    priceAgorot: 1320,
    updatedAt: new Date().toISOString()
  }
];

export const shoppingLists: ShoppingList[] = [
  {
    id: "l1",
    userId: "u1",
    name: "Weekly",
    items: [
      {
        id: "li1",
        canonicalProductId: "cp1",
        quantity: 2,
        preferences: {
          brand: "flexible",
          kosherRequired: true,
          kosherAuthorities: ["Rabanut"],
          premiumOnly: false,
          packageSizeTolerancePercent: 15,
          replaceable: true
        }
      }
    ]
  }
];

export const clusterReviewQueue: ClusterReviewItem[] = [
  {
    id: "cr1",
    sourceName: "Milk 3 percent 1 liter tnuva",
    candidateCanonicalId: "cp1",
    confidence: 0.82,
    status: "pending"
  }
];
