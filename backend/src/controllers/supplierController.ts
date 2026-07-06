import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getSupplierOutstanding, getSupplierBalancesBatch } from '../services/balanceService';

const prisma = new PrismaClient();

// GET /api/suppliers
export async function getSuppliers(req: Request, res: Response) {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    });

    const ids = suppliers.map(s => s.id);
    const balances = await getSupplierBalancesBatch(ids);

    const result = suppliers.map(s => ({
      ...s,
      openingBalance: Number(s.openingBalance),
      outstandingBalance: balances[s.id] !== undefined ? balances[s.id] : Number(s.openingBalance)
    }));

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('getSuppliers error:', error);
    return res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
}

// POST /api/suppliers
export async function createSupplier(req: Request, res: Response) {
  try {
    const { name, contact, address, openingBalance } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Supplier name is required', field: 'name' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contact: contact || null,
        address: address || null,
        openingBalance: openingBalance ? Number(openingBalance) : 0
      }
    });

    return res.status(201).json({
      ...supplier,
      openingBalance: Number(supplier.openingBalance),
      outstandingBalance: Number(supplier.openingBalance)
    });
  } catch (error: any) {
    console.error('createSupplier error:', error);
    return res.status(500).json({ error: 'Failed to create supplier' });
  }
}

// GET /api/suppliers/:id (Detail + ledger history)
export async function getSupplierDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseVouchers: {
          orderBy: { date: 'asc' }
        },
        payments: {
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Compute current outstanding balance
    const outstandingBalance = await getSupplierOutstanding(id);

    // Build ledger history sorted chronologically
    const history: any[] = [];

    // Add opening balance entry
    history.push({
      id: 'opening-balance',
      date: supplier.createdAt,
      type: 'OPENING',
      particulars: 'Opening Balance',
      debit: Number(supplier.openingBalance) >= 0 ? Number(supplier.openingBalance) : 0,
      credit: Number(supplier.openingBalance) < 0 ? Math.abs(Number(supplier.openingBalance)) : 0,
      refNo: '-'
    });

    supplier.purchaseVouchers.forEach(v => {
      history.push({
        id: v.id,
        date: v.date,
        type: 'PURCHASE',
        particulars: 'Purchase Voucher Posting',
        debit: Number(v.grandTotal),
        credit: 0,
        refNo: v.voucherNo
      });
    });

    supplier.payments.forEach(p => {
      history.push({
        id: p.id,
        date: p.date,
        type: 'PAYMENT',
        particulars: p.note || 'Payment Made',
        debit: 0,
        credit: Number(p.amount),
        refNo: 'PYMT'
      });
    });

    // Sort history by date, keeping opening balance at the start
    history.sort((a, b) => {
      if (a.id === 'opening-balance') return -1;
      if (b.id === 'opening-balance') return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Calculate running balance
    let running = 0;
    const ledger = history.map(entry => {
      if (entry.type === 'OPENING') {
        running = entry.debit - entry.credit;
      } else {
        running = running + entry.debit - entry.credit;
      }
      return {
        ...entry,
        runningBalance: running
      };
    });

    return res.status(200).json({
      supplier: {
        ...supplier,
        openingBalance: Number(supplier.openingBalance),
        outstandingBalance
      },
      ledger
    });
  } catch (error: any) {
    console.error('getSupplierDetail error:', error);
    return res.status(500).json({ error: 'Failed to fetch supplier details' });
  }
}

// PUT /api/suppliers/:id
export async function updateSupplier(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, contact, address, openingBalance } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Supplier name is required', field: 'name' });
    }

    const check = await prisma.supplier.findUnique({ where: { id } });
    if (!check) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        contact: contact || null,
        address: address || null,
        openingBalance: openingBalance !== undefined ? Number(openingBalance) : undefined
      }
    });

    const currentOutstanding = await getSupplierOutstanding(id);

    return res.status(200).json({
      ...supplier,
      openingBalance: Number(supplier.openingBalance),
      outstandingBalance: currentOutstanding
    });
  } catch (error: any) {
    console.error('updateSupplier error:', error);
    return res.status(500).json({ error: 'Failed to update supplier' });
  }
}

// DELETE /api/suppliers/:id
export async function deleteSupplier(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const check = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchaseVouchers: true,
            payments: true
          }
        }
      }
    });

    if (!check) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    if (check._count.purchaseVouchers > 0 || check._count.payments > 0) {
      return res.status(400).json({
        error: 'Cannot delete supplier with active transaction history. Remove related vouchers and payments first.'
      });
    }

    await prisma.supplier.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (error: any) {
    console.error('deleteSupplier error:', error);
    return res.status(500).json({ error: 'Failed to delete supplier' });
  }
}

// POST /api/suppliers/:id/payments
export async function recordSupplierPayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { amount, date, note } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0', field: 'amount' });
    }

    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const payment = await prisma.supplierPayment.create({
      data: {
        supplierId: id,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        note: note || null
      }
    });

    const outstandingBalance = await getSupplierOutstanding(id);

    return res.status(201).json({
      payment: {
        ...payment,
        amount: Number(payment.amount)
      },
      outstandingBalance
    });
  } catch (error: any) {
    console.error('recordSupplierPayment error:', error);
    return res.status(500).json({ error: 'Failed to record payment' });
  }
}
