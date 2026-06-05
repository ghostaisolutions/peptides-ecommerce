import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdminAuthenticated } from '@/lib/auth/admin';
import { getOrderStats, listOrderRequestRecords } from '@/lib/services/order-requests';
import type { OrderWorkflowStatus } from '@/lib/types';
import { currency } from '@/lib/utils/format';

const statusOptions: Array<{ value: 'all' | OrderWorkflowStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'approved', label: 'Approved' },
  { value: 'payment-sent', label: 'Payment Sent' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  const { status, q } = await searchParams;
  const selectedStatus = statusOptions.some((option) => option.value === status)
    ? (status as 'all' | OrderWorkflowStatus)
    : 'all';

  const [orders, stats] = await Promise.all([
    listOrderRequestRecords({
      status: selectedStatus,
      query: q,
    }),
    getOrderStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Admin Orders</h1>
          <p className="mt-2 text-sm text-[var(--color-sand)]">Manage order workflow statuses, payment follow-up steps, and completion progress.</p>
        </div>
        <Link className="btn-secondary" href="/admin">Back to Dashboard</Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Orders" value={String(stats.total)} />
        <StatCard label="Conversion Rate" value={`${stats.conversionRate.toFixed(1)}%`} />
        <StatCard label="Total Revenue" value={currency(stats.totalRevenue)} />
        <StatCard label="Pending Revenue" value={currency(stats.pendingRevenue)} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Pending" value={String(stats.pending)} />
        <StatCard label="Approved" value={String(stats.approved)} />
        <StatCard label="Needs Follow-up" value={String(stats.needsFollowUp)} />
      </section>

      <form className="grid gap-3 rounded-xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-4 md:grid-cols-[1fr_220px_auto]" method="GET">
        <input
          className="input"
          name="q"
          placeholder="Search by email or order ID"
          defaultValue={q ?? ''}
        />
        <select className="input" name="status" defaultValue={selectedStatus}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button className="btn-primary" type="submit">Filter</button>
      </form>

      <section className="overflow-hidden rounded-xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[var(--color-ivory)]">
            <thead className="bg-[rgba(212,175,55,0.08)] text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const total = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
                const rowClassName =
                  order.status === 'pending'
                    ? 'bg-[rgba(212,175,55,0.08)]'
                    : order.status === 'payment-sent'
                      ? 'bg-[rgba(96,165,250,0.10)]'
                      : order.status === 'completed'
                        ? 'bg-[rgba(74,222,128,0.08)]'
                        : 'bg-transparent';
                return (
                  <tr
                    key={order.orderReference}
                    className={`border-t border-[var(--color-gold-soft)] text-[var(--color-ivory)] ${rowClassName}`}
                  >
                    <td className="px-4 py-3 font-medium">
                      <Link className="text-[var(--color-ivory)] hover:text-[var(--color-gold)]" href={`/admin/orders/${encodeURIComponent(order.orderReference)}`}>
                        {order.orderReference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3">{order.email}</td>
                    <td className="px-4 py-3">{currency(total)}</td>
                    <td className="px-4 py-3 capitalize">
                      {order.status.replace('-', ' ')}
                      {order.needsFollowUp ? <span className="ml-2 text-xs text-rose-300">Needs follow-up</span> : null}
                    </td>
                    <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}
              {orders.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-[var(--color-sand)]" colSpan={6}>
                    No orders match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <article className="rounded-xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-4">
    <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">{label}</p>
    <p className="mt-2 font-serif text-3xl text-[var(--color-ivory)]">{value}</p>
  </article>
);
