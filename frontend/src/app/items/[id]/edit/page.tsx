'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest } from '../../../../lib/api';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

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

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema) as any
  });

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await apiRequest(`/items/${id}`);
        const item = data.item;
        setValue('name', item.name);
        setValue('sku', item.sku);
        setValue('unit', item.unit);
        setValue('purchaseRate', Number(item.purchaseRate));
        setValue('sellingRate', Number(item.sellingRate));
        setValue('openingStock', Number(item.openingStock));
        setValue('gstPercent', Number(item.gstPercent));
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load item details');
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, setValue]);

  const onSubmit = async (values: ItemFormValues) => {
    setSubmitting(true);
    setError('');
    try {
      await apiRequest(`/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(values)
      });
      router.push('/items');
    } catch (err: any) {
      setError(err.message || 'Failed to update stock item ledger.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading ledger data...</div>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans text-xs">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <Link href="/items" className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Edit Stock Item</h1>
          <p className="text-[10px] text-slate-400 mt-1">Modify stock name, SKU identity, rates, and unit of measure</p>
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
                {...register('name')}
                disabled={submitting}
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
                <p className="text-rose-450 mt-1 text-[10px]">{errors.unit.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Purchase Rate ($) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input font-bold"
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
              className="w-1/2 flex items-center justify-center space-x-1.5 bg-indigo-650 hover:bg-indigo-500 text-white font-bold py-2 rounded-md transition-colors cursor-pointer"
              disabled={submitting}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
