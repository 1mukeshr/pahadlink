import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Thin top progress bar for path changes - no page remount / fade flicker.
 */
const RouteProgress = () => {
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)
  const [complete, setComplete] = useState(false)
  const first = useRef(true)
  const timers = useRef([])

  useEffect(() => {
    if (first.current) {
      first.current = false
      return undefined
    }

    timers.current.forEach(clearTimeout)
    timers.current = []

    setVisible(true)
    setComplete(false)

    const doneAt = window.setTimeout(() => setComplete(true), 200)
    const hideAt = window.setTimeout(() => {
      setVisible(false)
      setComplete(false)
    }, 380)

    timers.current = [doneAt, hideAt]
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      className={`route-progress${complete ? ' is-complete' : ''}`}
      role="progressbar"
      aria-hidden="true"
    />
  )
}

export default RouteProgress
