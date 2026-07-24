const AuthLayout = ({ title, children }) => {
  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-card-head">
              <h2>{title}</h2>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}

export default AuthLayout
