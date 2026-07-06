'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import { ArrowLeft, Download, FileText, Calendar, User, ShoppingBag } from 'lucide-react';

interface SalesVoucherLine {
  id: string;
  stockItemId: string;
  quantity: number;
  rate: number;
  lineTotal: number;
  stockItem: {
    name: string;
    sku: string;
    unit: string;
  };
}

interface SalesVoucherDetail {
  id: string;
  voucherNo: string;
  invoiceNo: string;
  date: string;
  customerId: string;
  customer: {
    name: string;
    mobile: string | null;
    address: string | null;
  };
  lines: SalesVoucherLine[];
  grandTotal: number;
}

export default function SalesVoucherDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [voucher, setVoucher] = useState<SalesVoucherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        const data = await apiRequest(`/sales-vouchers/${id}`);
        setVoucher(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load voucher details.');
      } finally {
        setLoading(false);
      }
    };
    fetchVoucher();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!voucher) return;
    try {
      const response = await apiRequest(`/sales-vouchers/${id}/invoice-pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${voucher.invoiceNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      alert('Failed to download invoice PDF.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading invoice details...</div>;
  }

  if (error || !voucher) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 font-sans text-xs">
        <Link href="/sales-vouchers" className="inline-flex items-center space-x-1 text-indigo-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Vouchers</span>
        </Link>
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-md p-4">
          {error || 'Sales voucher not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Link href="/sales-vouchers" className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Sales Invoice: {voucher.invoiceNo}</h1>
            <p className="text-[10px] text-slate-400 mt-1">Voucher Ledger Posting: {voucher.voucherNo}</p>
          </div>
        </div>

        <button
          onClick={handleDownloadPDF}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-650 hover:bg-emerald-500 border border-emerald-600 rounded-lg text-xs font-bold text-white transition-colors mt-3 sm:mt-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Invoice PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Details */}
        <div className="card-panel bg-slate-900 md:col-span-2 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Billed To (Customer Ledger)</h3>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <p className="font-bold text-indigo-300 text-sm">{voucher.customer.name}</p>
            {voucher.customer.mobile && <p>Mobile: {voucher.customer.mobile}</p>}
            {voucher.customer.address && (
              <p className="text-slate-400 whitespace-pre-line leading-relaxed">
                Address: {voucher.customer.address}
              </p>
            )}
          </div>
        </div>

        {/* Voucher Meta details */}
        <div className="card-panel bg-slate-900 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 mb-3">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Document parameters</h3>
            </div>
            <div className="space-y-2 text-slate-350">
              <div className="flex justify-between">
                <span>Voucher Code:</span>
                <span className="font-mono font-bold text-slate-200">{voucher.voucherNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Invoice Code:</span>
                <span className="font-mono font-bold text-slate-200">{voucher.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Posting Date:</span>
                <span className="font-bold text-slate-200">
                  {new Date(voucher.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
            <span className="font-bold text-slate-300">Grand Total:</span>
            <span className="text-lg font-black text-white">${Number(voucher.grandTotal).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Itemised Lines */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itemized Line Entries</h3>
        </div>

        <div className="border border-slate-850 rounded-lg overflow-hidden bg-slate-900">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Sl.</th>
                <th>Item Description</th>
                <th>SKU</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Rate ($)</th>
                <th className="text-right">Total ($)</th>
              </tr>
            </thead>
            <tbody>
              {voucher.lines.map((line, idx) => (
                <tr key={line.id}>
                  <td className="text-slate-500 font-mono">{idx + 1}</td>
                  <td>
                    <Link href={`/items/${line.stockItemId}`} className="text-violet-405 hover:underline font-bold">
                      {line.stockItem.name}
                    </Link>
                  </td>
                  <td className="font-mono text-slate-455">{line.stockItem.sku}</td>
                  <td className="text-right font-semibold text-slate-202">
                    {line.quantity} {line.stockItem.unit}
                  </td>
                  <td className="text-right font-mono text-slate-300">
                    ${Number(line.rate).toFixed(2)}
                  </td>
                  <td className="text-right font-black text-slate-100">
                    ${Number(line.lineTotal).toFixed(2)}
                  </td>
                </tr>
              ))}
              {/* Grand Total Row */}
              <tr className="bg-slate-950 font-bold">
                <td colSpan={5} className="text-right text-slate-350 text-xs py-2.5">
                  Grand Total Bill Value:
                </td>
                <td className="text-right text-sm text-indigo-400 font-black py-2.5">
                  ${Number(voucher.grandTotal).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
