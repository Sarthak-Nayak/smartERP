'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  outstandingBalance: number;
}

interface StockItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  sellingRate: number;
  currentQuantity: number;
}

interface VoucherLine {
  stockItemId: string;
  quantity: number;
  rate: number;
  lineTotal: number;
  stockError?: string;
}

export default function NewSalesVoucherPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [lines, setLines] = useState<VoucherLine[]>([
    { stockItemId: '', quantity: 1, rate: 0, lineTotal: 0 }
  ]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custData, itemData] = await Promise.all([
          apiRequest('/customers'),
          apiRequest('/items')
        ]);
        setCustomers(custData);
        setItems(itemData);
      } catch (err: any) {
        setError('Failed to fetch master data. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddRow = () => {
    setLines([...lines, { stockItemId: '', quantity: 1, rate: 0, lineTotal: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (lines.length === 1) return;
    const next = [...lines];
    next.splice(index, 1);
    setLines(next);
  };

  const handleLineChange = (index: number, field: keyof VoucherLine, value: any) => {
    const updated = [...lines];
    const row = { ...updated[index] };

    if (field === 'stockItemId') {
      row.stockItemId = value;
      // Auto-fill rate based on selected item
      const item = items.find(i => i.id === value);
      if (item) {
        row.rate = Number(item.sellingRate);
      } else {
        row.rate = 0;
      }
    } else if (field === 'quantity') {
      row.quantity = Math.max(0.001, Number(value));
    } else if (field === 'rate') {
      row.rate = Math.max(0, Number(value));
    }

    // Compute line total
    row.lineTotal = row.quantity * row.rate;

    // Validate stock warning client-side
    const selectedItem = items.find(i => i.id === row.stockItemId);
    if (selectedItem) {
      if (row.quantity > selectedItem.currentQuantity) {
        row.stockError = `Stock shortage! Only ${selectedItem.currentQuantity} ${selectedItem.unit} in inventory`;
      } else {
        delete row.stockError;
      }
    } else {
      delete row.stockError;
    }

    updated[index] = row;
    setLines(updated);
  };

  const grandTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    const hasInvalidLine = lines.some(l => !l.stockItemId || l.quantity <= 0 || l.rate < 0);
    if (hasInvalidLine) {
      setError('All voucher lines must have an item, quantity greater than 0, and valid rate.');
      return;
    }

    // Check for stock errors before submitting
    const hasStockError = lines.some(l => !!l.stockError);
    if (hasStockError) {
      setError('Cannot submit voucher. One or more items exceed active stock availability.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/sales-vouchers', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          date,
          lines: lines.map(l => ({
            stockItemId: l.stockItemId,
            quantity: l.quantity,
            rate: l.rate
          }))
        })
      });
      router.push('/sales-vouchers');
    } catch (err: any) {
      setError(err.message || 'Failed to save sales voucher.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading master files...</div>;
  }

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <Link href="/sales-vouchers" className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Record Sales Voucher</h1>
          <p className="text-[10px] text-slate-400 mt-1">Debit customer accounts and decrement item stock quantities</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-md p-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Form panel */}
        <div className="card-panel bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Customer Ledger *</label>
            <select
              className="form-input bg-slate-950 text-white"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={submitting}
              autoFocus
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (O/S: ${Number(c.outstandingBalance).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Voucher Date *</label>
            <input
              type="date"
              className="form-input"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        {/* Dynamic Lines Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Voucher Line Items</h3>
          
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Stock Item</th>
                  <th style={{ width: '15%' }} className="text-right">Quantity</th>
                  <th style={{ width: '20%' }} className="text-right">Rate ($)</th>
                  <th style={{ width: '20%' }} className="text-right">Line Total ($)</th>
                  <th style={{ width: '5%' }} className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const selectedItem = items.find(i => i.id === line.stockItemId);
                  return (
                    <tr key={index} className="hover:bg-slate-900">
                      <td>
                        <select
                          className="form-input bg-slate-950 text-white font-sans text-xs"
                          value={line.stockItemId}
                          onChange={(e) => handleLineChange(index, 'stockItemId', e.target.value)}
                          disabled={submitting}
                          required
                        >
                          <option value="">-- Select Inventory Item --</option>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.sku}) - Qty: {item.currentQuantity} {item.unit}
                            </option>
                          ))}
                        </select>
                        {line.stockError && (
                          <div className="flex items-center text-[10px] text-red-400 mt-1 font-semibold space-x-1">
                            <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                            <span>{line.stockError}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end space-x-1">
                          <input
                            type="number"
                            step="0.001"
                            className="form-input text-right font-bold w-full bg-slate-950"
                            placeholder="1"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                            disabled={submitting}
                            required
                          />
                          <span className="text-[10px] text-slate-500 font-mono w-8 shrink-0">
                            {selectedItem?.unit || 'PCS'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input text-right font-bold w-full bg-slate-950 text-slate-100"
                          placeholder="0.00"
                          value={line.rate}
                          onChange={(e) => handleLineChange(index, 'rate', e.target.value)}
                          disabled={submitting}
                          required
                        />
                      </td>
                      <td className="text-right font-black text-slate-202 pr-4">
                        ${line.lineTotal.toFixed(2)}
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(index)}
                          className="text-red-500 hover:text-red-400 p-1 rounded-md hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                          disabled={lines.length === 1 || submitting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {/* Total & Action Footer Rows */}
                <tr className="bg-slate-950/80">
                  <td colSpan={3} className="text-right font-bold text-slate-350 text-xs py-2.5">
                    Grand Total Bill Value:
                  </td>
                  <td className="text-right font-black text-indigo-400 text-sm pr-4 py-2.5">
                    ${grandTotal.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            disabled={submitting}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>

        {/* Submit Actions */}
        <div className="flex space-x-3 pt-2">
          <Link
            href="/sales-vouchers"
            className="w-1/2 flex items-center justify-center bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-350 font-bold py-2.5 rounded-lg transition-colors"
          >
            Cancel (ESC)
          </Link>
          <button
            type="submit"
            className="w-1/2 flex items-center justify-center space-x-2 bg-emerald-650 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
            disabled={submitting}
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving Voucher...' : 'Save & Post Voucher'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
