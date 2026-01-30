import { Category, Product, Sale, Settings } from "./types";
import { randomUUID } from "crypto";

const now = () => new Date().toISOString();
const makeQrCode = (name: string) => `QR-${name.replace(/\s+/g, "-").toUpperCase()}-${randomUUID().slice(0, 6)}`;

// In-memory (dev demo). Gerçekte DB/Prisma/Backend’e taşınacak.
export const db = {
  products: [] as Product[],
  categories: [] as Category[],
  settings: { defaultVatRate: 0.2 } as Settings,
  sales: [] as Sale[],
  saleByClientReqId: new Map<string, Sale>(),
};

function seedOnce() {
  if (db.products.length) return;

  const seededProducts: Product[] = [
    {
      id: randomUUID(),
      name: "Su 0.5L",
      category: "İçecek",
      salePrice: 12,
      costPrice: 8,
      vatRate: 0.01,
      criticalStockLevel: 10,
      stockOnHand: 85,
      qrCode: "QR-SU-05L-0001",
      isActive: true,
      updatedAt: now(),
    },
    {
      id: randomUUID(),
      name: "Cips",
      category: "Atıştırmalık",
      salePrice: 25,
      costPrice: 17,
      vatRate: 0.1,
      criticalStockLevel: 8,
      stockOnHand: 12,
      qrCode: "QR-CIPS-0002",
      isActive: true,
      updatedAt: now(),
    },
    {
      id: randomUUID(),
      name: "Defter A4",
      category: "Kırtasiye",
      salePrice: 40,
      costPrice: 28,
      vatRate: 0.2,
      criticalStockLevel: 5,
      stockOnHand: 4,
      qrCode: "QR-DEFTER-A4-0003",
      isActive: true,
      updatedAt: now(),
    }
  ];

  db.products.push(...seededProducts);

  const categorySet = new Set(
    seededProducts.map((product) => product.category).filter((category): category is string => Boolean(category))
  );
  db.categories.push(
    ...Array.from(categorySet).map((name) => ({
      id: randomUUID(),
      name,
      createdAt: now(),
    }))
  );
}

seedOnce();
seedSalesOnce();

export function listProducts() {
  return db.products.filter((p) => p.isActive);
}

export function addProduct(input: Omit<Product, "id" | "updatedAt" | "isActive">) {
  const created: Product = {
    ...input,
    id: randomUUID(),
    isActive: true,
    updatedAt: now(),
    qrCode: input.qrCode ?? makeQrCode(input.name),
  };
  db.products.unshift(created);
  if (created.category) {
    ensureCategory(created.category);
  }
  return created;
}

export function ensureProductQrCode(productId: string, qrCode?: string) {
  const product = db.products.find((p) => p.id === productId);
  if (!product) return null;
  const nextCode = qrCode?.trim() || product.qrCode || makeQrCode(product.name);
  product.qrCode = nextCode;
  product.updatedAt = now();
  return product;
}

function ensureCategory(name: string) {
  const exists = db.categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (exists) return exists;
  const created: Category = { id: randomUUID(), name, createdAt: now() };
  db.categories.unshift(created);
  return created;
}

export function listCategories() {
  return db.categories.slice().sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

export function addCategory(name: string) {
  return ensureCategory(name.trim());
}

export function getSettings() {
  return db.settings;
}

export function updateSettings(partial: Partial<Settings>) {
  db.settings = { ...db.settings, ...partial };
  return db.settings;
}

export function createSaleIdempotent(clientRequestId: string, sale: Omit<Sale, "id" | "createdAt">) {
  const existing = db.saleByClientReqId.get(clientRequestId);
  if (existing) return existing;

  const created: Sale = {
    ...sale,
    id: randomUUID(),
    createdAt: now(),
    clientRequestId,
  };

  // stok düş
  for (const it of created.items) {
    const p = db.products.find((x) => x.id === it.productId);
    if (p) {
      p.stockOnHand = Math.max(0, p.stockOnHand - it.qty);
      p.updatedAt = now();
    }
  }

  db.sales.unshift(created);
  db.saleByClientReqId.set(clientRequestId, created);
  return created;
}

export function listSales(limit = 20) {
  return db.sales.slice(0, limit);
}

function seedSalesOnce() {
  if (db.sales.length) return;

  const products = db.products;
  const sampleSales: Array<{ daysAgo: number; items: Array<{ productId: string; qty: number }> }> = [
    { daysAgo: 0, items: [{ productId: products[0].id, qty: 6 }, { productId: products[1].id, qty: 3 }] },
    { daysAgo: 1, items: [{ productId: products[2].id, qty: 4 }] },
    { daysAgo: 3, items: [{ productId: products[1].id, qty: 5 }] },
    { daysAgo: 7, items: [{ productId: products[0].id, qty: 10 }, { productId: products[2].id, qty: 2 }] },
    { daysAgo: 14, items: [{ productId: products[0].id, qty: 8 }] },
    { daysAgo: 30, items: [{ productId: products[1].id, qty: 7 }] },
    { daysAgo: 60, items: [{ productId: products[2].id, qty: 6 }] },
    { daysAgo: 120, items: [{ productId: products[0].id, qty: 12 }] },
    { daysAgo: 200, items: [{ productId: products[1].id, qty: 9 }] },
    { daysAgo: 320, items: [{ productId: products[2].id, qty: 5 }] },
  ];

  for (const seed of sampleSales) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - seed.daysAgo);
    const items = seed.items.map((entry) => {
      const product = products.find((p) => p.id === entry.productId);
      if (!product) {
        throw new Error("Seed product not found");
      }
      return {
        productId: product.id,
        name: product.name,
        qty: entry.qty,
        unitSalePrice: product.salePrice,
        unitCostPrice: product.costPrice,
        vatRate: product.vatRate,
      };
    });

    const totalRevenue = items.reduce((sum, it) => sum + it.qty * it.unitSalePrice, 0);
    const totalCost = items.reduce((sum, it) => sum + it.qty * it.unitCostPrice, 0);
    const totalVat = items.reduce((sum, it) => sum + it.qty * it.unitSalePrice * it.vatRate, 0);
    const netProfit = totalRevenue - totalCost;

    const created: Sale = {
      id: randomUUID(),
      clientRequestId: randomUUID(),
      createdAt: createdAt.toISOString(),
      createdBy: { id: "seed-user", name: "Seed", role: "ADMİN" },
      paymentType: "CASH",
      posFeeType: "RATE",
      posFeeValue: 0,
      posFeeAmount: 0,
      totalRevenue,
      totalCost,
      totalVat,
      netProfit,
      items,
    };
    db.sales.push(created);
  }
}
