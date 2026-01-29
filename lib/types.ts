export type Role = "ADMIN" | "MANAGER" | "STAFF";

export type PaymentType = "CASH" | "CARD" | "IBAN";
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
};

export type Sale = {
  id: string;
  clientRequestId: string; // idempotency
  createdAt: string;
  createdBy: { id: string; name: string; role: Role };

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
