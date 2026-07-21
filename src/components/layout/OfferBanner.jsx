import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, CheckIcon, CopyIcon } from '../icons'
import { ROUTES } from '../../config'
import { homeOffers } from '../../data/siteData'

const copyToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const input = document.createElement('textarea')
  input.value = text
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()

  if (!copied) throw new Error('Copy failed')
}

const OfferBanner = () => {
  const [copiedCode, setCopiedCode] = useState('')
  const copyTimerRef = useRef(null)

  useEffect(
    () => () => {
      window.clearTimeout(copyTimerRef.current)
    },
    []
  )

  if (!homeOffers?.length) return null

  const featured =
    homeOffers.find((offer) => offer.featured) || homeOffers[0]
  const sideOffers = homeOffers.filter((offer) => offer.id !== featured.id)

  const onCopyCode = async () => {
    try {
      await copyToClipboard(featured.code)
      setCopiedCode(featured.code)
      window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopiedCode(''), 2000)
    } catch {
      setCopiedCode('')
    }
  }

  return (
    <section className="home-offer" aria-label="Current offers">
      <div className="container home-offer__layout">
        <div className="home-offer__featured">
          <img
            src={featured.image}
            alt={featured.title}
            className="home-offer__featured-img"
            loading="lazy"
          />
          <div className="home-offer__featured-shade" aria-hidden="true" />
          <div className="home-offer__featured-copy">
            <p className="home-offer__eyebrow">{featured.eyebrow}</p>
            <h2>{featured.title}</h2>
            <p className="home-offer__text">{featured.text}</p>
            <div className="home-offer__actions">
              {featured.code && (
                <button
                  type="button"
                  className="home-offer__code"
                  onClick={onCopyCode}
                  aria-label={
                    copiedCode === featured.code
                      ? `${featured.code} copied`
                      : `Copy coupon code ${featured.code}`
                  }
                >
                  Code <strong>{featured.code}</strong>
                  {copiedCode === featured.code ? (
                    <CheckIcon size={15} aria-hidden="true" />
                  ) : (
                    <CopyIcon size={15} aria-hidden="true" />
                  )}
                </button>
              )}
              <Link
                to={featured.href || ROUTES.SHOP}
                className="home-offer__cta"
              >
                {featured.cta}
                <ArrowRightIcon size={15} />
              </Link>
            </div>
          </div>
        </div>

        {sideOffers.length > 0 && (
          <div className="home-offer__side">
            {sideOffers.map((offer) => (
              <Link
                key={offer.id}
                to={offer.href || ROUTES.SHOP}
                className="home-offer__tile"
              >
                <span className="home-offer__tile-media" aria-hidden="true">
                  <img src={offer.image} alt="" loading="lazy" />
                </span>
                <span className="home-offer__tile-copy">
                  <em>{offer.eyebrow}</em>
                  <strong>{offer.title}</strong>
                  <span className="home-offer__tile-cta">
                    {offer.cta}
                    <ArrowRightIcon size={14} />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default OfferBanner
