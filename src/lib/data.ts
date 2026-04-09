import {
  CanonicalProduct,
  ClusterReviewItem,
  ShoppingList,
  Store,
  StoreSku,
  User,
  UserStoreFilterPreferences
} from "@/lib/types";

export const users: User[] = [
  { id: "u1", email: "demo@smartcart.il", password: "demo123", name: "Demo User", role: "admin" }
];

export const stores: Store[] = [
  {
    id: "s1",
    name: "Shufersal",
    nameHe: "שופרסל",
    city: "Tel Aviv",
    latitude: 32.0853,
    longitude: 34.7818
  },
  {
    id: "s2",
    name: "Rami Levy",
    nameHe: "רמי לוי",
    city: "Ramat Gan",
    latitude: 32.0684,
    longitude: 34.8248
  },
  {
    id: "s3",
    name: "Victory",
    nameHe: "ויקטורי",
    city: "Petah Tikva",
    latitude: 32.084,
    longitude: 34.8878
  }
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
  ,
  {
    id: "cp3",
    name: "White Bread",
    category: "Bakery",
    brand: "Angel",
    kosherAuthorities: ["Rabanut"],
    premium: false,
    defaultSizeGram: 750
  },
  {
    id: "cp4",
    name: "Cottage Cheese 5%",
    category: "Dairy",
    brand: "Tnuva",
    kosherAuthorities: ["Badatz", "Rabanut"],
    premium: false,
    defaultSizeGram: 250
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
  },
  {
    id: "sku4",
    storeId: "s1",
    canonicalProductId: "cp3",
    skuName: "Angel White Bread",
    brand: "Angel",
    sizeGram: 750,
    kosherAuthorities: ["Rabanut"],
    premium: false,
    priceAgorot: 790,
    updatedAt: new Date().toISOString()
  },
  {
    id: "sku5",
    storeId: "s2",
    canonicalProductId: "cp3",
    skuName: "Angel White Bread",
    brand: "Angel",
    sizeGram: 750,
    kosherAuthorities: ["Rabanut"],
    premium: false,
    priceAgorot: 730,
    updatedAt: new Date().toISOString()
  },
  {
    id: "sku6",
    storeId: "s1",
    canonicalProductId: "cp4",
    skuName: "Tnuva Cottage 5%",
    brand: "Tnuva",
    sizeGram: 250,
    kosherAuthorities: ["Badatz"],
    premium: false,
    priceAgorot: 610,
    updatedAt: new Date().toISOString()
  },
  {
    id: "sku7",
    storeId: "s3",
    canonicalProductId: "cp4",
    skuName: "Tnuva Cottage 5%",
    brand: "Tnuva",
    sizeGram: 250,
    kosherAuthorities: ["Rabanut"],
    premium: false,
    priceAgorot: 560,
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
      },
      {
        id: "li2",
        canonicalProductId: "cp3",
        quantity: 1,
        preferences: {
          brand: "strict",
          kosherRequired: true,
          kosherAuthorities: ["Rabanut"],
          premiumOnly: false,
          packageSizeTolerancePercent: 10,
          replaceable: false
        }
      },
      {
        id: "li3",
        canonicalProductId: "cp4",
        quantity: 2,
        preferences: {
          brand: "flexible",
          kosherRequired: true,
          kosherAuthorities: ["Badatz", "Rabanut"],
          premiumOnly: false,
          packageSizeTolerancePercent: 15,
          replaceable: true
        }
      }
    ]
  }
];

export const userStoreFilterPreferences: Record<string, UserStoreFilterPreferences> = {
  u1: {
    maxDistanceKm: 15,
    whitelistStoreIds: [],
    blacklistStoreIds: []
  }
};

export const clusterReviewQueue: ClusterReviewItem[] = [
  {
    id: "cr1",
    sourceName: "Milk 3 percent 1 liter tnuva",
    candidateCanonicalId: "cp1",
    confidence: 0.82,
    status: "pending"
  }
];
