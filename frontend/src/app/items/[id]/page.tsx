'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import { ArrowLeft, Box, Calendar, DollarSign, Percent } from 'lucide-react';

interface LedgerEntry {
  id: string;
  date: string;
  type: 'OPENING' | 'PURCHASE' | 'SALE';
  party: string;
  qtyIn: number;
  qtyOut: number;
  refNo: string;
  runningBalance: number;
}

interface ItemDetail {
  id: string;
  name: string;
  sku: string;
  unit: string;
  purchaseRate: number;
  sellingRate: number;
  openingStock: number;
  gstPercent: number;
  currentQuantity: number;
}

export default function ItemDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const data = await apiRequest(`/items/${id}`);
        setItem(data.item);
        setLedger(data.ledger);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading stock ledger...</div>;
  }

  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 font-sans text-xs">
        <Link href="/items" className="inline-flex items-center space-x-1 text-indigo-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Inventory</span>
        </Link>
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-md p-4">
          {error || 'Item not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans text-xs">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <Link href="/items" className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{item.name}</h1>
          <p className="text-[10px] text-slate-400 mt-1">Detailed Stock Ledger & Quantity Movement Card</p>
        </div>
      </div>

      {/* Item Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-panel space-y-1 bg-slate-900">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SKU Code</span>
          <span className="font-mono font-bold text-base text-violet-405 block pt-1">{item.sku}</span>
          <span className="text-[10px] text-slate-500 font-medium">UOM: {item.unit}</span>
        </div>

        <div className="card-panel space-y-1 bg-slate-900">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rates Summary</span>
          <div className="pt-2 space-y-1 text-slate-350">
            <div className="flex justify-between">
              <span>Buying Rate:</span>
              <span className="font-bold text-slate-200">${item.purchaseRate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Selling Rate:</span>
              <span className="font-bold text-slate-200">${item.sellingRate.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="card-panel space-y-1 bg-slate-900">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taxation Parameters</span>
          <span className="text-base font-bold text-slate-200 block pt-1.5 flex items-center">
            <Percent className="w-4 h-4 text-slate-500 mr-1 shrink-0" />
            <span>{item.gstPercent}% GST Rate</span>
          </span>
          <span className="text-[9px] text-slate-500 font-medium italic">GST fields recorded but not calculated in MVP</span>
        </div>

        <div className="card-panel space-y-1 bg-slate-905 flex flex-col justify-between border-violet-500/20">
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block">Current Stock Balance</span>
          <div className="py-1">
            <span className={`text-2xl font-black block ${item.currentQuantity < 5 ? 'text-red-400' : 'text-emerald-400'}`}>
              {item.currentQuantity} {item.unit}
            </span>
          </div>
          <span className="text-[9px] text-slate-500 font-medium">Opening stock: {item.openingStock} {item.unit}</span>
        </div>
      </div>

      {/* Stock Ledger Movements Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chronological Movements Ledger</h3>
        <div className="border border-slate-850 rounded-lg overflow-hidden bg-slate-900">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Voucher Ref</th>
                <th>Movement Description / Party</th>
                <th className="text-right">Qty In (+Purch)</th>
                <th className="text-right">Qty Out (-Sale)</th>
                <th className="text-right">Running Stock Qty</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry) => (
                <tr key={entry.id} className={entry.type === 'OPENING' ? 'bg-slate-950/40 text-slate-400 italic' : ''}>
                  <td className="font-mono text-slate-400">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="font-mono font-bold text-slate-300">
                    {entry.type === 'SALE' ? (
                      <Link href={`/sales-vouchers/${entry.refNo.startsWith('SV-') ? entry.refNo : entry.id}`} className="text-indigo-400 hover:underline">
                        {entry.refNo}
                      </Link>
                    ) : entry.type === 'PURCHASE' ? (
                      <Link href={`/purchase-vouchers/${entry.refNo.startsWith('PV-') ? entry.refNo : entry.id}`} className="text-amber-400 hover:underline">
                        {entry.refNo}
                      </Link>
                    ) : (
                      entry.refNo
                    )}
                  </td>
                  <td>
                    <span className="font-medium text-slate-350">{entry.party}</span>
                  </td>
                  <td className="text-right font-bold text-emerald-450">
                    {entry.qtyIn > 0 ? `+${entry.qtyIn}` : '-'}
                  </td>
                  <td className="text-right font-bold text-rose-450">
                    {entry.qtyOut > 0 ? `-${entry.qtyOut}` : '-'}
                  </td>
                  <td className="text-right font-black text-slate-205">
                    {entry.runningBalance} {item.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
