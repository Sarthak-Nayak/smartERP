import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate sequential PV numbers
async function getNextPurchaseVoucherNo(tx: any) {
  const lastVoucher = await tx.purchaseVoucher.findFirst({
    orderBy: { voucherNo: 'desc' }
  });

  let nextVoucherNo = 'PV-0001';

  if (lastVoucher) {
    const vMatch = lastVoucher.voucherNo.match(/PV-(\d+)/);
    if (vMatch) {
      const vNum = parseInt(vMatch[1], 10) + 1;
      nextVoucherNo = `PV-${String(vNum).padStart(4, '0')}`;
    }
  }

  return nextVoucherNo;
}

// GET /api/purchase-vouchers
export async function getPurchaseVouchers(req: Request, res: Response) {
  try {
    const vouchers = await prisma.purchaseVoucher.findMany({
      include: {
        supplier: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    const result = vouchers.map(v => ({
      ...v,
      grandTotal: Number(v.grandTotal)
    }));

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('getPurchaseVouchers error:', error);
    return res.status(500).json({ error: 'Failed to fetch purchase vouchers' });
  }
}

// GET /api/purchase-vouchers/:id
export async function getPurchaseVoucherDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const voucher = await prisma.purchaseVoucher.findUnique({
      where: { id },
      include: {
        supplier: true,
        lines: {
          include: {
            stockItem: true
          }
        }
      }
    });

    if (!voucher) {
      return res.status(404).json({ error: 'Purchase voucher not found' });
    }

    const result = {
      ...voucher,
      grandTotal: Number(voucher.grandTotal),
      lines: voucher.lines.map(line => ({
        ...line,
        quantity: Number(line.quantity),
        rate: Number(line.rate),
        lineTotal: Number(line.lineTotal),
        stockItem: {
          ...line.stockItem,
          purchaseRate: Number(line.stockItem.purchaseRate),
          sellingRate: Number(line.stockItem.sellingRate),
          openingStock: Number(line.stockItem.openingStock),
          gstPercent: Number(line.stockItem.gstPercent)
        }
      }))
    };

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('getPurchaseVoucherDetail error:', error);
    return res.status(500).json({ error: 'Failed to fetch purchase voucher details' });
  }
}

// POST /api/purchase-vouchers
export async function createPurchaseVoucher(req: Request, res: Response) {
  try {
    const { supplierId, date, lines } = req.body;

    if (!supplierId) {
      return res.status(400).json({ error: 'Supplier is required', field: 'supplierId' });
    }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required', field: 'lines' });
    }

    // Run transaction
    const savedVoucher = await prisma.$transaction(async (tx) => {
      // 1. Verify supplier exists
      const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier) {
        throw new Error('SUPPLIER_NOT_FOUND');
      }

      let computedGrandTotal = 0;
      const processedLines = [];

      for (const line of lines) {
        let itemId = line.stockItemId;
        const qtyVal = Number(line.quantity);
        const rateVal = Number(line.rate);

        if (isNaN(qtyVal) || qtyVal <= 0) {
          throw new Error('INVALID_QUANTITY');
        }

        if (isNaN(rateVal) || rateVal < 0) {
          throw new Error('INVALID_RATE');
        }

        // 2. Allow inline stock item creation
        if (!itemId && line.stockItem) {
          const { name, sku, unit, purchaseRate, sellingRate, gstPercent } = line.stockItem;
          if (!name || !sku || !unit || purchaseRate === undefined || sellingRate === undefined) {
            throw new Error('INCOMPLETE_INLINE_ITEM');
          }

          // Check if SKU exists
          const existingSku = await tx.stockItem.findUnique({ where: { sku } });
          if (existingSku) {
            throw new Error(`SKU_ALREADY_EXISTS:${sku}`);
          }

          const newItem = await tx.stockItem.create({
            data: {
              name,
              sku,
              unit,
              purchaseRate: Number(purchaseRate),
              sellingRate: Number(sellingRate),
              openingStock: 0,
              gstPercent: gstPercent ? Number(gstPercent) : 0
            }
          });

          itemId = newItem.id;
        }

        if (!itemId) {
          throw new Error('STOCK_ITEM_REQUIRED');
        }

        // 3. Verify stock item exists if not created inline
        const stockItem = await tx.stockItem.findUnique({ where: { id: itemId } });
        if (!stockItem) {
          throw new Error(`STOCK_ITEM_NOT_FOUND:${itemId}`);
        }

        const lineTotal = qtyVal * rateVal;
        computedGrandTotal += lineTotal;

        processedLines.push({
          stockItemId: itemId,
          quantity: qtyVal,
          rate: rateVal,
          lineTotal
        });
      }

      // 4. Generate sequential numbers
      const nextVoucherNo = await getNextPurchaseVoucherNo(tx);

      // 5. Save Purchase Voucher
      const voucher = await tx.purchaseVoucher.create({
        data: {
          voucherNo: nextVoucherNo,
          supplierId,
          date: date ? new Date(date) : new Date(),
          grandTotal: computedGrandTotal,
          lines: {
            create: processedLines.map(pl => ({
              stockItemId: pl.stockItemId,
              quantity: pl.quantity,
              rate: pl.rate,
              lineTotal: pl.lineTotal
            }))
          }
        },
        include: {
          lines: {
            include: { stockItem: true }
          },
          supplier: true
        }
      });

      return voucher;
    });

    // Format output
    const result = {
      ...savedVoucher,
      grandTotal: Number(savedVoucher.grandTotal),
      lines: savedVoucher.lines.map(line => ({
        ...line,
        quantity: Number(line.quantity),
        rate: Number(line.rate),
        lineTotal: Number(line.lineTotal),
        stockItem: {
          ...line.stockItem,
          purchaseRate: Number(line.stockItem.purchaseRate),
          sellingRate: Number(line.stockItem.sellingRate),
          openingStock: Number(line.stockItem.openingStock),
          gstPercent: Number(line.stockItem.gstPercent)
        }
      }))
    };

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('createPurchaseVoucher error:', error.message || error);

    const errMsg = error.message || '';
    if (errMsg === 'SUPPLIER_NOT_FOUND') {
      return res.status(400).json({ error: 'Selected supplier was not found.', field: 'supplierId' });
    }
    if (errMsg === 'STOCK_ITEM_REQUIRED') {
      return res.status(400).json({ error: 'Stock item is required for each line.' });
    }
    if (errMsg.startsWith('STOCK_ITEM_NOT_FOUND:')) {
      return res.status(400).json({ error: 'One or more stock items were not found.' });
    }
    if (errMsg === 'INVALID_QUANTITY') {
      return res.status(400).json({ error: 'Quantity must be a positive number.' });
    }
    if (errMsg === 'INVALID_RATE') {
      return res.status(400).json({ error: 'Rate must be zero or a positive number.' });
    }
    if (errMsg === 'INCOMPLETE_INLINE_ITEM') {
      return res.status(400).json({ error: 'Inline item creation parameters are missing fields.' });
    }
    if (errMsg.startsWith('SKU_ALREADY_EXISTS:')) {
      const sku = errMsg.split(':')[1];
      return res.status(400).json({ error: `An item with SKU '${sku}' already exists.`, field: 'sku' });
    }

    return res.status(500).json({ error: 'Failed to save purchase voucher.' });
  }
}
