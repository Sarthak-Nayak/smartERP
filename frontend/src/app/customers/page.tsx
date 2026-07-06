'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { Plus, Search, DollarSign, Edit, Trash2, Calendar, FileText, ArrowRight } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  mobile: string | null;
  address: string | null;
  openingBalance: number;
  outstandingBalance: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment dialog state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().substring(0, 10));
  const [payNote, setPayNote] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/customers');
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer ledgers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete Customer Ledger '${name}'?`)) return;
    try {
      await apiRequest(`/customers/${id}`, { method: 'DELETE' });
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer. Ensure they have no active transactions.');
    }
  };

  const handleOpenPayment = (customer: Customer) => {
    setSelectedCust(customer);
    setPayAmount('');
    setPayNote('');
    setPaymentOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || !payAmount || Number(payAmount) <= 0) return;

    setPaymentSubmitting(true);
    try {
      await apiRequest(`/customers/${selectedCust.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(payAmount),
          date: payDate,
          note: payNote
        })
      });
      setPaymentOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const columns = useMemo<ColumnDef<Customer>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Customer Name',
      cell: ({ row }) => (
        <Link 
          href={`/customers/${row.original.id}`}
          className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center hover:underline"
        >
          {row.original.name}
          <ArrowRight className="w-3 h-3 ml-1 opacity-0 hover:opacity-100 transition-opacity" />
        </Link>
      )
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile',
      cell: ({ getValue }) => getValue() || '-'
    },
    {
      accessorKey: 'openingBalance',
      header: 'Opening Bal ($)',
      cell: ({ getValue }) => Number(getValue() || 0).toFixed(2),
      meta: { align: 'right' }
    },
    {
      accessorKey: 'outstandingBalance',
      header: 'Outstanding Bal ($)',
      cell: ({ getValue }) => {
        const val = Number(getValue() || 0);
        return (
          <span className={`font-black ${val > 0 ? 'text-rose-400' : val < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
            {val.toFixed(2)}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenPayment(row.original)}
            className="flex items-center space-x-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md transition-colors cursor-pointer"
          >
            <DollarSign className="w-3 h-3" />
            <span>Pay</span>
          </button>
          <Link
            href={`/customers/${row.original.id}/edit`}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
          >
            <Edit className="w-3 h-3" />
            <span>Edit</span>
          </Link>
          <button
            onClick={() => handleDelete(row.original.id, row.original.name)}
            className="flex items-center space-x-1 bg-red-950 hover:bg-red-900 border border-red-900 text-red-400 text-[10px] font-bold px-2 py-1 rounded-md transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Del</span>
          </button>
        </div>
      )
    }
  ], []);

  const table = useReactTable({
    data: customers,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Customer Ledgers</h1>
          <p className="text-xs text-slate-400 mt-1">Manage client ledgers, record receipts, and monitor active outstanding balances</p>
        </div>
        <Link
          href="/customers/new"
          className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-500 border border-indigo-600 rounded-lg text-xs font-bold text-white transition-colors mt-3 sm:mt-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer (Ctrl+C)</span>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 w-full max-w-md">
        <Search className="w-4 h-4 text-slate-500 mr-2" />
        <input
          type="text"
          placeholder="Search customers..."
          className="flex-1 bg-transparent border-0 outline-hidden text-xs text-white placeholder-slate-500"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Main Table */}
      {error && (
        <div className="bg-red-950/40 border border-red-800 text-xs text-red-300 rounded-md p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs animate-pulse">
          Loading customer list...
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
          No customer records found. Click &ldquo;New Customer&rdquo; or press `Ctrl+C` to add.
        </div>
      ) : (
        <div className="border border-slate-850 rounded-lg overflow-hidden bg-slate-900">
          <table className="min-w-full">
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Dialog */}
      {paymentOpen && selectedCust && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center px-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Record Payment (Receipt)</h3>
              <button onClick={() => setPaymentOpen(false)} className="text-slate-400 hover:text-white text-xs cursor-pointer">
                Cancel
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-4 space-y-4 font-sans text-xs">
              <div>
                <label className="form-label">Customer</label>
                <div className="form-input bg-slate-950 font-bold border-slate-800 text-indigo-300">
                  {selectedCust.name}
                </div>
              </div>

              <div>
                <label className="form-label">Outstanding Balance</label>
                <div className="form-input bg-slate-950 text-rose-300 font-bold border-slate-800">
                  ${selectedCust.outstandingBalance.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="form-label">Receipt Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input pl-6"
                    placeholder="0.00"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    disabled={paymentSubmitting}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Receipt Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="date"
                    className="form-input pl-8"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    disabled={paymentSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Note / Reference</label>
                <div className="relative">
                  <FileText className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    className="form-input pl-8"
                    placeholder="Cash/Cheque ref..."
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    disabled={paymentSubmitting}
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentOpen(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-md transition-colors cursor-pointer"
                  disabled={paymentSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-650 hover:bg-emerald-500 text-white font-bold py-2 rounded-md transition-colors cursor-pointer"
                  disabled={paymentSubmitting}
                >
                  {paymentSubmitting ? 'Posting...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
