'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, Sparkles } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  outstandingBalance: number;
}

interface StockItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  purchaseRate: number;
}

interface InlineItem {
  name: string;
  sku: string;
  unit: 'PCS' | 'KG' | 'LTR' | 'BOX' | 'PACK';
  purchaseRate: number;
  sellingRate: number;
  gstPercent: number;
}

interface VoucherLine {
  stockItemId: string; // empty if inline new item
  quantity: number;
  rate: number;
  lineTotal: number;
  inlineItem?: InlineItem; // details of item if created inline
}

export default function NewPurchaseVoucherPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [lines, setLines] = useState<VoucherLine[]>([
    { stockItemId: '', quantity: 1, rate: 0, lineTotal: 0 }
  ]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Inline Item Dialog State
  const [inlineOpen, setInlineOpen] = useState(false);
  const [inlineIndex, setInlineIndex] = useState<number | null>(null);
  const [inlineForm, setInlineForm] = useState<InlineItem>({
    name: '',
    sku: '',
    unit: 'PCS',
    purchaseRate: 0,
    sellingRate: 0,
    gstPercent: 0
  });

  const fetchMasterData = async () => {
    try {
      const [suppData, itemData] = await Promise.all([
        apiRequest('/suppliers'),
        apiRequest('/items')
      ]);
      setSuppliers(suppData);
      setItems(itemData);
    } catch (err: any) {
      setError('Failed to load master files. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
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
      if (value === 'NEW_INLINE') {
        // Trigger inline item dialog
        setInlineIndex(index);
        setInlineForm({
          name: '',
          sku: '',
          unit: 'PCS',
          purchaseRate: 0,
          sellingRate: 0,
          gstPercent: 0
        });
        setInlineOpen(true);
        return;
      }

      row.stockItemId = value;
      delete row.inlineItem;
      // Auto-fill buying price
      const item = items.find(i => i.id === value);
      if (item) {
        row.rate = Number(item.purchaseRate);
      } else {
        row.rate = 0;
      }
    } else if (field === 'quantity') {
      row.quantity = Math.max(0.001, Number(value));
    } else if (field === 'rate') {
      row.rate = Math.max(0, Number(value));
    }

    row.lineTotal = row.quantity * row.rate;
    updated[index] = row;
    setLines(updated);
  };

  const handleSaveInlineItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (inlineIndex === null) return;

    if (!inlineForm.name || !inlineForm.sku) {
      alert('Item name and SKU are required');
      return;
    }

    // Check SKU locally
    const skuExists = items.some(i => i.sku.toLowerCase() === inlineForm.sku.toLowerCase());
    if (skuExists) {
      alert(`SKU '${inlineForm.sku}' is already taken.`);
      return;
    }

    const updated = [...lines];
    updated[inlineIndex] = {
      stockItemId: '',
      quantity: updated[inlineIndex].quantity,
      rate: Number(inlineForm.purchaseRate),
      lineTotal: updated[inlineIndex].quantity * Number(inlineForm.purchaseRate),
      inlineItem: { ...inlineForm }
    };

    setLines(updated);
    setInlineOpen(false);
    setInlineIndex(null);
  };

  const grandTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!supplierId) {
      setError('Please select a supplier.');
      return;
    }

    const hasInvalidLine = lines.some(l => (!l.stockItemId && !l.inlineItem) || l.quantity <= 0 || l.rate < 0);
    if (hasInvalidLine) {
      setError('All lines must have an item (or inline new item details) with valid quantity and rates.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/purchase-vouchers', {
        method: 'POST',
        body: JSON.stringify({
          supplierId,
          date,
          lines: lines.map(l => ({
            stockItemId: l.stockItemId || undefined,
            quantity: l.quantity,
            rate: l.rate,
            stockItem: l.inlineItem ? {
              name: l.inlineItem.name,
              sku: l.inlineItem.sku,
              unit: l.inlineItem.unit,
              purchaseRate: l.inlineItem.purchaseRate,
              sellingRate: l.inlineItem.sellingRate,
              gstPercent: l.inlineItem.gstPercent
            } : undefined
          }))
        })
      });
      router.push('/purchase-vouchers');
    } catch (err: any) {
      setError(err.message || 'Failed to save purchase voucher.');
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
        <Link href="/purchase-vouchers" className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Record Purchase Voucher</h1>
          <p className="text-[10px] text-slate-400 mt-1">Credit supplier accounts and increment item stock quantities</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-md p-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header fields */}
        <div className="card-panel bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Supplier Ledger *</label>
            <select
              className="form-input bg-slate-950 text-white"
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              disabled={submitting}
              autoFocus
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (O/S: ${Number(s.outstandingBalance).toFixed(2)})
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
                        {line.inlineItem ? (
                          <div className="flex items-center space-x-2 bg-indigo-950/40 border border-indigo-900/50 p-2 rounded-md">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <div>
                              <p className="font-bold text-indigo-300">{line.inlineItem.name}</p>
                              <p className="text-[9px] text-slate-400 font-mono">SKU: {line.inlineItem.sku} (New Item Inline)</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleLineChange(index, 'stockItemId', '')}
                              className="text-slate-500 hover:text-slate-300 text-[10px] ml-auto"
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          <select
                            className="form-input bg-slate-950 text-white font-sans text-xs"
                            value={line.stockItemId}
                            onChange={(e) => handleLineChange(index, 'stockItemId', e.target.value)}
                            disabled={submitting}
                            required
                          >
                            <option value="">-- Select Inventory Item --</option>
                            <option value="NEW_INLINE" className="text-indigo-405 font-bold bg-slate-900">
                              + Create New Item Inline...
                            </option>
                            {items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({item.sku}) - Buy Price: ${Number(item.purchaseRate).toFixed(2)}
                              </option>
                            ))}
                          </select>
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
                            {line.inlineItem ? line.inlineItem.unit : selectedItem?.unit || 'PCS'}
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
                {/* Total row */}
                <tr className="bg-slate-950/80">
                  <td colSpan={3} className="text-right font-bold text-slate-355 text-xs py-2.5">
                    Grand Total Bill Value:
                  </td>
                  <td className="text-right font-black text-amber-400 text-sm pr-4 py-2.5">
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
            href="/purchase-vouchers"
            className="w-1/2 flex items-center justify-center bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-355 font-bold py-2.5 rounded-lg transition-colors"
          >
            Cancel (ESC)
          </Link>
          <button
            type="submit"
            className="w-1/2 flex items-center justify-center space-x-2 bg-amber-650 hover:bg-amber-500 text-white font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
            disabled={submitting}
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving Voucher...' : 'Save & Post Voucher'}</span>
          </button>
        </div>
      </form>

      {/* Inline Item Dialog Form Modal */}
      {inlineOpen && inlineIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center px-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Create New Stock Item (Inline)</h3>
              <button 
                type="button"
                onClick={() => { setInlineOpen(false); setInlineIndex(null); }}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveInlineItem} className="p-4 space-y-4 font-sans text-xs">
              <div>
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  className="form-input bg-slate-950"
                  placeholder="e.g. Ergonomic Office Chair"
                  required
                  value={inlineForm.name}
                  onChange={(e) => setInlineForm({ ...inlineForm, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div>
                <label className="form-label">SKU Code *</label>
                <input
                  type="text"
                  className="form-input font-mono bg-slate-950"
                  placeholder="e.g. SKU-CHAIR-02"
                  required
                  value={inlineForm.sku}
                  onChange={(e) => setInlineForm({ ...inlineForm, sku: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Unit of Measure *</label>
                  <select
                    className="form-input bg-slate-950 text-white"
                    required
                    value={inlineForm.unit}
                    onChange={(e) => setInlineForm({ ...inlineForm, unit: e.target.value as any })}
                  >
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="KG">KG (Kilograms)</option>
                    <option value="LTR">LTR (Litres)</option>
                    <option value="BOX">BOX (Boxes)</option>
                    <option value="PACK">PACK (Packages)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">GST Percent (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input bg-slate-950 text-right"
                    placeholder="18"
                    value={inlineForm.gstPercent || ''}
                    onChange={(e) => setInlineForm({ ...inlineForm, gstPercent: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Purchase Rate ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input font-bold bg-slate-950 text-right text-emerald-400"
                    placeholder="0.00"
                    required
                    value={inlineForm.purchaseRate || ''}
                    onChange={(e) => setInlineForm({ ...inlineForm, purchaseRate: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="form-label">Selling Rate ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input font-bold bg-slate-950 text-right text-indigo-400"
                    placeholder="0.00"
                    required
                    value={inlineForm.sellingRate || ''}
                    onChange={(e) => setInlineForm({ ...inlineForm, sellingRate: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setInlineOpen(false); setInlineIndex(null); }}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-indigo-650 hover:bg-indigo-500 text-white font-bold py-2 rounded-md transition-colors cursor-pointer"
                >
                  Apply Inline Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
