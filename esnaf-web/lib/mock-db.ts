import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  Branch,
  Category,
  Product,
  Sale,
  Settings,
  DemoUser,
  Notification,
  Business,
  BusinessPlan,
  BusinessApplication,
} from "./types";

type DatabaseFile = {
  products: Product[];
  categories: Category[];
  settings: Settings[];
  sales: Sale[];
  users: DemoUser[];
  branches: Branch[];
  notifications: Notification[];
  businesses: Business[];
  plans: BusinessPlan[];
  applications: BusinessApplication[];
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
    if (
      !parsed.branches ||
      !parsed.notifications ||
      !Array.isArray(parsed.settings) ||
      !parsed.businesses ||
      !parsed.plans ||
      !parsed.applications
    ) {
      const seed = buildSeedDatabase();
      const merged = {
        ...parsed,
        branches: parsed.branches ?? seed.branches,
        notifications: parsed.notifications ?? seed.notifications,
        settings: Array.isArray(parsed.settings) ? parsed.settings : seed.settings,
        businesses: parsed.businesses ?? seed.businesses,
        plans: parsed.plans ?? seed.plans,
        applications: parsed.applications ?? seed.applications,
      };
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
  const businessBakkalId = "biz-sen-bakkal";
  const businessKasapId = "biz-sen-kasap";
  const branchMainId = randomUUID();
  const branchCoastId = randomUUID();
  const branchKasapId = randomUUID();
  const branches: Branch[] = [
    { id: branchMainId, name: "Merkez Şube", createdAt: now(), businessId: businessBakkalId },
    { id: branchCoastId, name: "Sahil Şube", createdAt: now(), businessId: businessBakkalId },
    { id: branchKasapId, name: "Ana Şube", createdAt: now(), businessId: businessKasapId },
  ];

  const seededProducts: Product[] = [
    {
      id: randomUUID(),
      businessId: businessBakkalId,
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
      businessId: businessBakkalId,
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
      businessId: businessBakkalId,
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
    {
      id: randomUUID(),
      businessId: businessKasapId,
      name: "Dana Kuşbaşı 1KG",
      category: "Kasap",
      salePrice: 420,
      costPrice: 320,
      vatRate: 0.01,
      criticalStockLevel: 6,
      stockOnHand: 24,
      stockByBranch: {
        [branchKasapId]: 24,
      },
      qrCode: "QR-KASAP-0001",
      isActive: true,
      updatedAt: now(),
    },
  ];

  const categories: Category[] = Array.from(
    new Set(
      seededProducts
        .map((product) => `${product.businessId}::${product.category ?? ""}`)
        .filter((category): category is string => Boolean(category))
    )
  ).map((entry) => {
    const [businessId, name] = entry.split("::");
    return {
      id: randomUUID(),
      businessId,
      name,
      createdAt: now(),
    };
  });

  const users: DemoUser[] = [
    {
      id: "user-admin",
      businessId: businessBakkalId,
      businessName: "Şen Bakkal",
      username: "fatih",
      password: "fatih",
      name: "Fatih",
      role: "ADMİN",
      landingPath: "/dashboard",
      branchId: null,
    },
    {
      id: "user-manager",
      businessId: businessBakkalId,
      businessName: "Şen Bakkal",
      username: "mehmet",
      password: "mehmet",
      name: "Mehmet",
      role: "MÜDÜR",
      landingPath: "/dashboard",
      branchId: branchMainId,
    },
    {
      id: "user-personnel",
      businessId: businessBakkalId,
      businessName: "Şen Bakkal",
      username: "cenk",
      password: "cenk",
      name: "Cenk",
      role: "PERSONEL",
      landingPath: "/sales/quick",
      branchId: branchMainId,
      managerId: "user-manager",
    },
    {
      id: "user-personnel-2",
      businessId: businessBakkalId,
      businessName: "Şen Bakkal",
      username: "ahmet",
      password: "ahmet",
      name: "Ahmet",
      role: "PERSONEL",
      landingPath: "/sales/quick",
      branchId: branchMainId,
      managerId: "user-manager",
    },
    {
      id: "user-system",
      businessId: null,
      businessName: null,
      username: "yönetim",
      password: "1234",
      name: "Esnaf Yönetim",
      role: "YONETIM",
      landingPath: "/admin",
      branchId: null,
    },
    {
      id: "user-kasap-admin",
      businessId: businessKasapId,
      businessName: "Şen Kasap",
      username: "veli",
      password: "veli",
      name: "Veli",
      role: "ADMİN",
      landingPath: "/dashboard",
      branchId: null,
    },
    {
      id: "user-kasap-staff",
      businessId: businessKasapId,
      businessName: "Şen Kasap",
      username: "taner",
      password: "taner",
      name: "Taner",
      role: "PERSONEL",
      landingPath: "/sales/quick",
      branchId: branchKasapId,
      managerId: "user-kasap-admin",
    },
  ];

  const sales = buildSeedSales(seededProducts, users, branches);
  const notifications: Notification[] = [
    {
      id: randomUUID(),
      businessId: businessBakkalId,
      title: "Kritik stok uyarısı",
      message: "Merkez Şube için kritik stok seviyesi görüldü.",
      createdAt: now(),
      readAt: null,
      scope: "BRANCH",
      branchId: branchMainId,
    },
    {
      id: randomUUID(),
      businessId: businessBakkalId,
      title: "Gün sonu satış özeti",
      message: "Bugünkü satışlar raporlandı. Analiz sayfasına göz atın.",
      createdAt: now(),
      readAt: null,
      scope: "GLOBAL",
    },
  ];

  const plans: BusinessPlan[] = [
    {
      id: "plan-free",
      name: "Ücretsiz",
      monthlyPrice: 0,
      annualPrice: 0,
      maxEmployees: 1,
      maxBranches: 1,
      features: [
        { label: "Dashboard ekranı" },
        { label: "Hızlı satış" },
      ],
    },
    {
      id: "plan-basic",
      name: "Basic",
      monthlyPrice: 499,
      annualPrice: 499 * 12 * 0.8,
      maxEmployees: 5,
      maxBranches: 1,
      features: [
        { label: "Hızlı satış sistemleri" },
        { label: "5 çalışan / 1 şube" },
      ],
    },
    {
      id: "plan-pro",
      name: "Pro",
      monthlyPrice: 999,
      annualPrice: 999 * 12 * 0.8,
      maxEmployees: 50,
      maxBranches: 3,
      features: [
        { label: "Tüm özellikler aktif" },
        { label: "50 çalışan / 3 şube" },
      ],
    },
  ];

  const businesses: Business[] = [
    {
      id: businessBakkalId,
      name: "Şen Bakkal",
      planId: "plan-basic",
      billingCycle: "MONTHLY",
      paymentMethods: [
        {
          id: randomUUID(),
          label: "Ana Kart",
          holderName: "Fatih Yılmaz",
          cardNumber: "4111 1111 1111 3281",
          expMonth: "12",
          expYear: "2027",
          cvc: "123",
        },
      ],
      createdAt: now(),
    },
    {
      id: businessKasapId,
      name: "Şen Kasap",
      planId: "plan-free",
      billingCycle: "FREE",
      paymentMethods: [],
      createdAt: now(),
    },
  ];

  const applications: BusinessApplication[] = [
    {
      id: randomUUID(),
      businessName: "Örnek Market",
      username: "ornekadmin",
      password: "1234",
      createdAt: now(),
      status: "PENDING",
    },
  ];

  return {
    products: seededProducts,
    categories,
    settings: [
      { businessId: businessBakkalId, defaultVatRate: 0.2, posFeeType: "RATE", posFeeValue: 0.02 },
      { businessId: businessKasapId, defaultVatRate: 0.2, posFeeType: "RATE", posFeeValue: 0.02 },
    ],
    sales,
    users,
    branches,
    notifications,
    businesses,
    plans,
    applications,
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
    const businessId =
      createdBy.businessId ?? branches.find((branch) => branch.id === branchId)?.businessId ?? products[0]?.businessId;

    return {
      id: randomUUID(),
      businessId: businessId ?? "biz-sen-bakkal",
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

export function listProducts(businessId?: string | null) {
  const db = readDatabase();
  return db.products.filter((p) => p.isActive).filter((p) => !businessId || p.businessId === businessId);
}

export function addProduct(input: Omit<Product, "id" | "updatedAt" | "isActive">) {
  const db = readDatabase();
  const defaultBranchId = db.branches.find((branch) => branch.businessId === input.businessId)?.id;
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
    ensureCategory(db, created.category, created.businessId);
  }
  writeDatabase(db);
  return created;
}

export function updateProductMeta(
  productId: string,
  updates: { qrCode?: string; vatRate?: number; category?: string | null }
) {
  const db = readDatabase();
  const product = db.products.find((p) => p.id === productId);
  if (!product) return null;
  const nextCode = updates.qrCode?.trim() || product.qrCode || makeQrCode(product.name);
  product.qrCode = nextCode;
  if (typeof updates.vatRate === "number" && !Number.isNaN(updates.vatRate)) {
    product.vatRate = updates.vatRate;
  }
  if (updates.category !== undefined) {
    const nextCategory = updates.category ? updates.category.trim() : "";
    product.category = nextCategory || undefined;
    if (nextCategory) {
      ensureCategory(db, nextCategory, product.businessId);
    }
  }
  product.updatedAt = now();
  writeDatabase(db);
  return product;
}

export function updateProductDetails(
  productId: string,
  updates: {
    qrCode?: string;
    vatRate?: number;
    category?: string | null;
    salePrice?: number;
    costPrice?: number;
    criticalStockLevel?: number;
    stockOnHand?: number;
    branchId?: string | null;
  }
) {
  const db = readDatabase();
  const product = db.products.find((p) => p.id === productId);
  if (!product) return null;
  const nextCode = updates.qrCode?.trim() || product.qrCode || makeQrCode(product.name);
  product.qrCode = nextCode;
  if (typeof updates.vatRate === "number" && !Number.isNaN(updates.vatRate)) {
    product.vatRate = updates.vatRate;
  }
  if (updates.category !== undefined) {
    const nextCategory = updates.category ? updates.category.trim() : "";
    product.category = nextCategory || undefined;
    if (nextCategory) {
      ensureCategory(db, nextCategory, product.businessId);
    }
  }
  if (typeof updates.salePrice === "number" && !Number.isNaN(updates.salePrice)) {
    product.salePrice = updates.salePrice;
  }
  if (typeof updates.costPrice === "number" && !Number.isNaN(updates.costPrice)) {
    product.costPrice = updates.costPrice;
  }
  if (typeof updates.criticalStockLevel === "number" && !Number.isNaN(updates.criticalStockLevel)) {
    product.criticalStockLevel = updates.criticalStockLevel;
  }
  if (typeof updates.stockOnHand === "number" && !Number.isNaN(updates.stockOnHand)) {
    if (updates.branchId) {
      const nextStockByBranch = { ...(product.stockByBranch ?? {}) };
      nextStockByBranch[updates.branchId] = updates.stockOnHand;
      product.stockByBranch = nextStockByBranch;
      const totals = Object.values(nextStockByBranch);
      product.stockOnHand = totals.reduce((sum, value) => sum + value, 0);
    } else if (product.stockByBranch && Object.keys(product.stockByBranch).length) {
      const entries = Object.entries(product.stockByBranch);
      const currentTotal = entries.reduce((sum, [, value]) => sum + value, 0);
      if (currentTotal > 0) {
        let remaining = updates.stockOnHand;
        const nextStockByBranch: Record<string, number> = {};
        entries.forEach(([branchId, value], index) => {
          const isLast = index === entries.length - 1;
          const nextValue = isLast ? remaining : Math.round((value / currentTotal) * updates.stockOnHand);
          nextStockByBranch[branchId] = nextValue;
          remaining -= nextValue;
        });
        product.stockByBranch = nextStockByBranch;
      } else {
        const [branchId] = entries[0] ?? [];
        if (branchId) {
          product.stockByBranch = { [branchId]: updates.stockOnHand };
        }
      }
      product.stockOnHand = updates.stockOnHand;
    } else {
      product.stockOnHand = updates.stockOnHand;
    }
  }
  product.updatedAt = now();
  writeDatabase(db);
  return product;
}

export function deleteProduct(productId: string) {
  const db = readDatabase();
  const index = db.products.findIndex((p) => p.id === productId);
  if (index === -1) return null;
  const [removed] = db.products.splice(index, 1);
  writeDatabase(db);
  return removed;
}

function ensureCategory(db: DatabaseFile, name: string, businessId: string) {
  const exists = db.categories.find(
    (c) => c.businessId === businessId && c.name.toLowerCase() === name.toLowerCase()
  );
  if (exists) return exists;
  const created: Category = { id: randomUUID(), name, createdAt: now(), businessId };
  db.categories.unshift(created);
  return created;
}

export function listCategories(businessId?: string | null) {
  const db = readDatabase();
  return db.categories
    .filter((category) => !businessId || category.businessId === businessId)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

export function addCategory(name: string, businessId: string) {
  const db = readDatabase();
  const created = ensureCategory(db, name.trim(), businessId);
  writeDatabase(db);
  return created;
}

export function renameCategory(categoryId: string, name: string) {
  const db = readDatabase();
  const category = db.categories.find((c) => c.id === categoryId);
  if (!category) return null;
  const nextName = name.trim();
  if (!nextName) return null;
  const prevName = category.name;
  category.name = nextName;
  db.products = db.products.map((product) =>
    product.category === prevName && product.businessId === category.businessId
      ? { ...product, category: nextName, updatedAt: now() }
      : product
  );
  writeDatabase(db);
  return category;
}

export function deleteCategory(categoryId: string) {
  const db = readDatabase();
  const index = db.categories.findIndex((c) => c.id === categoryId);
  if (index === -1) return null;
  const [removed] = db.categories.splice(index, 1);
  db.products = db.products.map((product) =>
    product.category === removed.name && product.businessId === removed.businessId
      ? { ...product, category: undefined, updatedAt: now() }
      : product
  );
  writeDatabase(db);
  return removed;
}

export function getSettings(businessId: string) {
  const db = readDatabase();
  const existing = db.settings.find((setting) => setting.businessId === businessId);
  if (existing) return existing;
  const created: Settings = {
    businessId,
    defaultVatRate: 0.2,
    posFeeType: "RATE",
    posFeeValue: 0.02,
  };
  db.settings.push(created);
  writeDatabase(db);
  return created;
}

export function updateSettings(businessId: string, partial: Partial<Settings>) {
  const db = readDatabase();
  const existing = db.settings.find((setting) => setting.businessId === businessId);
  if (!existing) {
    const created = {
      businessId,
      defaultVatRate: partial.defaultVatRate ?? 0.2,
      posFeeType: partial.posFeeType ?? "RATE",
      posFeeValue: partial.posFeeValue ?? 0.02,
    };
    db.settings.push(created);
    writeDatabase(db);
    return created;
  }
  const next = { ...existing, ...partial, businessId };
  db.settings = db.settings.map((setting) => (setting.businessId === businessId ? next : setting));
  writeDatabase(db);
  return next;
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
        const branchId =
          created.branchId ??
          db.branches.find((branch) => branch.businessId === created.businessId)?.id;
        if (branchId) {
          if (!p.stockByBranch) p.stockByBranch = {};
          const currentStock = p.stockByBranch[branchId] ?? 0;
        const nextStock = Math.max(0, currentStock - it.qty);
        p.stockByBranch[branchId] = nextStock;
        if (currentStock > 0 && nextStock === 0) {
          const branchName = db.branches.find((b) => b.id === branchId)?.name ?? "Şube";
          db.notifications.unshift({
            id: randomUUID(),
            businessId: created.businessId,
            title: "Stok tükendi",
            message: `${p.name} ürünü ${branchName} için tükendi.`,
            createdAt: now(),
            readAt: null,
            scope: "BRANCH",
            branchId,
          });
        }
      }
      const branchTotals = p.stockByBranch ? Object.values(p.stockByBranch) : [];
      p.stockOnHand = branchTotals.length ? branchTotals.reduce((sum, value) => sum + value, 0) : p.stockOnHand;
      p.updatedAt = now();
    }
  }

  db.sales.unshift(created);
  db.notifications.unshift({
    id: randomUUID(),
    businessId: created.businessId,
    title: "Yeni satış oluşturuldu",
    message: `${created.createdBy?.name ?? "Kullanıcı"} yeni bir satış yaptı.`,
    createdAt: now(),
    readAt: null,
    scope: "BRANCH",
    branchId: created.branchId ?? null,
  });
  writeDatabase(db);
  return created;
}

export function listSales(businessId?: string | null, limit = 20) {
  const db = readDatabase();
  if (businessId === "all") {
    return db.sales.slice(0, limit);
  }
  return db.sales.filter((sale) => !businessId || sale.businessId === businessId).slice(0, limit);
}

export function listUsers(businessId?: string | null) {
  const db = readDatabase();
  return db.users.filter((user) => !businessId || user.businessId === businessId).slice();
}

export function saveUsers(users: DemoUser[]) {
  const db = readDatabase();
  db.users = users;
  writeDatabase(db);
  return db.users;
}

export function listBusinesses() {
  const db = readDatabase();
  return db.businesses.slice();
}

export function updateBusiness(businessId: string, partial: Partial<Business>) {
  const db = readDatabase();
  const business = db.businesses.find((b) => b.id === businessId);
  if (!business) return null;
  const next = { ...business, ...partial, id: businessId };
  db.businesses = db.businesses.map((b) => (b.id === businessId ? next : b));
  writeDatabase(db);
  return next;
}

export function deleteBusiness(businessId: string) {
  const db = readDatabase();
  db.businesses = db.businesses.filter((b) => b.id !== businessId);
  db.users = db.users.filter((u) => u.businessId !== businessId);
  db.products = db.products.filter((p) => p.businessId !== businessId);
  db.categories = db.categories.filter((c) => c.businessId !== businessId);
  db.sales = db.sales.filter((s) => s.businessId !== businessId);
  db.branches = db.branches.filter((b) => b.businessId !== businessId);
  db.notifications = db.notifications.filter((n) => n.businessId !== businessId);
  db.settings = db.settings.filter((s) => s.businessId !== businessId);
  writeDatabase(db);
}

export function listPlans() {
  const db = readDatabase();
  return db.plans.slice();
}

export function savePlans(plans: BusinessPlan[]) {
  const db = readDatabase();
  db.plans = plans;
  writeDatabase(db);
  return db.plans;
}

export function listApplications() {
  const db = readDatabase();
  return db.applications.slice();
}

export function addApplication(application: Omit<BusinessApplication, "id" | "createdAt" | "status">) {
  const db = readDatabase();
  const created: BusinessApplication = {
    id: randomUUID(),
    createdAt: now(),
    status: "PENDING",
    ...application,
  };
  db.applications.unshift(created);
  writeDatabase(db);
  return created;
}

export function updateApplication(
  applicationId: string,
  status: BusinessApplication["status"],
  options?: { createBusiness?: boolean }
) {
  const db = readDatabase();
  const application = db.applications.find((app) => app.id === applicationId);
  if (!application) return null;
  application.status = status;
  if (status === "APPROVED" && options?.createBusiness) {
    const businessId = `biz-${application.businessName.toLowerCase().replace(/\s+/g, "-")}`;
    if (!db.businesses.find((b) => b.id === businessId)) {
      db.businesses.unshift({
        id: businessId,
        name: application.businessName,
        planId: "plan-free",
        billingCycle: "FREE",
        paymentMethods: [],
        createdAt: now(),
      });
      db.settings.push({
        businessId,
        defaultVatRate: 0.2,
        posFeeType: "RATE",
        posFeeValue: 0.02,
      });
    }
    db.users.unshift({
      id: `user-${application.username}`,
      businessId,
      businessName: application.businessName,
      username: application.username,
      password: application.password,
      name: application.username,
      role: "ADMİN",
      landingPath: "/dashboard",
      branchId: null,
    });
  }
  writeDatabase(db);
  return application;
}

export function updateUserCredentials(userId: string, updates: { username?: string; password?: string }) {
  const db = readDatabase();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  const nextUsername = updates.username?.trim() || user.username;
  const nextPassword = updates.password?.trim() || user.password;
  user.username = nextUsername;
  user.password = nextPassword;
  writeDatabase(db);
  return user;
}

export function listBranches(businessId?: string | null) {
  const db = readDatabase();
  return db.branches.filter((branch) => !businessId || branch.businessId === businessId).slice();
}

export function addBranch(name: string, businessId: string) {
  const db = readDatabase();
  const created: Branch = { id: randomUUID(), name: name.trim(), createdAt: now(), businessId };
  db.branches.unshift(created);
  writeDatabase(db);
  return created;
}

export function listNotifications(businessId?: string | null) {
  const db = readDatabase();
  return db.notifications.filter((note) => !businessId || note.businessId === businessId).slice();
}

export function addNotification(input: Omit<Notification, "id" | "createdAt">) {
  const db = readDatabase();
  const created: Notification = {
    ...input,
    id: randomUUID(),
    createdAt: now(),
  };
  db.notifications.unshift(created);
  writeDatabase(db);
  return created;
}

export function markNotificationsRead(ids: string[]) {
  const db = readDatabase();
  const nowAt = now();
  db.notifications = db.notifications.map((n) =>
    ids.includes(n.id) ? { ...n, readAt: n.readAt ?? nowAt } : n
  );
  writeDatabase(db);
  return db.notifications;
}
