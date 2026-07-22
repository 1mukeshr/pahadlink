import OrdersDesk from './OrdersDesk'

/** Admin dashboard (KPIs + charts) */
export default function AdminPage() {
  return <OrdersDesk mode="admin" view="dashboard" bare />
}
