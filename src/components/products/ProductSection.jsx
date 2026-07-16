import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'
import { ArrowRightIcon } from '../icons'
import { ROUTES } from '../../config'
import { getProductsByTag, productTabs } from '../../data/siteData'

/**
 * Home product shelf - 5 cards per row, View all after products
 */
const ProductSection = ({
  id,
  title,
  subtitle,
  tag = 'bestseller',
  tabs = false,
  limit = 5,
  seeAllHref = ROUTES.SHOP,
  seeAllLabel = 'View all',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(tag)
  const list = getProductsByTag(tabs ? activeTab : tag).slice(0, limit)
  const SeeAllTag = seeAllHref.startsWith('/') ? Link : 'a'
  const seeAllProps = seeAllHref.startsWith('/')
    ? { to: seeAllHref }
    : { href: seeAllHref }

  return (
    <section className={`product-section ${className}`.trim()} id={id}>
      <div className="container">
        <div className="product-section__head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="product-section__sub">{subtitle}</p>}
          </div>
        </div>

        {tabs && (
          <div className="product-section__tabs" role="tablist" aria-label="Product filters">
            {productTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                className={`product-section__tab${activeTab === t.id ? ' is-active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="product-grid">
          {list.map((product) => (
            <ProductCard key={`${activeTab}-${product.id}`} product={product} />
          ))}
        </div>

        <div className="product-section__footer">
          <SeeAllTag {...seeAllProps} className="product-section__see-all">
            <span>{seeAllLabel}</span>
            <ArrowRightIcon size={16} />
          </SeeAllTag>
        </div>
      </div>
    </section>
  )
}

export default ProductSection
