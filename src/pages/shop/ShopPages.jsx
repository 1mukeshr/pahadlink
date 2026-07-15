import { Link } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import FaqSection from '../../components/layout/FaqSection'
import Footer from '../../components/layout/Footer'
import { useShop } from '../../context/ShopContext'
import { HeartIcon } from '../../components/icons'
import { ROUTES, productPath } from '../../config'

const formatPrice = (n) => `₹${n.toLocaleString('en-IN')}`

const WishlistPage = () => {
  const { wishlist, wishlistCount } = useShop()

  return (
    <>
      <main className="home-page shop-page">
        <div className="breadcrumb-bar">
          <div className="container">
            <Breadcrumb items={[{ label: 'Wishlist' }]} />
          </div>
        </div>
        <section className="home-section">
          <div className="container">
            <div className="section-head section-head--row">
              <div>
                <h1>Wishlist</h1>
                <p>
                  {wishlistCount} saved item{wishlistCount === 1 ? '' : 's'}
                </p>
              </div>
              <Link to={ROUTES.SHOP} className="product-section__see-all">
                Continue shopping
              </Link>
            </div>

            {wishlist.length === 0 ? (
              <div className="shop-empty">
                <HeartIcon size={36} />
                <h2>Your wishlist is empty</h2>
                <p>Tap the heart on any product to save it here.</p>
                <Link to={ROUTES.SHOP} className="btn-hero-primary">
                  Browse products
                </Link>
              </div>
            ) : (
              <ul className="shop-list">
                {wishlist.map((item) => (
                  <li key={item.id} className="shop-list__item">
                    <Link to={productPath(item.id)} className="shop-list__link">
                      <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                      <div>
                        <strong>{item.name}</strong>
                        <span>{formatPrice(item.price)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <FaqSection page="wishlist" title="Wishlist help" />
      </main>
      <Footer />
    </>
  )
}

export { WishlistPage }
