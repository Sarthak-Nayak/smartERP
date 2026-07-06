'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  Box, 
  Receipt, 
  ShoppingCart, 
  LogOut, 
  Search 
} from 'lucide-react';

interface NavbarProps {
  onOpenSearch: () => void;
}

export default function Navbar({ onOpenSearch }: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/suppliers', label: 'Suppliers', icon: UserSquare2 },
    { href: '/items', label: 'Inventory', icon: Box },
    { href: '/sales-vouchers', label: 'Sales (F8)', icon: Receipt },
    { href: '/purchase-vouchers', label: 'Purchases (F9)', icon: ShoppingCart },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-lg font-bold tracking-tight text-white flex items-center space-x-2">
              <span className="bg-indigo-600 px-2 py-0.5 rounded text-white text-sm font-black">Smart</span>
              <span>ERP</span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex space-x-1">
              {links.map((link) => {
                const Icon = link.icon;
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-slate-850 text-indigo-400 font-bold border-b-2 border-indigo-500 rounded-b-none'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Quick Search */}
            <button
              onClick={onOpenSearch}
              className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg text-xs text-slate-400 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Search...</span>
              <kbd className="font-mono text-[9px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded-md text-slate-500">
                Ctrl+K
              </kbd>
            </button>

            {/* User Profile & LogOut */}
            <div className="flex items-center space-x-3 text-xs">
              <span className="hidden sm:inline text-slate-400 font-medium">
                {user?.email}
              </span>
              <button
                onClick={logout}
                className="flex items-center space-x-1.5 bg-slate-850 hover:bg-red-950/30 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
