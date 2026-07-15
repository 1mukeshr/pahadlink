const PageLoader = () => (
  <div className="page-loader" role="status" aria-live="polite" aria-busy="true">
    <span className="page-loader__spinner" aria-hidden="true" />
    <span className="sr-only">Loading page</span>
  </div>
)

export default PageLoader
