'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest } from '../../../lib/api';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  openingBalance: z.coerce.number().min(0, 'Opening balance cannot be negative')
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function NewSupplierPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: {
      name: '',
      contact: '',
      address: '',
      openingBalance: 0
    }
  });

  const onSubmit = async (values: SupplierFormValues) => {
    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/suppliers', {
        method: 'POST',
        body: JSON.stringify(values)
      });
      router.push('/suppliers');
    } catch (err: any) {
      setError(err.message || 'Failed to create supplier ledger.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans text-xs">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <Link href="/suppliers" className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Create Supplier Ledger</h1>
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
            <label className="form-label">Supplier Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Prim Goods Wholesalers"
              {...register('name')}
              disabled={submitting}
              autoFocus
            />
            {errors.name && (
              <p className="text-rose-450 mt-1 text-[10px]">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Contact Info (Phone/Email)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 9988776655 or supplier@email.com"
              {...register('contact')}
              disabled={submitting}
            />
            {errors.contact && (
              <p className="text-rose-450 mt-1 text-[10px]">{errors.contact.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Address</label>
            <textarea
              className="form-input min-h-[60px]"
              placeholder="Enter supplier location details..."
              {...register('address')}
              disabled={submitting}
            />
            {errors.address && (
              <p className="text-rose-450 mt-1 text-[10px]">{errors.address.message}</p>
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
              <p className="text-rose-450 mt-1 text-[10px]">{errors.openingBalance.message}</p>
            )}
          </div>

          <div className="flex space-x-2 pt-2">
            <Link
              href="/suppliers"
              className="w-1/2 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-md transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="w-1/2 flex items-center justify-center space-x-1.5 bg-amber-650 hover:bg-amber-500 text-white font-bold py-2 rounded-md transition-colors cursor-pointer"
              disabled={submitting}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{submitting ? 'Creating...' : 'Create Supplier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
