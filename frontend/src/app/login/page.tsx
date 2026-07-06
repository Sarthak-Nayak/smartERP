'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block bg-indigo-600 px-3 py-1 rounded text-white text-xs font-black tracking-wider uppercase mb-2">
            SmartERP Portal
          </div>
          <h1 className="text-xl font-bold text-white">Sign In to Account</h1>
          <p className="text-xs text-slate-400 mt-1">Enter your details to access the ledger portal</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-950/45 border border-red-800/80 rounded-md p-3 mb-4 text-xs text-red-300 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@smarterp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-md transition-colors text-xs cursor-pointer disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
          New to the portal?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-bold">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
