export const LEGAL_NAV = [
  { id: 'privacy', path: '/privacy', label: 'Privacy policy' },
  { id: 'terms', path: '/terms', label: 'Terms & conditions' },
  { id: 'refunds', path: '/refunds', label: 'Refunds & returns' },
]

export const policies = {
  privacy: {
    id: 'privacy',
    title: 'Privacy policy',
    updated: '14 July 2026',
    intro:
      'This policy explains how PahadLink collects, uses, and protects your information when you shop with us.',
    sections: [
      {
        heading: 'Information we collect',
        body: [
          'Account details such as name, email, phone, and delivery address when you register or place an order.',
          'Order and payment-related information needed to process purchases (payment data is handled by secure payment partners).',
          'Messages you send through our contact form, WhatsApp, call, or email.',
          'Basic device and usage data such as browser type and pages visited to improve website performance.',
        ],
      },
      {
        heading: 'How we use your information',
        body: [
          'To process orders, arrange delivery, and provide order updates.',
          'To respond to support requests about products, shipping, or returns.',
          'To improve our website, product range, and customer experience.',
          'To send important service messages. Marketing messages are sent only with your consent where required.',
        ],
      },
      {
        heading: 'Sharing of information',
        body: [
          'We share details only with trusted partners needed to run the store - for example logistics partners and payment providers.',
          'We do not sell your personal information.',
          'We may disclose information if required by law or to protect our customers and business from fraud or abuse.',
        ],
      },
      {
        heading: 'Data security & retention',
        body: [
          'We use reasonable technical and organisational measures to protect your data.',
          'Order and account records are kept only as long as needed for legal, accounting, and support purposes.',
          'You can ask us to update or delete account information, subject to legal retention needs.',
        ],
      },
      {
        heading: 'Your choices',
        body: [
          'You may access or update account details after logging in.',
          'You may contact us to request correction or deletion of personal data.',
          'You may opt out of non-essential marketing communications at any time.',
        ],
      },
      {
        heading: 'Contact for privacy requests',
        body: [
          'Email: care@pahadlink.com',
          'Phone / WhatsApp: +91 96904 21423',
          'Address: Almora Road, Haldwani, Uttarakhand 263139',
        ],
      },
    ],
  },

  terms: {
    id: 'terms',
    title: 'Terms & conditions',
    updated: '14 July 2026',
    intro:
      'These terms apply when you browse or buy from PahadLink. By using our website, you agree to the terms below.',
    sections: [
      {
        heading: 'About PahadLink',
        body: [
          'PahadLink is an online store for Himalayan and pahadi foods, crafts, and everyday essentials sourced from mountain makers.',
          'Product names, images, and descriptions are for customer guidance. Actual packaging may vary slightly by batch or artisan.',
        ],
      },
      {
        heading: 'Orders & pricing',
        body: [
          'An order is confirmed once payment is successful and you receive confirmation from us.',
          'Prices are shown in INR and may change without prior notice. The price at checkout is the price charged.',
          'We reserve the right to cancel an order in case of stock issues, pricing errors, or suspected fraud. If already paid, a refund will be initiated.',
        ],
      },
      {
        heading: 'Accounts',
        body: [
          'You are responsible for keeping your login details secure.',
          'Please provide accurate delivery and contact information so we can complete your order.',
          'We may suspend accounts used for misuse, abuse, or fraudulent activity.',
        ],
      },
      {
        heading: 'Delivery',
        body: [
          'Most orders are delivered in 2-5 days across India. Remote hill locations may take longer.',
          'Free shipping applies on eligible orders above ₹499. Shipping charges, if any, are shown before payment.',
          'Delivery timelines are estimates and may vary due to courier or weather conditions.',
        ],
      },
      {
        heading: 'Product quality',
        body: [
          'We work with local makers and quality checks, but natural products can vary in colour, texture, or aroma.',
          'If an item arrives damaged or incorrect, contact us within 7 days of delivery with your order details and photos.',
        ],
      },
      {
        heading: 'Acceptable use',
        body: [
          'Do not misuse the website, attempt unauthorised access, or use content from PahadLink without permission.',
          'All trademarks, product content, and brand assets remain the property of PahadLink or their respective owners.',
        ],
      },
      {
        heading: 'Governing law',
        body: [
          'These terms are governed by the laws of India.',
          'For any dispute, our support team will first try to resolve it fairly. Courts in Uttarakhand shall have jurisdiction where applicable.',
        ],
      },
    ],
  },

  refunds: {
    id: 'refunds',
    title: 'Refunds & returns',
    updated: '14 July 2026',
    intro:
      'We want every order to feel fresh and trustworthy. Use this page for clear return and refund rules.',
    sections: [
      {
        heading: 'When you can request a return',
        body: [
          'Damaged, spoiled, or defective product on arrival.',
          'Wrong item or wrong size/weight sent by mistake.',
          'Missing items from a multi-item order.',
          'Please raise the request within 7 days of delivery with order ID and clear photos/videos.',
        ],
      },
      {
        heading: 'What is not returnable',
        body: [
          'Opened food or personal-care items that are not defective.',
          'Products damaged due to improper storage after delivery.',
          'Change-of-mind returns for consumables once delivered in good condition.',
          'Free gifts or promotional items, unless the main product is eligible for return.',
        ],
      },
      {
        heading: 'How to raise a request',
        body: [
          'Contact us on WhatsApp or call +91 96904 21423, or email care@pahadlink.com.',
          'Share your order ID, product name, issue, and photos of the package and product.',
          'Our team will review and guide the next step (replacement, refund, or support resolution).',
        ],
      },
      {
        heading: 'Refund process',
        body: [
          'Approved refunds are usually started within 3-5 business days after confirmation.',
          'Money is credited to the original payment method. Bank timing may take 5-7 additional business days.',
          'For COD orders, refunds may be issued by UPI/bank transfer after verification.',
        ],
      },
      {
        heading: 'Replacements',
        body: [
          'Wherever stock allows, we prefer to replace damaged or incorrect items quickly.',
          'If replacement is unavailable, a full or partial refund will be provided.',
        ],
      },
      {
        heading: 'Shipping on returns',
        body: [
          'If the issue is our fault (wrong/damaged item), return pickup or shipping support is arranged by us.',
          'Approved prepaid return labels or pickup slots will be shared by support.',
        ],
      },
    ],
  },
}
