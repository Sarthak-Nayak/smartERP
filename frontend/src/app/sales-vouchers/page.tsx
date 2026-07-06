'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { Plus, Search, FileText, ArrowRight, Download } from 'lucide-react';

interface SalesVoucher {
  id: string;
  voucherNo: string;
  invoiceNo: string;
  date: string;
  customerId: string;
  customer: {
    name: string;
  };
  grandTotal: number;
}

export default function SalesVouchersPage() {
  const [vouchers, setVouchers] = useState<SalesVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/sales-vouchers');
      setVouchers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales vouchers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleDownloadPDF = async (id: string, invoiceNo: string) => {
    try {
      const response = await apiRequest(`/sales-vouchers/${id}/invoice-pdf`);
      // Since apiRequest returns response directly for pdf, let's process it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      alert('Failed to download invoice PDF.');
    }
  };

  const filtered = vouchers.filter(v => 
    v.voucherNo.toLowerCase().includes(search.toLowerCase()) ||
    v.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
    v.customer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Sales Vouchers</h1>
          <p className="text-xs text-slate-400 mt-1">Invoice register, transaction posting ledger, and downloadable invoice PDFs</p>
        </div>
        <Link
          href="/sales-vouchers/new"
          className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-emerald-650 hover:bg-emerald-500 border border-emerald-600 rounded-lg text-xs font-bold text-white transition-colors mt-3 sm:mt-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Sales Voucher (F8)</span>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 w-full max-w-md">
        <Search className="w-4 h-4 text-slate-500 mr-2" />
        <input
          type="text"
          placeholder="Search by voucher/invoice no or customer name..."
          className="flex-1 bg-transparent border-0 outline-hidden text-xs text-white placeholder-slate-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-xs text-red-300 rounded-md p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs animate-pulse">
          Loading transaction registers...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
          No sales vouchers found. Click &ldquo;New Sales Voucher&rdquo; or press `F8` to write a bill.
        </div>
      ) : (
        <div className="border border-slate-850 rounded-lg overflow-hidden bg-slate-900">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="text-right">Grand Total ($)</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((voucher) => (
                <tr key={voucher.id}>
                  <td className="font-mono font-bold text-slate-350">
                    <Link href={`/sales-vouchers/${voucher.id}`} className="text-indigo-400 hover:underline">
                      {voucher.voucherNo}
                    </Link>
                  </td>
                  <td className="font-mono text-slate-455">{voucher.invoiceNo}</td>
                  <td className="font-mono text-slate-400">
                    {new Date(voucher.date).toLocaleDateString()}
                  </td>
                  <td className="font-semibold text-slate-200">
                    {voucher.customer.name}
                  </td>
                  <td className="text-right font-black text-slate-100">
                    ${Number(voucher.grandTotal).toFixed(2)}
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Link
                        href={`/sales-vouchers/${voucher.id}`}
                        className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                      <button
                        onClick={() => handleDownloadPDF(voucher.id, voucher.invoiceNo)}
                        className="flex items-center space-x-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-450 text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
