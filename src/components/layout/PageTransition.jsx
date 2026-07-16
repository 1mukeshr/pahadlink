import { useLocation } from 'react-router-dom'

/**
 * Soft fade when a route mounts — opacity only (no bounce).
 */
const PageTransition = ({ children }) => {
  const { pathname, search } = useLocation()

  return (
    <div key={`${pathname}${search}`} className="page-transition">
      {children}
    </div>
  )
}

export default PageTransition
