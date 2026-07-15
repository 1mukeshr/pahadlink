import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import FaqSection from '../../components/layout/FaqSection'
import Footer from '../../components/layout/Footer'
import { PhoneIcon, MailIcon } from '../../components/icons'
import { ROUTES } from '../../config'
import { LEGAL_NAV, policies } from './policyContent'

const LegalPage = ({ policyId }) => {
  const policy = policies[policyId]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [policyId])

  if (!policy) {
    return null
  }

  return (
    <>
      <main className="legal-page">
        <div className="breadcrumb-bar breadcrumb-bar--soft">
          <div className="container">
            <Breadcrumb
              items={[
                { label: 'Help', to: ROUTES.CONTACT },
                { label: policy.title },
              ]}
            />
          </div>
        </div>
        <section className="legal-shell" aria-label={policy.title}>
          <div className="legal-panel">
            <div className="legal-panel__top">
              <p className="legal-panel__kicker">Customer care policy</p>
              <h1>{policy.title}</h1>
              <p>{policy.intro}</p>
              <p className="legal-panel__meta">Updated {policy.updated}</p>
            </div>

            <nav className="legal-tabs" aria-label="Policies">
              {LEGAL_NAV.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `legal-tabs__tab${isActive ? ' is-active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="legal-toc" aria-label="On this page">
              {policy.sections.map((section, index) => (
                <a key={section.heading} href={`#legal-${index + 1}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {section.heading}
                </a>
              ))}
            </div>

            <article className="legal-content">
              {policy.sections.map((section, index) => (
                <section
                  key={section.heading}
                  id={`legal-${index + 1}`}
                  className="legal-section"
                >
                  <h2>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {section.heading}
                  </h2>
                  <ul>
                    {section.body.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </article>

            <div className="legal-help">
              <div>
                <strong>Still need help?</strong>
                <p>Our team replies within 1 business day.</p>
              </div>
              <div className="legal-help__links">
                <a href="mailto:care@pahadlink.com">
                  <MailIcon size={16} />
                  care@pahadlink.com
                </a>
                <a href="tel:+919690421423">
                  <PhoneIcon size={16} />
                  +91 96904 21423
                </a>
              </div>
            </div>
          </div>
        </section>

        <FaqSection
          page="legal"
          title="Policy questions"
          className="faq-section--soft"
        />
      </main>
      <Footer />
    </>
  )
}

export const PrivacyPage = () => <LegalPage policyId="privacy" />
export const TermsPage = () => <LegalPage policyId="terms" />
export const RefundsPage = () => <LegalPage policyId="refunds" />

export default LegalPage
