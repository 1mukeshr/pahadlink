import logo from '../../assets/images/logo.png'

const PageLoader = () => (
  <div className="page-loader" role="status" aria-live="polite" aria-busy="true">
    <div className="page-loader__brand" aria-hidden="true">
      <img src={logo} alt="" className="page-loader__logo" />
    </div>
    <span className="page-loader__spinner" aria-hidden="true" />
    <span className="sr-only">Loading PahadLink</span>
  </div>
)

export default PageLoader
