'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest } from '../../../lib/api';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';

const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  mobile: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  openingBalance: z.coerce.number().min(0, 'Opening balance cannot be negative')
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function NewCustomerPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: '',
      mobile: '',
      address: '',
      openingBalance: 0
    }
  });

  const onSubmit = async (values: CustomerFormValues) => {
    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/customers', {
        method: 'POST',
        body: JSON.stringify(values)
      });
      router.push('/customers');
    } catch (err: any) {
      setError(err.message || 'Failed to create customer ledger.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans text-xs">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <Link href="/customers" className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Create Customer Ledger</h1>
          <p className="text-[10px] text-slate-400 mt-1">Configure name, opening balance, and contact parameters</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Form Card */}
      <div className="card-panel bg-slate-900">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Customer Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. ABC Corporates"
              {...register('name')}
              disabled={submitting}
              autoFocus
            />
            {errors.name && (
              <p className="text-rose-400 mt-1 text-[10px]">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Mobile Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 9876543210"
              {...register('mobile')}
              disabled={submitting}
            />
            {errors.mobile && (
              <p className="text-rose-400 mt-1 text-[10px]">{errors.mobile.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Address</label>
            <textarea
              className="form-input min-h-[60px]"
              placeholder="Enter customer address details..."
              {...register('address')}
              disabled={submitting}
            />
            {errors.address && (
              <p className="text-rose-400 mt-1 text-[10px]">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Opening Balance ($)</label>
            <input
              type="number"
              step="0.01"
              className="form-input font-bold"
              placeholder="0.00"
              {...register('openingBalance')}
              disabled={submitting}
            />
            {errors.openingBalance && (
              <p className="text-rose-400 mt-1 text-[10px]">{errors.openingBalance.message}</p>
            )}
          </div>

          <div className="flex space-x-2 pt-2">
            <Link
              href="/customers"
              className="w-1/2 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-md transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="w-1/2 flex items-center justify-center space-x-1.5 bg-indigo-650 hover:bg-indigo-500 text-white font-bold py-2 rounded-md transition-colors cursor-pointer"
              disabled={submitting}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{submitting ? 'Creating...' : 'Create Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
