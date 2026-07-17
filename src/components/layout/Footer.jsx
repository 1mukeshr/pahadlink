import { Link } from 'react-router-dom'
import {
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  InstagramIcon,
  FacebookIcon,
  YoutubeIcon,
  WhatsAppIcon,
} from '../icons'
import { ROUTES, categoryPath } from '../../config'
import { categoryGroups } from '../../data/siteData'
import logoLight from '../../assets/images/logo-light.png'

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/pahadlink',
    Icon: InstagramIcon,
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/pahadlink',
    Icon: FacebookIcon,
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@pahadlink',
    Icon: YoutubeIcon,
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/919690421423',
    Icon: WhatsAppIcon,
  },
]

const Footer = () => {
  const year = new Date().getFullYear()
  const topCategories = categoryGroups.slice(0, 5)

  return (
    <footer className="site-footer">
      <div className="container footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to={ROUTES.HOME} className="footer-logo" aria-label="PahadLink home">
              <img src={logoLight} alt="PahadLink" className="footer-logo__img" />
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
              <li><Link to={`${ROUTES.HOME}#faq`}>FAQs</Link></li>
              <li><Link to={ROUTES.REFUNDS}>Shipping & returns</Link></li>
              <li><Link to={ROUTES.ORDERS}>Track order</Link></li>
              <li><Link to={ROUTES.WISHLIST}>Wishlist</Link></li>
              <li><Link to={ROUTES.ACCOUNT}>My account</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><Link to={`${ROUTES.HOME}#why`}>Why we&apos;re unique</Link></li>
              <li><Link to={`${ROUTES.HOME}#reviews`}>Customer reviews</Link></li>
              <li><Link to={ROUTES.CONTACT}>Partner with us</Link></li>
              <li><Link to={ROUTES.TERMS}>Terms of use</Link></li>
              <li><Link to={ROUTES.PRIVACY}>Privacy policy</Link></li>
              <li><Link to={ROUTES.REGISTER}>Create account</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            <span className="footer-copy__year">© {year}</span>
            <Link to={ROUTES.HOME} className="footer-copy__brand">
              PahadLink
            </Link>
            <span className="footer-copy__sep" aria-hidden="true">
              ·
            </span>
            <span>Made with care in</span>
            <Link to={ROUTES.CONTACT} className="footer-copy__place">
              Uttarakhand
            </Link>
          </p>
          <div className="footer-bottom__right">
            <nav className="footer-legal" aria-label="Legal">
              <Link to={ROUTES.TERMS}>Terms</Link>
              <Link to={ROUTES.PRIVACY}>Privacy</Link>
              <Link to={ROUTES.REFUNDS}>Refunds</Link>
              <Link to={ROUTES.CONTACT}>Contact</Link>
              <Link to={`${ROUTES.HOME}#faq`}>FAQs</Link>
            </nav>
            <div className="footer-social" aria-label="Social media">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  className="footer-social__link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
