import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Keep route changes stable: jump to top without smooth-scroll jitter.
 */
const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation()

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
  }, [pathname, search, hash])

  return null
}

export default ScrollToTop
