import { Outlet } from 'react-router-dom'
import AdminLayout from './AdminLayout'

/** Shared admin shell — child routes render in the main pane */
export default function AdminPortal() {
  return (
    <AdminLayout mode="admin">
      <Outlet />
    </AdminLayout>
  )
}
