import { Branch, DemoUser, Product, Sale } from "./types";

export function branchLabel(branches: Branch[], branchId?: string | null) {
  if (!branchId) return "Bayi Yok";
  return branches.find((branch) => branch.id === branchId)?.name ?? "Bilinmeyen Bayi";
}

export function getBranchStock(product: Product, branchId?: string | null) {
  if (!branchId) return product.stockOnHand;
  if (!product.stockByBranch) return product.stockOnHand;
  return product.stockByBranch[branchId] ?? 0;
}

export function sumBranchStock(products: Product[], branchId?: string | null) {
  return products.reduce((sum, product) => sum + getBranchStock(product, branchId), 0);
}

export function filterSalesByBranch(sales: Sale[], branchId?: string | null) {
  if (!branchId) return sales;
  return sales.filter((sale) => sale.branchId === branchId);
}

export function filterUsersByBranch(users: DemoUser[], branchId?: string | null) {
  if (!branchId) return users;
  return users.filter((user) => user.branchId === branchId);
}

export function branchOptionsForUser(branches: Branch[], user?: DemoUser | null) {
  if (!user || user.role === "ADMİN") return branches;
  return branches.filter((branch) => branch.id === user.branchId);
}
