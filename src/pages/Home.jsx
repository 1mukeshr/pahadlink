import FaqSection from '../components/layout/FaqSection'
import Footer from '../components/layout/Footer'
import HeroBanner from '../components/layout/HeroBanner'
import ProductSection from '../components/products/ProductSection'
import {
  ShieldIcon,
  TruckIcon,
  CheckCircleIcon,
  MountainIcon,
  HillsIcon,
  LeafIcon,
  StarRating,
} from '../components/icons'
import { ROUTES } from '../config'
import {
  features,
  testimonials,
} from '../data/siteData'

const whyIcons = {
  leaf: LeafIcon,
  mountain: MountainIcon,
  shield: ShieldIcon,
}

/**
 * Home UX flow:
 * Banner → Trust → Best Sellers → Trending → Why us → Handpicked → Reviews
 */
const Home = () => {
  return (
    <>
      <main className="home-page">
        <HeroBanner />

        {/* 1. Trust strip */}
        <section className="benefits benefits--home" aria-label="Why shop with us">
          <div className="container benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon"><ShieldIcon size={20} /></div>
              <div>
                <h4>Secure pay</h4>
                <p>Safe checkout every time</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon"><TruckIcon size={20} /></div>
              <div>
                <h4>Free shipping</h4>
                <p>On orders above ₹499</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon"><CheckCircleIcon size={20} /></div>
              <div>
                <h4>100% natural</h4>
                <p>No artificial additives</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon"><HillsIcon size={20} /></div>
              <div>
                <h4>From the hills</h4>
                <p>Direct from local makers</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Primary products */}
        <ProductSection
          id="bestsellers"
          title="Best Sellers"
          subtitle="Favourites pahadi families order again and again."
          tag="bestseller"
          limit={5}
          seeAllHref={`${ROUTES.SHOP}?tag=bestseller`}
        />

        {/* What’s hot */}
        <ProductSection
          id="trending"
          title="Trending now"
          subtitle="Fresh picks shoppers are adding to bag right now."
          tag="trending"
          limit={5}
          seeAllHref={`${ROUTES.SHOP}?tag=trending`}
        />

        {/* Brand trust */}
        <section className="home-section why-section" id="why">
          <div className="container">
            <div className="why-section__intro">
              <p className="section-eyebrow">Why PahadLink</p>
              <h2>Better goods from the hills</h2>
              <p className="why-section__lead">
                A direct link between Himalayan makers and your doorstep - not a generic marketplace.
              </p>
            </div>
            <div className="why-grid">
              {features.map((feature, index) => {
                const Icon = whyIcons[feature.icon] || CheckCircleIcon
                return (
                  <article
                    key={feature.title}
                    className={`why-card${index === 1 ? ' why-card--featured' : ''}`}
                  >
                    <span className="why-card__step" aria-hidden="true">
                      0{index + 1}
                    </span>
                    <div className="why-card__icon">
                      <Icon size={24} />
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                    <ul className="why-card__points">
                      {feature.points.map((point) => (
                        <li key={point}>
                          <CheckCircleIcon size={15} />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* 7. Curated picks */}
        <ProductSection
          id="handpicked"
          title="Handpicked for you"
          subtitle="Seasonal favourites and artisan finds from the mountains."
          tag="handpicked"
          limit={5}
          seeAllHref={`${ROUTES.SHOP}?tag=handpicked`}
        />

        {/* 8. Social proof */}
        <section className="home-section reviews-section" id="reviews">
          <div className="container">
            <div className="section-head section-head--row reviews-head">
              <div>
                <h2>Loved across India</h2>
                <p>Real orders and honest feedback from pahadi food lovers.</p>
              </div>
              <div className="reviews-score" aria-label="Average rating 4.8 out of 5">
                <strong>4.8</strong>
                <div>
                  <StarRating rating={5} />
                  <span>Based on 500+ orders</span>
                </div>
              </div>
            </div>

            <div className="reviews-grid">
              {testimonials.map((review) => (
                <article key={review.name} className="review-card">
                  <div className="review-card__top">
                    <StarRating rating={review.rating} className="review-stars" />
                    <span className="review-verified">
                      <CheckCircleIcon size={14} />
                      Verified
                    </span>
                  </div>
                  <p className="review-text">{review.text}</p>
                  {review.product && (
                    <p className="review-product">Bought {review.product}</p>
                  )}
                  <div className="review-author">
                    <span className="review-avatar" aria-hidden="true">
                      {review.name
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                    <div>
                      <strong>{review.name}</strong>
                      <span>{review.location}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <FaqSection
          page="home"
          title="Questions shoppers ask"
          subtitle="Quick answers before you place your first order."
        />
      </main>
      <Footer />
    </>
  )
}

export default Home
