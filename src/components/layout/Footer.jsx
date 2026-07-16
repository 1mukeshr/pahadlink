import { Link } from 'react-router-dom'
import {
  MountainIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
} from '../icons'
import { ROUTES, categoryPath } from '../../config'
import { categoryGroups } from '../../data/siteData'

const Footer = () => {
  const year = new Date().getFullYear()
  const topCategories = categoryGroups.slice(0, 5)

  return (
    <footer className="site-footer">
      <div className="container footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to={ROUTES.HOME} className="footer-logo" aria-label="PahadLink home">
              <span className="footer-logo-mark" aria-hidden="true">
                <MountainIcon size={18} />
              </span>
              <span className="footer-logo-text">
                Pahad<span>Link</span>
              </span>
            </Link>
            <p>
              Pure Himalayan foods, crafts, and everyday essentials - sourced from
              local makers across Uttarakhand and delivered across India.
            </p>

            <div className="footer-contact">
              <a href="tel:+919690421423" className="footer-contact__link">
                <PhoneIcon size={15} />
                +91 96904 21423
              </a>
              <a href="mailto:care@pahadlink.com" className="footer-contact__link">
                <MailIcon size={15} />
                care@pahadlink.com
              </a>
              <p className="footer-contact__address">
                <MapPinIcon size={15} />
                <span>Almora Road, Haldwani, Uttarakhand 263139</span>
              </p>
            </div>
          </div>

          <div className="footer-links">
            <h4>Shop</h4>
            <ul>
              <li><Link to={ROUTES.SHOP}>All products</Link></li>
              {topCategories.map((group) => (
                <li key={group.id}>
                  <Link to={categoryPath(group.id)}>
                    {group.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-links">
            <h4>Help</h4>
            <ul>
              <li><Link to={ROUTES.CONTACT}>Contact us</Link></li>
              <li><a href="/#faq">FAQs</a></li>
              <li><Link to={ROUTES.REFUNDS}>Shipping & returns</Link></li>
              <li><Link to={ROUTES.ORDERS}>Track order</Link></li>
              <li><Link to={ROUTES.WISHLIST}>Wishlist</Link></li>
              <li><Link to={ROUTES.ACCOUNT}>My account</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><a href="/#why">Why we&apos;re unique</a></li>
              <li><a href="/#reviews">Customer reviews</a></li>
              <li><Link to={ROUTES.CONTACT}>Partner with us</Link></li>
              <li><Link to={ROUTES.TERMS}>Terms of use</Link></li>
              <li><Link to={ROUTES.PRIVACY}>Privacy policy</Link></li>
              <li><Link to={ROUTES.REGISTER}>Create account</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {year} PahadLink. Made with care in Uttarakhand.</p>
          <div className="footer-legal">
            <Link to={ROUTES.TERMS}>Terms</Link>
            <Link to={ROUTES.PRIVACY}>Privacy</Link>
            <Link to={ROUTES.REFUNDS}>Refunds</Link>
            <Link to={ROUTES.CONTACT}>Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
