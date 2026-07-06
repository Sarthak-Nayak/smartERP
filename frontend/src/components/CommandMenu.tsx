'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../lib/api';
import { Search, User, Users, Box, FileText, ArrowRight, X } from 'lucide-react';

interface CommandItem {
  id: string;
  name: string;
  category: 'Actions' | 'Customers' | 'Suppliers' | 'Stock Items' | 'Navigation';
  url: string;
  shortcut?: string;
}

export default function CommandMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<CommandItem[]>([]);
  const [filtered, setFiltered] = useState<CommandItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Default actions and navigation
  const staticItems: CommandItem[] = [
    { id: 'act-new-sale', name: 'New Sales Voucher', category: 'Actions', url: '/sales-vouchers/new', shortcut: 'F8' },
    { id: 'act-new-purchase', name: 'New Purchase Voucher', category: 'Actions', url: '/purchase-vouchers/new', shortcut: 'F9' },
    { id: 'act-new-customer', name: 'New Customer Ledger', category: 'Actions', url: '/customers/new', shortcut: 'Ctrl+C' },
    { id: 'act-new-supplier', name: 'New Supplier Ledger', category: 'Actions', url: '/suppliers/new', shortcut: 'Alt+S' },
    { id: 'nav-dashboard', name: 'Go to Dashboard', category: 'Navigation', url: '/dashboard' },
    { id: 'nav-customers', name: 'Go to Customers List', category: 'Navigation', url: '/customers' },
    { id: 'nav-suppliers', name: 'Go to Suppliers List', category: 'Navigation', url: '/suppliers' },
    { id: 'nav-items', name: 'Go to Stock Items Inventory', category: 'Navigation', url: '/items' },
    { id: 'nav-sales', name: 'Go to Sales Vouchers', category: 'Navigation', url: '/sales-vouchers' },
    { id: 'nav-purchases', name: 'Go to Purchase Vouchers', category: 'Navigation', url: '/purchase-vouchers' }
  ];

  // Fetch dynamic items (customers, suppliers, stock items)
  useEffect(() => {
    if (!isOpen) return;

    const fetchDropdownData = async () => {
      try {
        const [custs, supps, stock] = await Promise.all([
          apiRequest('/customers').catch(() => []),
          apiRequest('/suppliers').catch(() => []),
          apiRequest('/items').catch(() => [])
        ]);

        const dynamicItems: CommandItem[] = [
          ...custs.map((c: any) => ({
            id: `cust-${c.id}`,
            name: `Customer: ${c.name} (${c.mobile || 'No Mobile'})`,
            category: 'Customers' as const,
            url: `/customers/${c.id}`
          })),
          ...supps.map((s: any) => ({
            id: `supp-${s.id}`,
            name: `Supplier: ${s.name} (${s.contact || 'No Contact'})`,
            category: 'Suppliers' as const,
            url: `/suppliers/${s.id}`
          })),
          ...stock.map((i: any) => ({
            id: `item-${i.id}`,
            name: `Stock Item: ${i.name} (SKU: ${i.sku})`,
            category: 'Stock Items' as const,
            url: `/items/${i.id}`
          }))
        ];

        setItems([...staticItems, ...dynamicItems]);
      } catch (err) {
        console.error('Failed to fetch command menu data', err);
        setItems(staticItems);
      }
    };

    fetchDropdownData();
    setQuery('');
    setSelectedIndex(0);
  }, [isOpen]);

  // Focus input when menu opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter items based on query
  useEffect(() => {
    if (!query) {
      // Show first 12 items by default (mostly static + first few dynamic)
      setFiltered(items.slice(0, 15));
    } else {
      const q = query.toLowerCase();
      const matches = items.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q)
      );
      setFiltered(matches);
    }
    setSelectedIndex(0);
  }, [query, items]);

  // Keyboard navigation inside command search list
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          router.push(filtered[selectedIndex].url);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [isOpen, filtered, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-24 px-4">
      <div 
        ref={containerRef}
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[500px]"
      >
        {/* Input Bar */}
        <div className="flex items-center border-b border-slate-700 px-4 py-3 bg-slate-950">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, customer, supplier, or SKU..."
            className="flex-1 bg-transparent border-0 outline-hidden text-white text-base placeholder-slate-500 font-sans"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="text-[10px] text-slate-500 border border-slate-700 rounded-md px-1.5 py-0.5 mr-2 font-mono bg-slate-900">
            ESC
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of matches */}
        <div className="overflow-y-auto flex-1 py-2 px-1">
          {filtered.length === 0 ? (
            <div className="text-slate-400 text-center py-8 text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSel = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    router.push(item.url);
                    onClose();
                  }}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg mx-2 cursor-pointer transition-colors ${
                    isSel 
                      ? 'bg-indigo-600 text-white font-medium' 
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.category === 'Actions' && <FileText className="w-4 h-4 text-emerald-400" />}
                    {item.category === 'Customers' && <Users className="w-4 h-4 text-sky-400" />}
                    {item.category === 'Suppliers' && <User className="w-4 h-4 text-amber-400" />}
                    {item.category === 'Stock Items' && <Box className="w-4 h-4 text-violet-400" />}
                    {item.category === 'Navigation' && <ArrowRight className="w-4 h-4 text-slate-400" />}

                    <span className="text-sm font-sans">{item.name}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                      isSel 
                        ? 'bg-indigo-500 text-indigo-100' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.category}
                    </span>

                    {item.shortcut && (
                      <span className={`text-[10px] font-mono border rounded px-1.5 py-0.5 ${
                        isSel 
                          ? 'border-indigo-400 text-indigo-100' 
                          : 'border-slate-700 text-slate-500 bg-slate-950'
                      }`}>
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tip Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex justify-between text-[11px] text-slate-500 font-sans">
          <div>
            Use <kbd className="font-mono bg-slate-900 border border-slate-700 rounded px-1 text-slate-400">↑↓</kbd> to navigate, <kbd className="font-mono bg-slate-900 border border-slate-700 rounded px-1 text-slate-400">Enter</kbd> to select
          </div>
          <div>
            Fuzzy command menu &bull; Ctrl+K
          </div>
        </div>
      </div>
    </div>
  );
}
