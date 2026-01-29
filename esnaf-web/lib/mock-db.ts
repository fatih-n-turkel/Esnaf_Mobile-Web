import { Product, Sale } from "./types";
import { randomUUID } from "crypto";

const now = () => new Date().toISOString();

// In-memory (dev demo). Gerçekte DB/Prisma/Backend’e taşınacak.
export const db = {
  products: [] as Product[],
  sales: [] as Sale[],
  saleByClientReqId: new Map<string, Sale>(),
};

function seedOnce() {
  if (db.products.length) return;

  db.products.push(
    {
      id: randomUUID(),
      name: "Su 0.5L",
      category: "İçecek",
      salePrice: 12,
      costPrice: 8,
      vatRate: 0.01,
      criticalStockLevel: 10,
      stockOnHand: 85,
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
      isActive: true,
      updatedAt: now(),
    }
  );
}

seedOnce();

export function listProducts() {
  return db.products.filter((p) => p.isActive);
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
