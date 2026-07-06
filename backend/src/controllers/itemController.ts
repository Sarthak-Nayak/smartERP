import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getItemQuantity, getItemQuantitiesBatch } from '../services/quantityService';

const prisma = new PrismaClient();

// GET /api/items
export async function getItems(req: Request, res: Response) {
  try {
    const items = await prisma.stockItem.findMany({
      orderBy: { name: 'asc' }
    });

    const ids = items.map(item => item.id);
    const quantities = await getItemQuantitiesBatch(ids);

    const result = items.map(item => ({
      ...item,
      purchaseRate: Number(item.purchaseRate),
      sellingRate: Number(item.sellingRate),
      openingStock: Number(item.openingStock),
      gstPercent: Number(item.gstPercent),
      currentQuantity: quantities[item.id] !== undefined ? quantities[item.id] : Number(item.openingStock)
    }));

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('getItems error:', error);
    return res.status(500).json({ error: 'Failed to fetch items' });
  }
}

// POST /api/items
export async function createItem(req: Request, res: Response) {
  try {
    const { name, sku, unit, purchaseRate, sellingRate, openingStock, gstPercent } = req.body;

    if (!name || !sku || !unit || purchaseRate === undefined || sellingRate === undefined) {
      return res.status(400).json({ error: 'Missing required item fields (name, sku, unit, purchaseRate, sellingRate)' });
    }

    // Check SKU uniqueness
    const existing = await prisma.stockItem.findUnique({ where: { sku } });
    if (existing) {
      return res.status(400).json({ error: 'SKU must be unique', field: 'sku' });
    }

    const item = await prisma.stockItem.create({
      data: {
        name,
        sku,
        unit,
        purchaseRate: Number(purchaseRate),
        sellingRate: Number(sellingRate),
        openingStock: openingStock ? Number(openingStock) : 0,
        gstPercent: gstPercent ? Number(gstPercent) : 0
      }
    });

    return res.status(201).json({
      ...item,
      purchaseRate: Number(item.purchaseRate),
      sellingRate: Number(item.sellingRate),
      openingStock: Number(item.openingStock),
      gstPercent: Number(item.gstPercent),
      currentQuantity: Number(item.openingStock)
    });
  } catch (error: any) {
    console.error('createItem error:', error);
    return res.status(500).json({ error: 'Failed to create item' });
  }
}

// GET /api/items/:id (Detail + stock movement history)
export async function getItemDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const item = await prisma.stockItem.findUnique({
      where: { id },
      include: {
        saleLines: {
          include: {
            salesVoucher: {
              include: { customer: true }
            }
          }
        },
        purchaseLines: {
          include: {
            purchaseVoucher: {
              include: { supplier: true }
            }
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const currentQuantity = await getItemQuantity(id);

    // Build movement history
    const history: any[] = [];

    // Add opening stock entry
    history.push({
      id: 'opening-stock',
      date: item.createdAt,
      type: 'OPENING',
      party: 'System Initial',
      qtyIn: Number(item.openingStock) >= 0 ? Number(item.openingStock) : 0,
      qtyOut: 0,
      refNo: '-'
    });

    item.saleLines.forEach(line => {
      history.push({
        id: line.id,
        date: line.salesVoucher.date,
        type: 'SALE',
        party: line.salesVoucher.customer.name,
        qtyIn: 0,
        qtyOut: Number(line.quantity),
        refNo: line.salesVoucher.voucherNo
      });
    });

    item.purchaseLines.forEach(line => {
      history.push({
        id: line.id,
        date: line.purchaseVoucher.date,
        type: 'PURCHASE',
        party: line.purchaseVoucher.supplier.name,
        qtyIn: Number(line.quantity),
        qtyOut: 0,
        refNo: line.purchaseVoucher.voucherNo
      });
    });

    // Sort chronologically, keep opening stock at the start
    history.sort((a, b) => {
      if (a.id === 'opening-stock') return -1;
      if (b.id === 'opening-stock') return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Calculate running stock quantity
    let running = 0;
    const ledger = history.map(entry => {
      if (entry.type === 'OPENING') {
        running = entry.qtyIn;
      } else {
        running = running + entry.qtyIn - entry.qtyOut;
      }
      return {
        ...entry,
        runningBalance: running
      };
    });

    return res.status(200).json({
      item: {
        ...item,
        purchaseRate: Number(item.purchaseRate),
        sellingRate: Number(item.sellingRate),
        openingStock: Number(item.openingStock),
        gstPercent: Number(item.gstPercent),
        currentQuantity
      },
      ledger
    });
  } catch (error: any) {
    console.error('getItemDetail error:', error);
    return res.status(500).json({ error: 'Failed to fetch item details' });
  }
}

// PUT /api/items/:id
export async function updateItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, sku, unit, purchaseRate, sellingRate, openingStock, gstPercent } = req.body;

    if (!name || !sku || !unit || purchaseRate === undefined || sellingRate === undefined) {
      return res.status(400).json({ error: 'Missing required item fields (name, sku, unit, purchaseRate, sellingRate)' });
    }

    const check = await prisma.stockItem.findUnique({ where: { id } });
    if (!check) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // SKU unique except current item
    const existing = await prisma.stockItem.findFirst({
      where: {
        sku,
        id: { not: id }
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'SKU must be unique', field: 'sku' });
    }

    const item = await prisma.stockItem.update({
      where: { id },
      data: {
        name,
        sku,
        unit,
        purchaseRate: Number(purchaseRate),
        sellingRate: Number(sellingRate),
        openingStock: openingStock !== undefined ? Number(openingStock) : undefined,
        gstPercent: gstPercent !== undefined ? Number(gstPercent) : undefined
      }
    });

    const currentQuantity = await getItemQuantity(id);

    return res.status(200).json({
      ...item,
      purchaseRate: Number(item.purchaseRate),
      sellingRate: Number(item.sellingRate),
      openingStock: Number(item.openingStock),
      gstPercent: Number(item.gstPercent),
      currentQuantity
    });
  } catch (error: any) {
    console.error('updateItem error:', error);
    return res.status(500).json({ error: 'Failed to update item' });
  }
}

// DELETE /api/items/:id
export async function deleteItem(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const check = await prisma.stockItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            saleLines: true,
            purchaseLines: true
          }
        }
      }
    });

    if (!check) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (check._count.saleLines > 0 || check._count.purchaseLines > 0) {
      return res.status(400).json({
        error: 'Cannot delete item with active stock movement history. Remove related vouchers first.'
      });
    }

    await prisma.stockItem.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('deleteItem error:', error);
    return res.status(500).json({ error: 'Failed to delete item' });
  }
}
