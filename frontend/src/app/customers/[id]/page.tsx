'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import { ArrowLeft, Calendar, FileText, Phone, MapPin, BadgeInfo } from 'lucide-react';

interface LedgerEntry {
  id: string;
  date: string;
  type: 'OPENING' | 'SALE' | 'PAYMENT';
  particulars: string;
  debit: number;
  credit: number;
  refNo: string;
  runningBalance: number;
}

interface CustomerDetail {
  id: string;
  name: string;
  mobile: string | null;
  address: string | null;
  openingBalance: number;
  outstandingBalance: number;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const data = await apiRequest(`/customers/${id}`);
        setCustomer(data.customer);
        setLedger(data.ledger);
      } catch (err: any) {
        setError(err.message || 'Failed to load ledger information.');
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading customer ledger...</div>;
  }

  if (error || !customer) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 font-sans text-xs">
        <Link href="/customers" className="inline-flex items-center space-x-1 text-indigo-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers</span>
        </Link>
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-md p-4">
          {error || 'Customer not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans text-xs">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <Link href="/customers" className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{customer.name}</h1>
          <p className="text-[10px] text-slate-400 mt-1">Detailed Ledger Statement & Transaction History</p>
        </div>
      </div>

      {/* Ledger Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-panel space-y-2 bg-slate-900 md:col-span-2">
          <h3 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Contact & Address details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Mobile: {customer.mobile || 'N/A'}</span>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>Address: {customer.address || 'No Address Specified'}</span>
            </div>
          </div>
        </div>

        <div className="card-panel flex flex-col justify-between bg-slate-900">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance Summary</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded text-[9px] font-mono text-slate-400 border border-slate-850">
              UOM: USD
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-450">Opening Bal:</span>
              <span className="font-semibold text-slate-200">${customer.openingBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800/80 pt-1.5">
              <span className="text-slate-250 font-bold">Outstanding Bal:</span>
              <span className={`font-black text-sm ${customer.outstandingBalance > 0 ? 'text-rose-400' : customer.outstandingBalance < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                ${customer.outstandingBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ledger Statement Rows</h3>
        <div className="border border-slate-850 rounded-lg overflow-hidden bg-slate-900">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ref No.</th>
                <th>Particulars</th>
                <th className="text-right">Debit (+Sale)</th>
                <th className="text-right">Credit (-Receipt)</th>
                <th className="text-right">Running Balance</th>
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
                      <Link href={`/sales-vouchers/${entry.id}`} className="text-indigo-400 hover:underline">
                        {entry.refNo}
                      </Link>
                    ) : (
                      entry.refNo
                    )}
                  </td>
                  <td>{entry.particulars}</td>
                  <td className="text-right font-bold text-rose-450">
                    {entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : '-'}
                  </td>
                  <td className="text-right font-bold text-emerald-400">
                    {entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : '-'}
                  </td>
                  <td className="text-right font-black text-slate-205">
                    ${entry.runningBalance.toFixed(2)}
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
