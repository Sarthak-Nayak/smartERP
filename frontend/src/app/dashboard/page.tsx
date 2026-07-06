'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { Users, UserSquare2, Box, Receipt, ShoppingCart, ArrowUpRight, AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState({
    customersCount: 0,
    suppliersCount: 0,
    itemsCount: 0,
    salesTotal: 0,
    lowStockItems: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [customers, suppliers, items, sales] = await Promise.all([
        apiRequest('/customers').catch(() => []),
        apiRequest('/suppliers').catch(() => []),
        apiRequest('/items').catch(() => []),
        apiRequest('/sales-vouchers').catch(() => []),
      ]);

      const salesTotalVal = sales.reduce((sum: number, v: any) => sum + Number(v.grandTotal), 0);
      const lowStock = items.filter((item: any) => Number(item.currentQuantity) < 5);

      setData({
        customersCount: customers.length,
        suppliersCount: suppliers.length,
        itemsCount: items.length,
        salesTotal: salesTotalVal,
        lowStockItems: lowStock,
      });
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError('Could not connect to backend. Please make sure the database is migrated and backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">System Summary</h1>
          <p className="text-xs text-slate-400 mt-1">SmartERP Billing, Ledgers, and Stock Management Control Center</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors text-slate-300 mt-3 md:mt-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Summary</span>
        </button>
      </div>

      {error && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-md p-4 text-xs text-amber-300 flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 mr-2 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">Backend Connection Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs animate-pulse">
          Loading metrics summaries...
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-panel flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Ledgers</span>
                <span className="text-2xl font-black text-white mt-1 block">{data.customersCount}</span>
                <Link href="/customers" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center mt-2">
                  <span>View customers</span>
                  <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
              <div className="bg-indigo-650/15 p-2.5 rounded-lg border border-indigo-500/25">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
            </div>

            <div className="card-panel flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Supplier Ledgers</span>
                <span className="text-2xl font-black text-white mt-1 block">{data.suppliersCount}</span>
                <Link href="/suppliers" className="text-[10px] text-amber-400 hover:text-amber-300 font-bold inline-flex items-center mt-2">
                  <span>View suppliers</span>
                  <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
              <div className="bg-amber-650/15 p-2.5 rounded-lg border border-amber-500/25">
                <UserSquare2 className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="card-panel flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inventory Items</span>
                <span className="text-2xl font-black text-white mt-1 block">{data.itemsCount}</span>
                <Link href="/items" className="text-[10px] text-violet-400 hover:text-violet-300 font-bold inline-flex items-center mt-2">
                  <span>View inventory</span>
                  <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
              <div className="bg-violet-650/15 p-2.5 rounded-lg border border-violet-500/25">
                <Box className="w-5 h-5 text-violet-400" />
              </div>
            </div>

            <div className="card-panel flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales Revenue</span>
                <span className="text-2xl font-black text-white mt-1 block">${data.salesTotal.toFixed(2)}</span>
                <Link href="/sales-vouchers" className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center mt-2">
                  <span>View transactions</span>
                  <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
              <div className="bg-emerald-650/15 p-2.5 rounded-lg border border-emerald-500/25">
                <Receipt className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="card-panel lg:col-span-1 space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-2.5">
                <Link href="/sales-vouchers/new" className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 transition-all font-semibold group">
                  <div className="flex items-center space-x-3">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-white">Create Sales Voucher</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 group-hover:text-white border border-slate-700 group-hover:border-slate-550 rounded px-1.5 py-0.5 bg-slate-900">F8</span>
                </Link>

                <Link href="/purchase-vouchers/new" className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 transition-all font-semibold group">
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-white">Create Purchase Voucher</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 group-hover:text-white border border-slate-700 group-hover:border-slate-550 rounded px-1.5 py-0.5 bg-slate-900">F9</span>
                </Link>

                <Link href="/customers/new" className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 transition-all font-semibold group">
                  <div className="flex items-center space-x-3">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-white">New Customer Ledger</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 group-hover:text-white border border-slate-700 group-hover:border-slate-550 rounded px-1.5 py-0.5 bg-slate-900">Ctrl+C</span>
                </Link>

                <Link href="/suppliers/new" className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 transition-all font-semibold group">
                  <div className="flex items-center space-x-3">
                    <UserSquare2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-white">New Supplier Ledger</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 group-hover:text-white border border-slate-700 group-hover:border-slate-550 rounded px-1.5 py-0.5 bg-slate-900">Alt+S</span>
                </Link>
              </div>
            </div>

            {/* Low stock alerts */}
            <div className="card-panel lg:col-span-2 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock Warnings (Qty &lt; 5)</h2>
                {data.lowStockItems.length > 0 && (
                  <span className="bg-red-950 text-red-400 border border-red-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {data.lowStockItems.length} Warnings
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto max-h-[220px]">
                {data.lowStockItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 py-10">
                    <Box className="w-8 h-8 mb-2 opacity-30 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium">All items are sufficiently stocked</span>
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th>SKU</th>
                          <th className="text-right">Current Stock</th>
                          <th>UOM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lowStockItems.map((item) => (
                          <tr key={item.id} className="hover:bg-red-950/20">
                            <td>
                              <Link href={`/items/${item.id}`} className="text-indigo-400 hover:underline hover:text-indigo-300 font-medium">
                                {item.name}
                              </Link>
                            </td>
                            <td className="font-mono text-slate-400">{item.sku}</td>
                            <td className="text-right font-bold text-red-400">{item.currentQuantity}</td>
                            <td>{item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
