export type Role = "ADMİN" | "MÜDÜR" | "PERSONEL";

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

export type Category = {
  id: string;
  name: string;
  createdAt: string;
};

export type Settings = {
  defaultVatRate: number;
};
