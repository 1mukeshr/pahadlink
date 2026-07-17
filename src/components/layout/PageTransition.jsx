/**
 * Stable route wrapper - no remount key, no fade animation.
 * Loading feedback is handled by RouteProgress + Suspense PageLoader.
 */
const PageTransition = ({ children }) => (
  <div className="page-shell">{children}</div>
)

export default PageTransition
