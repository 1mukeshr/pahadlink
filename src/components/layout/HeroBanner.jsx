import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES, categoryPath, productPath } from '../../config'
import { productBanners } from '../../data/siteData'

/** Large product-related hero banners */
const LARGE_SLIDES = productBanners.map((banner) => ({
  alt: banner.alt,
  to: productPath(banner.id),
  image: banner.image,
}))

/** Side panels - related product deep-links */
const SMALL_PANELS = [
  {
    to: productPath('raw-honey'),
    image: productBanners[0].image,
    label: 'Shop raw honey',
  },
  {
    to: categoryPath('organic-food'),
    image: productBanners[1].image,
    label: 'Shop organic food',
  },
]

/**
 * Large product banner slider + two related product cards
 */
const HeroBanner = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % LARGE_SLIDES.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="mf-hero" aria-label="PahadLink product banners">
      <div className="mf-hero__inner">
        <div className="mf-hero__grid">
          <div className="mf-hero__large-wrap">
            {LARGE_SLIDES.map((slide, i) => (
              <div
                key={slide.alt}
                className={`mf-hero__panel-img${i === index ? ' is-active' : ''}`}
              >
                <Link to={slide.to}>
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    width={1200}
                    height={675}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                  />
                </Link>
              </div>
            ))}

            <div className="mf-hero__cta">
              <Link to={ROUTES.SHOP} className="mf-hero__shop-btn">
                Shop now
              </Link>
            </div>

            <div className="mf-hero__dots" role="tablist" aria-label="Banner slides">
              {LARGE_SLIDES.map((slide, i) => (
                <button
                  key={slide.alt}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  className={`mf-hero__dot${i === index ? ' is-active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Slide ${i + 1}: ${slide.alt}`}
                />
              ))}
            </div>
          </div>

          <div className="mf-hero__smalls-row">
            {SMALL_PANELS.map((panel) => (
              <div key={panel.label} className="mf-hero__small-wrap">
                <Link
                  to={panel.to}
                  className="mf-hero__video-link"
                  aria-label={panel.label}
                >
                  <img
                    className="mf-hero__video"
                    src={panel.image}
                    alt={panel.label}
                    width={700}
                    height={400}
                    loading="lazy"
                    decoding="async"
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroBanner
