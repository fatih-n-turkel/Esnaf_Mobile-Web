import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { Branch, Category, Product, Sale, Settings, DemoUser } from "./types";

type DatabaseFile = {
  products: Product[];
  categories: Category[];
  settings: Settings;
  sales: Sale[];
  users: DemoUser[];
  branches: Branch[];
};

const now = () => new Date().toISOString();
const makeQrCode = (name: string) => `QR-${name.replace(/\s+/g, "-").toUpperCase()}-${randomUUID().slice(0, 6)}`;
const databaseDir = path.resolve(process.cwd(), "..", "database");
const databaseFile = path.join(databaseDir, "esnaf-web.json");

function ensureDatabaseFile() {
  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
  }

  if (!fs.existsSync(databaseFile)) {
    const seed = buildSeedDatabase();
    fs.writeFileSync(databaseFile, JSON.stringify(seed, null, 2), "utf8");
  }
}

function readDatabase(): DatabaseFile {
  ensureDatabaseFile();
  const raw = fs.readFileSync(databaseFile, "utf8");
  try {
    const parsed = JSON.parse(raw) as DatabaseFile;
    if (!parsed.branches) {
      const seed = buildSeedDatabase();
      const merged = { ...parsed, branches: seed.branches };
      writeDatabase(merged);
      return merged;
    }
    return parsed;
  } catch {
    const seed = buildSeedDatabase();
    fs.writeFileSync(databaseFile, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
}

function writeDatabase(next: DatabaseFile) {
  fs.writeFileSync(databaseFile, JSON.stringify(next, null, 2), "utf8");
}

function buildSeedDatabase(): DatabaseFile {
  const branchMainId = randomUUID();
  const branchCoastId = randomUUID();
  const branches: Branch[] = [
    { id: branchMainId, name: "Merkez Şube", createdAt: now() },
    { id: branchCoastId, name: "Sahil Şube", createdAt: now() },
  ];

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
      stockByBranch: {
        [branchMainId]: 50,
        [branchCoastId]: 35,
      },
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
      stockByBranch: {
        [branchMainId]: 7,
        [branchCoastId]: 5,
      },
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
      stockByBranch: {
        [branchMainId]: 2,
        [branchCoastId]: 2,
      },
      qrCode: "QR-DEFTER-A4-0003",
      isActive: true,
      updatedAt: now(),
    },
  ];

  const categories: Category[] = Array.from(
    new Set(
      seededProducts
        .map((product) => product.category)
        .filter((category): category is string => Boolean(category))
    )
  ).map((name) => ({
    id: randomUUID(),
    name,
    createdAt: now(),
  }));

  const users: DemoUser[] = [
    {
      id: "user-admin",
      username: "fatih",
      password: "fatih",
      name: "Fatih",
      role: "ADMİN",
      landingPath: "/admin",
      branchId: null,
    },
    {
      id: "user-manager",
      username: "mehmet",
      password: "mehmet",
      name: "Mehmet",
      role: "MÜDÜR",
      landingPath: "/manager",
      branchId: branchMainId,
    },
    {
      id: "user-personnel",
      username: "cenk",
      password: "cenk",
      name: "Cenk",
      role: "PERSONEL",
      landingPath: "/personnel",
      branchId: branchMainId,
    },
  ];

  const sales = buildSeedSales(seededProducts, users, branches);

  return {
    products: seededProducts,
    categories,
    settings: { defaultVatRate: 0.2 },
    sales,
    users,
    branches,
  };
}

