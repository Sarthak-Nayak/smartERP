import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculates current quantity of a single stock item.
 * Current Qty = openingStock + sum(purchaseLines) - sum(salesLines)
 */
export async function getItemQuantity(itemId: string): Promise<number> {
  const item = await prisma.stockItem.findUnique({
    where: { id: itemId },
    select: { openingStock: true }
  });

  if (!item) {
    throw new Error(`Stock item with ID ${itemId} not found`);
  }

  const purchaseAgg = await prisma.purchaseVoucherLine.aggregate({
    where: { stockItemId: itemId },
    _sum: { quantity: true }
  });

  const salesAgg = await prisma.salesVoucherLine.aggregate({
    where: { stockItemId: itemId },
    _sum: { quantity: true }
  });

  const totalPurchases = Number(purchaseAgg._sum.quantity || 0);
  const totalSales = Number(salesAgg._sum.quantity || 0);

  return Number(item.openingStock) + totalPurchases - totalSales;
}

/**
 * Calculates current quantity for multiple items in batch to avoid N+1 queries.
 */
export async function getItemQuantitiesBatch(itemIds: string[]): Promise<Record<string, number>> {
  if (itemIds.length === 0) return {};

  const purchaseAgg = await prisma.purchaseVoucherLine.groupBy({
    by: ['stockItemId'],
    where: { stockItemId: { in: itemIds } },
    _sum: { quantity: true }
  });

  const salesAgg = await prisma.salesVoucherLine.groupBy({
    by: ['stockItemId'],
    where: { stockItemId: { in: itemIds } },
    _sum: { quantity: true }
  });

  const purchaseMap: Record<string, number> = {};
  purchaseAgg.forEach(item => {
    purchaseMap[item.stockItemId] = Number(item._sum.quantity || 0);
  });

  const salesMap: Record<string, number> = {};
  salesAgg.forEach(item => {
    salesMap[item.stockItemId] = Number(item._sum.quantity || 0);
  });

  const items = await prisma.stockItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, openingStock: true }
  });

  const quantities: Record<string, number> = {};
  items.forEach(item => {
    const totalPurchases = purchaseMap[item.id] || 0;
    const totalSales = salesMap[item.id] || 0;
    quantities[item.id] = Number(item.openingStock) + totalPurchases - totalSales;
  });

  return quantities;
}

/**
 * Validates if the requested quantity is available in stock.
 */
export async function isStockAvailable(itemId: string, requestedQty: number): Promise<boolean> {
  const currentQty = await getItemQuantity(itemId);
  return currentQty >= requestedQty;
}
