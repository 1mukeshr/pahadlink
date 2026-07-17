import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { ArrowLeftIcon, ArrowRightIcon } from '../icons'
import { categoryPath } from '../../config'
import { categoryGroups } from '../../data/siteData'

const CategoryNav = () => {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const trackRef = useRef(null)

  const needsSlider = canScrollLeft || canScrollRight

  const updateScrollState = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const { scrollLeft, scrollWidth, clientWidth } = track
    const nextLeft = scrollLeft > 8
    const nextRight = scrollLeft + clientWidth < scrollWidth - 8

    setCanScrollLeft((prev) => (prev === nextLeft ? prev : nextLeft))
    setCanScrollRight((prev) => (prev === nextRight ? prev : nextRight))
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    updateScrollState()

    const observer = new ResizeObserver(updateScrollState)
    observer.observe(track)

    track.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      observer.disconnect()
      track.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  const scrollTrack = (direction) => {
    const track = trackRef.current
    if (!track) return

    const step = Math.min(220, Math.max(140, track.clientWidth * 0.45))
    track.scrollBy({
      left: direction === 'next' ? step : -step,
      behavior: 'smooth',
    })
  }

  return (
    <nav className="header-categories" aria-label="Categories">
      <div className="header-categories-wrap">
        {needsSlider && (
          <button
            type="button"
            className="category-slider-btn category-slider-btn--prev"
            onClick={() => scrollTrack('prev')}
            disabled={!canScrollLeft}
            aria-label="Scroll categories left"
          >
            <ArrowLeftIcon size={15} />
          </button>
        )}

        <div className="header-categories-track-wrap">
          {needsSlider && canScrollLeft && (
            <div className="category-slider-fade category-slider-fade--left" aria-hidden="true" />
          )}
          {needsSlider && canScrollRight && (
            <div className="category-slider-fade category-slider-fade--right" aria-hidden="true" />
          )}

          <div className="header-categories-inner" ref={trackRef}>
            {categoryGroups.map((group) => (
              <div key={group.id} className="header-category-item">
                <NavLink
                  to={categoryPath(group.id)}
                  className={({ isActive }) =>
                    `header-category-link${isActive ? ' header-category-link--active' : ''}`
                  }
                >
                  <span className="header-category-name">{group.name}</span>
                </NavLink>
              </div>
            ))}
          </div>
        </div>

        {needsSlider && (
          <button
            type="button"
            className="category-slider-btn category-slider-btn--next"
            onClick={() => scrollTrack('next')}
            disabled={!canScrollRight}
            aria-label="Scroll categories right"
          >
            <ArrowRightIcon size={15} />
          </button>
        )}
      </div>
    </nav>
  )
}

export default memo(CategoryNav)