function buildSeedSales(products: Product[], users: DemoUser[], branches: Branch[]): Sale[] {
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

  return sampleSales.map((seed, index) => {
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

    const createdBy = users[index % users.length];
    const branchId = createdBy.branchId ?? branches[0]?.id ?? null;

    return {
      id: randomUUID(),
      clientRequestId: randomUUID(),
      createdAt: createdAt.toISOString(),
      createdBy: { id: createdBy.id, name: createdBy.name, role: createdBy.role },
      branchId,
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
  });
}

export function listProducts() {
  const db = readDatabase();
  return db.products.filter((p) => p.isActive);
}

export function addProduct(input: Omit<Product, "id" | "updatedAt" | "isActive">) {
  const db = readDatabase();
  const defaultBranchId = db.branches[0]?.id;
  const stockByBranch = input.stockByBranch
    ? { ...input.stockByBranch }
    : defaultBranchId
      ? { [defaultBranchId]: input.stockOnHand }
      : undefined;
  const created: Product = {
    ...input,
    id: randomUUID(),
    isActive: true,
    updatedAt: now(),
    qrCode: input.qrCode ?? makeQrCode(input.name),
    stockByBranch,
  };
  db.products.unshift(created);
  if (created.category) {
    ensureCategory(db, created.category);
  }
  writeDatabase(db);
  return created;
}

export function updateProductMeta(productId: string, updates: { qrCode?: string; vatRate?: number }) {
  const db = readDatabase();
  const product = db.products.find((p) => p.id === productId);
  if (!product) return null;
  const nextCode = updates.qrCode?.trim() || product.qrCode || makeQrCode(product.name);
  product.qrCode = nextCode;
  if (typeof updates.vatRate === "number" && !Number.isNaN(updates.vatRate)) {
    product.vatRate = updates.vatRate;
  }
  product.updatedAt = now();
  writeDatabase(db);
  return product;
}

function ensureCategory(db: DatabaseFile, name: string) {
  const exists = db.categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (exists) return exists;
  const created: Category = { id: randomUUID(), name, createdAt: now() };
  db.categories.unshift(created);
  return created;
}

export function listCategories() {
  const db = readDatabase();
  return db.categories.slice().sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

export function addCategory(name: string) {
  const db = readDatabase();
  const created = ensureCategory(db, name.trim());
  writeDatabase(db);
  return created;
}

export function getSettings() {
  const db = readDatabase();
  return db.settings;
}

export function updateSettings(partial: Partial<Settings>) {
  const db = readDatabase();
  db.settings = { ...db.settings, ...partial };
  writeDatabase(db);
  return db.settings;
}

export function createSaleIdempotent(clientRequestId: string, sale: Omit<Sale, "id" | "createdAt">) {
  const db = readDatabase();
  const existing = db.sales.find((s) => s.clientRequestId === clientRequestId);
  if (existing) return existing;

  const created: Sale = {
    ...sale,
    id: randomUUID(),
    createdAt: now(),
    clientRequestId,
  };

  for (const it of created.items) {
    const p = db.products.find((x) => x.id === it.productId);
    if (p) {
      const branchId = created.branchId ?? db.branches[0]?.id;
      if (branchId) {
        if (!p.stockByBranch) p.stockByBranch = {};
        const currentStock = p.stockByBranch[branchId] ?? 0;
        p.stockByBranch[branchId] = Math.max(0, currentStock - it.qty);
      }
      const branchTotals = p.stockByBranch ? Object.values(p.stockByBranch) : [];
      p.stockOnHand = branchTotals.length ? branchTotals.reduce((sum, value) => sum + value, 0) : p.stockOnHand;
      p.updatedAt = now();
    }
  }

  db.sales.unshift(created);
  writeDatabase(db);
  return created;
}

export function listSales(limit = 20) {
  const db = readDatabase();
  return db.sales.slice(0, limit);
}

export function listUsers() {
  const db = readDatabase();
  return db.users.slice();
}

export function saveUsers(users: DemoUser[]) {
  const db = readDatabase();
  db.users = users;
  writeDatabase(db);
  return db.users;
}

export function listBranches() {
  const db = readDatabase();
  return db.branches.slice();
}

export function addBranch(name: string) {
  const db = readDatabase();
  const created: Branch = { id: randomUUID(), name: name.trim(), createdAt: now() };
  db.branches.unshift(created);
  writeDatabase(db);
  return created;
}
