'use client';

import React, { useState } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import CommandMenu from './CommandMenu';
import Navbar from './Navbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useKeyboardShortcuts({
    onToggleSearch: () => setSearchOpen(prev => !prev),
    onCloseModal: () => setSearchOpen(false),
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar onOpenSearch={() => setSearchOpen(true)} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <CommandMenu isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
