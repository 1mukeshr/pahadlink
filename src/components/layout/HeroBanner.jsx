import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '../icons'
import { categoryPath, productPath } from '../../config'
import { productBanners } from '../../data/siteData'

/** Large product-related hero banners */
const LARGE_SLIDES = productBanners.map((banner) => ({
  alt: banner.alt,
  title: banner.title,
  text: banner.text,
  to: productPath(banner.id),
  image: banner.image,
}))

/** Side panels - related product deep-links */
const SMALL_PANELS = [
  {
    to: productPath('raw-honey'),
    image: productBanners[0].image,
    title: 'Raw honey',
    text: 'Unprocessed forest honey from local keepers.',
    button: 'Shop honey',
  },
  {
    to: categoryPath('organic-food'),
    image: productBanners[1].image,
    title: 'Organic foods',
    text: 'Hill staples for everyday pahadi cooking.',
    button: 'Shop organic',
  },
]

/**
 * Large product banner slider + two related product cards
 */
const HeroBanner = () => {
  const [index, setIndex] = useState(0)
  const active = LARGE_SLIDES[index]

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
                <img
                  src={slide.image}
                  alt={slide.alt}
                  width={1200}
                  height={675}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                />
              </div>
            ))}

            <div className="mf-hero__cta" key={active.alt}>
              <p className="mf-hero__eyebrow">From the hills</p>
              <h2 className="mf-hero__title">{active.title}</h2>
              <p className="mf-hero__text">{active.text}</p>
              <Link to={active.to} className="mf-hero__shop-btn">
                <span>Shop now</span>
                <ArrowRightIcon size={16} />
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
              <div key={panel.title} className="mf-hero__small-wrap">
                <img
                  className="mf-hero__video"
                  src={panel.image}
                  alt=""
                  width={700}
                  height={400}
                  loading="lazy"
                  decoding="async"
                />
                <div className="mf-hero__small-content">
                  <h3 className="mf-hero__small-title">{panel.title}</h3>
                  <p className="mf-hero__small-text">{panel.text}</p>
                  <Link to={panel.to} className="mf-hero__small-btn">
                    <span>{panel.button}</span>
                    <ArrowRightIcon size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroBanner
