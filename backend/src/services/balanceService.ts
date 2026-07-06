import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculates the outstanding balance for a single customer.
 * Outstanding = openingBalance + sum(salesVouchers) - sum(customerPayments)
 */
export async function getCustomerOutstanding(customerId: string): Promise<number> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { openingBalance: true }
  });

  if (!customer) {
    throw new Error(`Customer with ID ${customerId} not found`);
  }

  const salesAgg = await prisma.salesVoucher.aggregate({
    where: { customerId },
    _sum: { grandTotal: true }
  });

  const paymentsAgg = await prisma.customerPayment.aggregate({
    where: { customerId },
    _sum: { amount: true }
  });

  const totalSales = Number(salesAgg._sum.grandTotal || 0);
  const totalPayments = Number(paymentsAgg._sum.amount || 0);

  return Number(customer.openingBalance) + totalSales - totalPayments;
}

/**
 * Calculates outstanding balances for multiple customers in batch to avoid N+1 queries.
 */
export async function getCustomerBalancesBatch(customerIds: string[]): Promise<Record<string, number>> {
  if (customerIds.length === 0) return {};

  const salesAgg = await prisma.salesVoucher.groupBy({
    by: ['customerId'],
    where: { customerId: { in: customerIds } },
    _sum: { grandTotal: true }
  });

  const paymentsAgg = await prisma.customerPayment.groupBy({
    by: ['customerId'],
    where: { customerId: { in: customerIds } },
    _sum: { amount: true }
  });

  const salesMap: Record<string, number> = {};
  salesAgg.forEach(item => {
    salesMap[item.customerId] = Number(item._sum.grandTotal || 0);
  });

  const paymentsMap: Record<string, number> = {};
  paymentsAgg.forEach(item => {
    paymentsMap[item.customerId] = Number(item._sum.amount || 0);
  });

  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, openingBalance: true }
  });

  const balances: Record<string, number> = {};
  customers.forEach(cust => {
    const totalSales = salesMap[cust.id] || 0;
    const totalPayments = paymentsMap[cust.id] || 0;
    balances[cust.id] = Number(cust.openingBalance) + totalSales - totalPayments;
  });

  return balances;
}

/**
 * Calculates the outstanding balance for a single supplier.
 * Outstanding = openingBalance + sum(purchaseVouchers) - sum(supplierPayments)
 */
export async function getSupplierOutstanding(supplierId: string): Promise<number> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { openingBalance: true }
  });

  if (!supplier) {
    throw new Error(`Supplier with ID ${supplierId} not found`);
  }

  const purchasesAgg = await prisma.purchaseVoucher.aggregate({
    where: { supplierId },
    _sum: { grandTotal: true }
  });

  const paymentsAgg = await prisma.supplierPayment.aggregate({
    where: { supplierId },
    _sum: { amount: true }
  });

  const totalPurchases = Number(purchasesAgg._sum.grandTotal || 0);
  const totalPayments = Number(paymentsAgg._sum.amount || 0);

  return Number(supplier.openingBalance) + totalPurchases - totalPayments;
}

/**
 * Calculates outstanding balances for multiple suppliers in batch to avoid N+1 queries.
 */
export async function getSupplierBalancesBatch(supplierIds: string[]): Promise<Record<string, number>> {
  if (supplierIds.length === 0) return {};

  const purchasesAgg = await prisma.purchaseVoucher.groupBy({
    by: ['supplierId'],
    where: { supplierId: { in: supplierIds } },
    _sum: { grandTotal: true }
  });

  const paymentsAgg = await prisma.supplierPayment.groupBy({
    by: ['supplierId'],
    where: { supplierId: { in: supplierIds } },
    _sum: { amount: true }
  });

  const purchasesMap: Record<string, number> = {};
  purchasesAgg.forEach(item => {
    purchasesMap[item.supplierId] = Number(item._sum.grandTotal || 0);
  });

  const paymentsMap: Record<string, number> = {};
  paymentsAgg.forEach(item => {
    paymentsMap[item.supplierId] = Number(item._sum.amount || 0);
  });

  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: supplierIds } },
    select: { id: true, openingBalance: true }
  });

  const balances: Record<string, number> = {};
  suppliers.forEach(supp => {
    const totalPurchases = purchasesMap[supp.id] || 0;
    const totalPayments = paymentsMap[supp.id] || 0;
    balances[supp.id] = Number(supp.openingBalance) + totalPurchases - totalPayments;
  });

  return balances;
}
