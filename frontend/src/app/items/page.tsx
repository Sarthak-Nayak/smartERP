'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Edit, Trash2, Box, AlertTriangle, ArrowRight } from 'lucide-react';

interface StockItem {
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

export default function ItemsPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/items');
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete Stock Item '${name}'?`)) return;
    try {
      await apiRequest(`/items/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item. Ensure it is not referenced in any vouchers.');
    }
  };

  const columns = useMemo<ColumnDef<StockItem>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Item Name',
      cell: ({ row }) => (
        <Link 
          href={`/items/${row.original.id}`}
          className="text-violet-400 hover:text-violet-305 font-bold flex items-center hover:underline"
        >
          {row.original.name}
          <ArrowRight className="w-3 h-3 ml-1 opacity-0 hover:opacity-100 transition-opacity" />
        </Link>
      )
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ getValue }) => <span className="font-mono">{getValue() as string}</span>
    },
    {
      accessorKey: 'unit',
      header: 'UOM',
      cell: ({ getValue }) => getValue() as string
    },
    {
      accessorKey: 'purchaseRate',
      header: 'Pur Price ($)',
      cell: ({ getValue }) => Number(getValue() || 0).toFixed(2),
      meta: { align: 'right' }
    },
    {
      accessorKey: 'sellingRate',
      header: 'Sel Price ($)',
      cell: ({ getValue }) => Number(getValue() || 0).toFixed(2),
      meta: { align: 'right' }
    },
    {
      accessorKey: 'currentQuantity',
      header: 'Current Stock',
      cell: ({ row }) => {
        const val = Number(row.original.currentQuantity || 0);
        const unit = row.original.unit;
        const low = val < 5;
        return (
          <div className="flex items-center space-x-1.5">
            <span className={`font-black ${low ? 'text-red-400' : 'text-slate-200'}`}>
              {val} {unit}
            </span>
            {low && (
              <span className="flex items-center space-x-0.5 bg-red-950 text-red-400 border border-red-900 text-[8px] font-extrabold px-1 py-0.2 rounded uppercase tracking-wider shrink-0">
                <AlertTriangle className="w-2 h-2 text-red-400 shrink-0" />
                <span>Low</span>
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'gstPercent',
      header: 'GST (%)',
      cell: ({ getValue }) => `${Number(getValue() || 0)}%`,
      meta: { align: 'right' }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Link
            href={`/items/${row.original.id}/edit`}
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
    data: items,
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
          <h1 className="text-xl font-bold text-white tracking-tight">Stock Inventory Items</h1>
          <p className="text-xs text-slate-400 mt-1">Manage stock items, buying/selling rates, units, and review real-time stock balances</p>
        </div>
        <Link
          href="/items/new"
          className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-violet-650 hover:bg-violet-500 border border-violet-600 rounded-lg text-xs font-bold text-white transition-colors mt-3 sm:mt-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Item</span>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 w-full max-w-md">
        <Search className="w-4 h-4 text-slate-500 mr-2" />
        <input
          type="text"
          placeholder="Search items by name or SKU..."
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
          Loading inventory items...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
          No stock items found. Click &ldquo;New Stock Item&rdquo; to add.
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
    </div>
  );
}
