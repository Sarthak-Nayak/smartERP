import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateInvoicePDF } from '../services/pdfService';

const prisma = new PrismaClient();

// Helper to generate sequential SV and INV numbers
async function getNextSalesVoucherAndInvoiceNo(tx: any) {
  // Find last sales voucher by invoiceNo/voucherNo descending
  const lastVoucher = await tx.salesVoucher.findFirst({
    orderBy: { voucherNo: 'desc' }
  });

  let nextVoucherNo = 'SV-0001';
  let nextInvoiceNo = 'INV-0001';

  if (lastVoucher) {
    const vMatch = lastVoucher.voucherNo.match(/SV-(\d+)/);
    if (vMatch) {
      const vNum = parseInt(vMatch[1], 10) + 1;
      nextVoucherNo = `SV-${String(vNum).padStart(4, '0')}`;
    }
    
    const iMatch = lastVoucher.invoiceNo.match(/INV-(\d+)/);
    if (iMatch) {
      const iNum = parseInt(iMatch[1], 10) + 1;
      nextInvoiceNo = `INV-${String(iNum).padStart(4, '0')}`;
    }
  }

  return { nextVoucherNo, nextInvoiceNo };
}

// GET /api/sales-vouchers
export async function getSalesVouchers(req: Request, res: Response) {
  try {
    const vouchers = await prisma.salesVoucher.findMany({
      include: {
        customer: {
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
    console.error('getSalesVouchers error:', error);
    return res.status(500).json({ error: 'Failed to fetch sales vouchers' });
  }
}

// GET /api/sales-vouchers/:id
export async function getSalesVoucherDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const voucher = await prisma.salesVoucher.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: {
          include: {
            stockItem: true
          }
        }
      }
    });

    if (!voucher) {
      return res.status(404).json({ error: 'Sales voucher not found' });
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
    console.error('getSalesVoucherDetail error:', error);
    return res.status(500).json({ error: 'Failed to fetch sales voucher details' });
  }
}

// POST /api/sales-vouchers
export async function createSalesVoucher(req: Request, res: Response) {
  try {
    const { customerId, date, lines } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer is required', field: 'customerId' });
    }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required', field: 'lines' });
    }

    // Run transaction
    const savedVoucher = await prisma.$transaction(async (tx) => {
      // 1. Verify customer exists
      const customer = await tx.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        throw new Error('CUSTOMER_NOT_FOUND');
      }

      // 2. Validate line items and stock availability, compute totals
      let computedGrandTotal = 0;
      const processedLines = [];

      for (const line of lines) {
        const { stockItemId, quantity, rate } = line;

        if (!stockItemId) {
          throw new Error('STOCK_ITEM_REQUIRED');
        }

        const qtyVal = Number(quantity);
        if (isNaN(qtyVal) || qtyVal <= 0) {
          throw new Error('INVALID_QUANTITY');
        }

        const rateVal = Number(rate);
        if (isNaN(rateVal) || rateVal < 0) {
          throw new Error('INVALID_RATE');
        }

        // Fetch stock item and current quantity
        const stockItem = await tx.stockItem.findUnique({
          where: { id: stockItemId },
          include: {
            purchaseLines: { select: { quantity: true } },
            saleLines: { select: { quantity: true } }
          }
        });

        if (!stockItem) {
          throw new Error(`STOCK_ITEM_NOT_FOUND:${stockItemId}`);
        }

        const purchaseQty = stockItem.purchaseLines.reduce((sum, p) => sum + Number(p.quantity), 0);
        const saleQty = stockItem.saleLines.reduce((sum, s) => sum + Number(s.quantity), 0);
        const currentQty = Number(stockItem.openingStock) + purchaseQty - saleQty;

        if (currentQty - qtyVal < 0) {
          throw new Error(`INSUFFICIENT_STOCK:${stockItem.name}:${currentQty}`);
        }

        const lineTotal = qtyVal * rateVal;
        computedGrandTotal += lineTotal;

        processedLines.push({
          stockItemId,
          quantity: qtyVal,
          rate: rateVal,
          lineTotal
        });
      }

      // 3. Generate sequential numbers
      const { nextVoucherNo, nextInvoiceNo } = await getNextSalesVoucherAndInvoiceNo(tx);

      // 4. Save Sales Voucher
      const voucher = await tx.salesVoucher.create({
        data: {
          voucherNo: nextVoucherNo,
          invoiceNo: nextInvoiceNo,
          customerId,
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
          customer: true
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
    console.error('createSalesVoucher error:', error.message || error);
    
    // Custom error handling mapping to appropriate HTTP statuses
    const errMsg = error.message || '';
    if (errMsg.startsWith('INSUFFICIENT_STOCK:')) {
      const parts = errMsg.split(':');
      const itemName = parts[1];
      const currentQty = parts[2];
      return res.status(409).json({
        error: `Insufficient stock for '${itemName}'. Available quantity: ${currentQty}.`
      });
    }

    if (errMsg === 'CUSTOMER_NOT_FOUND') {
      return res.status(400).json({ error: 'Selected customer was not found.', field: 'customerId' });
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

    return res.status(500).json({ error: 'Failed to save sales voucher.' });
  }
}

// GET /api/sales-vouchers/:id/invoice-pdf
export async function getInvoicePDF(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const voucher = await prisma.salesVoucher.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: {
          include: {
            stockItem: true
          }
        }
      }
    });

    if (!voucher) {
      return res.status(404).json({ error: 'Sales voucher not found' });
    }

    // Format details
    const formattedVoucher = {
      voucherNo: voucher.voucherNo,
      invoiceNo: voucher.invoiceNo,
      date: voucher.date,
      grandTotal: Number(voucher.grandTotal),
      customer: {
        name: voucher.customer.name,
        mobile: voucher.customer.mobile,
        address: voucher.customer.address
      },
      lines: voucher.lines.map(line => ({
        stockItem: {
          name: line.stockItem.name,
          sku: line.stockItem.sku,
          unit: line.stockItem.unit
        },
        quantity: Number(line.quantity),
        rate: Number(line.rate),
        lineTotal: Number(line.lineTotal)
      }))
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${voucher.invoiceNo}.pdf`);

    // Stream PDF response
    generateInvoicePDF(formattedVoucher, res);
  } catch (error: any) {
    console.error('getInvoicePDF error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to generate PDF invoice.' });
    }
  }
}
