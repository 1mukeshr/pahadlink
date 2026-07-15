import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/css/style.css'
import './assets/css/responsive.css'
import App from './App.jsx'

class RootErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
            color: '#7a1028',
            maxWidth: 640,
            margin: '40px auto',
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>PahadLink failed to load</h1>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: '#fff5f9',
              border: '1px solid #f0d0dc',
              borderRadius: 8,
              padding: 12,
              fontSize: 13,
            }}
          >
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>
  )
} else {
  document.body.innerHTML =
    '<p style="padding:24px;font-family:system-ui">Missing #root element.</p>'
}
