export type Role = "ADMİN" | "MÜDÜR" | "PERSONEL" | "YONETIM";

export type BillingCycle = "FREE" | "MONTHLY" | "ANNUAL";

export type PlanFeature = {
  label: string;
};

export type BusinessPlan = {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  maxEmployees: number;
  maxBranches: number;
  features: PlanFeature[];
};

export type Business = {
  id: string;
  name: string;
  planId: string;
  billingCycle: BillingCycle;
  paymentMethod?: string | null;
  createdAt: string;
};

export type BusinessApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type BusinessApplication = {
  id: string;
  businessName: string;
  username: string;
  password: string;
  createdAt: string;
  status: BusinessApplicationStatus;
};

export type Branch = {
  id: string;
  name: string;
  createdAt: string;
  businessId: string;
};

export type DemoUser = {
  id: string;
  businessId?: string | null;
  businessName?: string | null;
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
  businessId: string;
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
  businessId: string;
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
  businessId: string;
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
  businessId: string;
  name: string;
  createdAt: string;
};

export type Settings = {
  businessId: string;
  defaultVatRate: number;
  posFeeType: PosFeeType;
  posFeeValue: number;
};
