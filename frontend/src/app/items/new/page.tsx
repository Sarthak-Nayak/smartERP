'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest } from '../../../lib/api';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, Box } from 'lucide-react';

const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  sku: z.string().min(1, 'SKU is required'),
  unit: z.enum(['PCS', 'KG', 'LTR', 'BOX', 'PACK']),
  purchaseRate: z.coerce.number().min(0, 'Purchase price cannot be negative'),
  sellingRate: z.coerce.number().min(0, 'Selling price cannot be negative'),
  openingStock: z.coerce.number().min(0, 'Opening stock cannot be negative'),
  gstPercent: z.coerce.number().min(0, 'GST percent cannot be negative')
});

type ItemFormValues = z.infer<typeof itemSchema>;

export default function NewItemPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema) as any,
    defaultValues: {
      name: '',
      sku: '',
      unit: 'PCS',
      purchaseRate: 0,
      sellingRate: 0,
      openingStock: 0,
      gstPercent: 0
    }
  });

  const onSubmit = async (values: ItemFormValues) => {
    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/items', {
        method: 'POST',
        body: JSON.stringify(values)
      });
      router.push('/items');
    } catch (err: any) {
      setError(err.message || 'Failed to create stock item ledger.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans text-xs">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <Link href="/items" className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Create Stock Item</h1>
          <p className="text-[10px] text-slate-400 mt-1">Configure stock name, SKU identity, rates, and unit of measure</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Item Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ergonomic Office Chair"
                {...register('name')}
                disabled={submitting}
                autoFocus
              />
              {errors.name && (
                <p className="text-rose-450 mt-1 text-[10px]">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">SKU Code *</label>
              <input
                type="text"
                className="form-input font-mono"
                placeholder="e.g. SKU-CHAIR-01"
                {...register('sku')}
                disabled={submitting}
              />
              {errors.sku && (
                <p className="text-rose-450 mt-1 text-[10px]">{errors.sku.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Unit of Measure *</label>
              <select
                className="form-input bg-slate-950 text-white"
                {...register('unit')}
                disabled={submitting}
              >
                <option value="PCS">PCS (Pieces)</option>
                <option value="KG">KG (Kilograms)</option>
                <option value="LTR">LTR (Litres)</option>
                <option value="BOX">BOX (Boxes)</option>
                <option value="PACK">PACK (Packages)</option>
              </select>
              {errors.unit && (
                <p className="text-rose-455 mt-1 text-[10px]">{errors.unit.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Purchase Rate ($) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input font-bold"
                placeholder="0.00"
                {...register('purchaseRate')}
                disabled={submitting}
              />
              {errors.purchaseRate && (
                <p className="text-rose-450 mt-1 text-[10px]">{errors.purchaseRate.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Selling Rate ($) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input font-bold"
                placeholder="0.00"
                {...register('sellingRate')}
                disabled={submitting}
              />
              {errors.sellingRate && (
                <p className="text-rose-455 mt-1 text-[10px]">{errors.sellingRate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Opening Stock Quantity</label>
              <input
                type="number"
                step="1"
                className="form-input font-bold"
                placeholder="0"
                {...register('openingStock')}
                disabled={submitting}
              />
              {errors.openingStock && (
                <p className="text-rose-450 mt-1 text-[10px]">{errors.openingStock.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">GST percentage (%)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                placeholder="18"
                {...register('gstPercent')}
                disabled={submitting}
              />
              {errors.gstPercent && (
                <p className="text-rose-450 mt-1 text-[10px]">{errors.gstPercent.message}</p>
              )}
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <Link
              href="/items"
              className="w-1/2 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-md transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="w-1/2 flex items-center justify-center space-x-1.5 bg-violet-650 hover:bg-violet-500 text-white font-bold py-2 rounded-md transition-colors cursor-pointer"
              disabled={submitting}
            >
              <Box className="w-3.5 h-3.5" />
              <span>{submitting ? 'Creating...' : 'Create Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
