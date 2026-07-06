import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getCustomerOutstanding, getCustomerBalancesBatch } from '../services/balanceService';

const prisma = new PrismaClient();

// GET /api/customers
export async function getCustomers(req: Request, res: Response) {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' }
    });

    const ids = customers.map(c => c.id);
    const balances = await getCustomerBalancesBatch(ids);

    const result = customers.map(c => ({
      ...c,
      openingBalance: Number(c.openingBalance),
      outstandingBalance: balances[c.id] !== undefined ? balances[c.id] : Number(c.openingBalance)
    }));

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('getCustomers error:', error);
    return res.status(500).json({ error: 'Failed to fetch customers' });
  }
}

// POST /api/customers
export async function createCustomer(req: Request, res: Response) {
  try {
    const { name, mobile, address, openingBalance } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required', field: 'name' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        mobile: mobile || null,
        address: address || null,
        openingBalance: openingBalance ? Number(openingBalance) : 0
      }
    });

    return res.status(201).json({
      ...customer,
      openingBalance: Number(customer.openingBalance),
      outstandingBalance: Number(customer.openingBalance)
    });
  } catch (error: any) {
    console.error('createCustomer error:', error);
    return res.status(500).json({ error: 'Failed to create customer' });
  }
}

// GET /api/customers/:id (Detail + ledger history)
export async function getCustomerDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        salesVouchers: {
          orderBy: { date: 'asc' }
        },
        payments: {
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Compute current outstanding balance
    const outstandingBalance = await getCustomerOutstanding(id);

    // Build ledger history sorted chronologically
    const history: any[] = [];

    // Add opening balance entry
    history.push({
      id: 'opening-balance',
      date: customer.createdAt,
      type: 'OPENING',
      particulars: 'Opening Balance',
      debit: Number(customer.openingBalance) >= 0 ? Number(customer.openingBalance) : 0,
      credit: Number(customer.openingBalance) < 0 ? Math.abs(Number(customer.openingBalance)) : 0,
      refNo: '-'
    });

    customer.salesVouchers.forEach(v => {
      history.push({
        id: v.id,
        date: v.date,
        type: 'SALE',
        particulars: 'Sales Voucher Posting',
        debit: Number(v.grandTotal),
        credit: 0,
        refNo: v.voucherNo
      });
    });

    customer.payments.forEach(p => {
      history.push({
        id: p.id,
        date: p.date,
        type: 'PAYMENT',
        particulars: p.note || 'Payment Received',
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
      customer: {
        ...customer,
        openingBalance: Number(customer.openingBalance),
        outstandingBalance
      },
      ledger
    });
  } catch (error: any) {
    console.error('getCustomerDetail error:', error);
    return res.status(500).json({ error: 'Failed to fetch customer details' });
  }
}

// PUT /api/customers/:id
export async function updateCustomer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, mobile, address, openingBalance } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required', field: 'name' });
    }

    const check = await prisma.customer.findUnique({ where: { id } });
    if (!check) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        mobile: mobile || null,
        address: address || null,
        openingBalance: openingBalance !== undefined ? Number(openingBalance) : undefined
      }
    });

    const currentOutstanding = await getCustomerOutstanding(id);

    return res.status(200).json({
      ...customer,
      openingBalance: Number(customer.openingBalance),
      outstandingBalance: currentOutstanding
    });
  } catch (error: any) {
    console.error('updateCustomer error:', error);
    return res.status(500).json({ error: 'Failed to update customer' });
  }
}

// DELETE /api/customers/:id
export async function deleteCustomer(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const check = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            salesVouchers: true,
            payments: true
          }
        }
      }
    });

    if (!check) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (check._count.salesVouchers > 0 || check._count.payments > 0) {
      return res.status(400).json({
        error: 'Cannot delete customer with active transaction history. Remove related vouchers and payments first.'
      });
    }

    await prisma.customer.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    console.error('deleteCustomer error:', error);
    return res.status(500).json({ error: 'Failed to delete customer' });
  }
}

// POST /api/customers/:id/payments
export async function recordCustomerPayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { amount, date, note } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0', field: 'amount' });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const payment = await prisma.customerPayment.create({
      data: {
        customerId: id,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        note: note || null
      }
    });

    const outstandingBalance = await getCustomerOutstanding(id);

    return res.status(201).json({
      payment: {
        ...payment,
        amount: Number(payment.amount)
      },
      outstandingBalance
    });
  } catch (error: any) {
    console.error('recordCustomerPayment error:', error);
    return res.status(500).json({ error: 'Failed to record payment' });
  }
}
