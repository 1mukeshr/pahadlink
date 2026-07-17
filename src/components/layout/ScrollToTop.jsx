import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scroll to top on path changes only (not search/filter) to avoid jump flicker.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      const el = id ? document.getElementById(id) : null
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'start' })
        return
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash])

  return null
}

export default ScrollToTop
