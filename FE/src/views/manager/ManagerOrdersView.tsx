'use client';



import { useCallback, useEffect, useMemo, useState } from 'react';

import { BRAND } from '@/lib/brand';

import { usePolling } from '@/lib/use-polling';

import { OrderController } from '@/controllers/order.controller';
import { useActiveBranch } from '@/lib/use-active-branch';

import { formatCurrency } from '@/lib/format';

import {

  normalizeStatus,

  Order,

  OrderStatus,

} from '@/models/order.model';

import { WORK_SHIFT_LABELS, WorkShift } from '@/models/staff.model';

import { OrderStatusBadge } from '@/views/orders/OrderStatusBadge';

import { InventoryPageHeader } from '@/views/inventory/inventory-ui';

import { ManagerLayout } from './ManagerLayout';



export function ManagerOrdersView() {

  const { branchId, isChain, version } = useActiveBranch();
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);

  const [shift, setShift] = useState<WorkShift | 'ALL'>('ALL');



  const load = useCallback(async (silent = false) => {

    if (!silent) setLoading(true);

    try {

      const data = await OrderController.getToday(

        shift === 'ALL' ? undefined : shift,

        false,

        isChain ? branchId : undefined,

        true,

      );

      setOrders(data);

    } catch {

      /* ignore */

    } finally {

      if (!silent) setLoading(false);

    }

  }, [shift, isChain, branchId, version]);



  useEffect(() => {

    void load(false);

  }, [load]);



  usePolling(() => load(true), 15_000, true);



  const stats = useMemo(() => {

    const active = orders.filter(

      (o) => normalizeStatus(o.status) !== OrderStatus.CANCELLED,

    );

    const revenue = active.reduce((s, o) => s + (o.total ?? 0), 0);

    return {

      total: active.length,

      pending: active.filter(

        (o) => normalizeStatus(o.status) === OrderStatus.PENDING,

      ).length,

      preparing: active.filter(

        (o) => normalizeStatus(o.status) === OrderStatus.PREPARING,

      ).length,

      ready: active.filter(

        (o) => normalizeStatus(o.status) === OrderStatus.READY,

      ).length,

      revenue,

    };

  }, [orders]);



  return (

    <ManagerLayout>

      <div className="space-y-6">

        <InventoryPageHeader

          theme="warehouse"

          badge="Bán hàng"

          title="Đơn hàng hôm nay"

          subtitle="Theo dõi tiến độ thu ngân và bếp theo ca."

        />



        <div className="flex flex-wrap gap-2">

          <button

            type="button"

            onClick={() => setShift('ALL')}

            className={`rounded-full px-4 py-1.5 text-sm font-medium ${

              shift === 'ALL' ? `${BRAND.primary} text-white` : 'bg-white text-stone-600 ring-1 ring-stone-200'

            }`}

          >

            Tất cả ca

          </button>

          {Object.values(WorkShift).map((s) => (

            <button

              key={s}

              type="button"

              onClick={() => setShift(s)}

              className={`rounded-full px-4 py-1.5 text-sm font-medium ${

                shift === s ? `${BRAND.primary} text-white` : 'bg-white text-stone-600 ring-1 ring-stone-200'

              }`}

            >

              {WORK_SHIFT_LABELS[s]}

            </button>

          ))}

        </div>



        <div className="grid gap-3 sm:grid-cols-4">

          <div className="rounded-xl border border-stone-200 bg-white p-4">

            <p className="text-xs text-stone-500">Đơn (không hủy)</p>

            <p className="text-2xl font-bold">{stats.total}</p>

          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

            <p className="text-xs text-amber-800">Chờ bếp</p>

            <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>

          </div>

          <div className={`rounded-xl border p-4 ${BRAND.primarySoft}`}>

            <p className="text-xs opacity-80">Đang làm</p>

            <p className="text-2xl font-bold">{stats.preparing}</p>

          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

            <p className="text-xs text-emerald-800">Doanh thu</p>

            <p className="text-lg font-bold text-emerald-900">

              {formatCurrency(stats.revenue)}

            </p>

          </div>

        </div>



        {loading ? (

          <p className="text-stone-500">Đang tải...</p>

        ) : (

          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">

            <table className="w-full text-left text-sm">

              <thead className="bg-stone-50 text-stone-600">

                <tr>

                  <th className="px-4 py-3">Mã</th>

                  <th className="px-4 py-3">Ca</th>

                  <th className="px-4 py-3">Trạng thái</th>

                  <th className="px-4 py-3 text-right">Tổng</th>

                </tr>

              </thead>

              <tbody>

                {orders.length === 0 ? (

                  <tr>

                    <td colSpan={4} className="px-4 py-8 text-center text-stone-500">

                      Chưa có đơn hôm nay

                    </td>

                  </tr>

                ) : (

                  orders.map((o) => (

                    <tr key={o.id} className="border-t border-stone-100">

                      <td className="px-4 py-3 font-mono text-xs">

                        {o.invoiceNumber ?? o.orderNumber}

                      </td>

                      <td className="px-4 py-3">

                        {o.workShift ? WORK_SHIFT_LABELS[o.workShift as WorkShift] : '—'}

                      </td>

                      <td className="px-4 py-3">

                        <OrderStatusBadge status={o.status} />

                      </td>

                      <td className="px-4 py-3 text-right font-medium">

                        {formatCurrency(o.total)}

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </ManagerLayout>

  );

}


