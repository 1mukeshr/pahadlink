const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-card-head">
              <h2>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}

export default AuthLayout
