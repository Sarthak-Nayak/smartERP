'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password);
      setSuccess('Account created! Redirecting to login...');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email may already be in use.');
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
            SmartERP Register
          </div>
          <h1 className="text-xl font-bold text-white">Create New Account</h1>
          <p className="text-xs text-slate-400 mt-1">Get started with billing, inventory, and ledgers</p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="bg-red-950/45 border border-red-800/80 rounded-md p-3 mb-4 text-xs text-red-300 font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-950/45 border border-emerald-800/80 rounded-md p-3 mb-4 text-xs text-emerald-300 font-medium">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="operator@smarterp.com"
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

          <div>
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-md transition-colors text-xs cursor-pointer disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Registering...' : 'Register Account'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
          Already registered?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
