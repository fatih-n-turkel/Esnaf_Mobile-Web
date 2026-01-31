export type Role = "ADMİN" | "MÜDÜR" | "PERSONEL";

export type Branch = {
  id: string;
  name: string;
  createdAt: string;
};

export type DemoUser = {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
  landingPath: string;
  branchId?: string | null;
  managerId?: string | null;
};

export type PaymentType = "CASH" | "CARD";
export type PosFeeType = "RATE" | "FIXED";

export type Product = {
  id: string;
  name: string;
  category?: string;
  salePrice: number;   // satış fiyatı
  costPrice: number;   // maliyet
  vatRate: number;     // 0.01 = %1, 0.20 = %20
  criticalStockLevel: number;
  stockOnHand: number;
  stockByBranch?: Record<string, number>;
  qrCode?: string;
  isActive: boolean;
  updatedAt: string;
};

export type SaleItem = {
  productId: string;
  name: string;
  qty: number;
  unitSalePrice: number;
  unitCostPrice: number;
  vatRate: number;
  maxStock?: number;
};

export type Sale = {
  id: string;
  clientRequestId: string; // idempotency
  createdAt: string;
  createdBy: { id: string; name: string; role: Role };
  branchId?: string | null;

  paymentType: PaymentType;
  posFeeType: PosFeeType;
  posFeeValue: number; // RATE ise 0.02, FIXED ise 5 gibi
  posFeeAmount: number;

  totalRevenue: number;
  totalCost: number;
  totalVat: number;
  netProfit: number;

  items: SaleItem[];
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
  scope: "GLOBAL" | "BRANCH" | "USER";
  branchId?: string | null;
  userId?: string | null;
};

export type Category = {
  id: string;
  name: string;
  createdAt: string;
};

export type Settings = {
  defaultVatRate: number;
  posFeeType: PosFeeType;
  posFeeValue: number;
};
