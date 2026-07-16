import defaultProductImage from '../assets/images/default-product.png'
import bannerHoney from '../assets/images/banners/banner-honey.png'
import bannerRajma from '../assets/images/banners/banner-rajma.png'
import bannerTea from '../assets/images/banners/banner-tea.png'
import categoryBannerOrganic from '../assets/images/banners/category-organic-food.png'
import categoryBannerHoney from '../assets/images/banners/category-honey-natural.png'
import categoryBannerSpiritual from '../assets/images/banners/category-spiritual.png'
import categoryBannerClothing from '../assets/images/banners/category-clothing.png'
import categoryBannerHandicrafts from '../assets/images/banners/category-handicrafts.png'
import categoryBannerSweets from '../assets/images/banners/category-snacks-sweets.png'
import categoryBannerGifts from '../assets/images/banners/category-gift-hampers.png'
import packPahadiRajma from '../assets/images/products/pack-pahadi-rajma.png'
import packRawHoney from '../assets/images/products/pack-raw-honey.png'
import packManduaFlour from '../assets/images/products/pack-mandua-flour.png'
import packGahatDal from '../assets/images/products/pack-gahat-dal.png'
import packRedRice from '../assets/images/products/pack-red-rice.png'
import packBalMithai from '../assets/images/products/pack-bal-mithai.png'
import packHerbalTea from '../assets/images/products/pack-herbal-tea.png'
import packBuranshSquash from '../assets/images/products/pack-buransh-squash.png'
import packPahadiTopi from '../assets/images/products/pack-pahadi-topi.png'
import packRingaalBasket from '../assets/images/products/pack-ringaal-basket.png'
import packJhangora from '../assets/images/products/pack-jhangora.png'
import packSingori from '../assets/images/products/pack-singori.png'
import packGangajal from '../assets/images/products/pack-gangajal.png'
import packRudrakshaMala from '../assets/images/products/pack-rudraksha-mala.png'
import packFestivalHamper from '../assets/images/products/pack-festival-hamper.png'
import packOrganicGiftBox from '../assets/images/products/pack-organic-gift-box.png'

export const DEFAULT_PRODUCT_IMAGE = defaultProductImage

/** Product promo banners used on home hero */
export const productBanners = [
  {
    id: 'raw-honey',
    alt: 'Raw forest honey from the Himalayas',
    image: bannerHoney,
  },
  {
    id: 'pahadi-rajma',
    alt: 'Pahadi rajma - kidney beans from the hills',
    image: bannerRajma,
  },
  {
    id: 'herbal-tea',
    alt: 'Himalayan herbal tea mountain blend',
    image: bannerTea,
  },
]

export const categoryGroups = [
  {
    id: 'organic-food',
    name: 'Organic Food',
    headline: 'Hill staples for everyday cooking',
    blurb: 'Rajma, dals, millets, and rice from Himalayan farms — clean, honest, and packed for your kitchen.',
    banner: categoryBannerOrganic,
    items: [
      { name: 'Mandua', icon: 'grain' },
      { name: 'Jhangora', icon: 'grain' },
      { name: 'Pahadi Rajma', icon: 'dal' },
      { name: 'Gahat Dal', icon: 'dal' },
      { name: 'Bhatt Dal', icon: 'dal' },
      { name: 'Red Rice', icon: 'rice' },
    ],
  },
  {
    id: 'honey-natural',
    name: 'Honey & Naturals',
    headline: 'From forest to your table',
    blurb: 'Raw honey, herbal teas, and natural pantry picks gathered with care from the hills.',
    banner: categoryBannerHoney,
    items: [
      { name: 'Raw Honey', icon: 'honey' },
      { name: 'Herbal Tea', icon: 'tea' },
      { name: 'Jams', icon: 'jar' },
      { name: 'Pickles', icon: 'jar' },
      { name: 'Spices', icon: 'spice' },
    ],
  },
  {
    id: 'spiritual',
    name: 'Spiritual',
    headline: 'Sacred picks from the Himalaya',
    blurb: 'Gangajal, rudraksha, and puja essentials for home rituals and meaningful gifting.',
    banner: categoryBannerSpiritual,
    items: [
      { name: 'Gangajal', icon: 'water' },
      { name: 'Rudraksha', icon: 'bead' },
      { name: 'Puja Kits', icon: 'puja' },
      { name: 'Incense', icon: 'incense' },
    ],
  },
  {
    id: 'clothing',
    name: 'Clothing',
    headline: 'Wear the craft of the hills',
    blurb: 'Pahadi topi, handwoven fabrics, and warm pieces made with traditional skill.',
    banner: categoryBannerClothing,
    items: [
      { name: 'Pahadi Topi', icon: 'hat' },
      { name: 'Woolen Shawls', icon: 'shawl' },
      { name: 'Traditional Wear', icon: 'dress' },
      { name: 'Handwoven Fabric', icon: 'fabric' },
    ],
  },
  {
    id: 'handicrafts',
    name: 'Handicrafts',
    headline: 'Handmade by hill artisans',
    blurb: 'Bamboo, wood, and copper craft that brings pahadi making into your home.',
    banner: categoryBannerHandicrafts,
    items: [
      { name: 'Wooden Crafts', icon: 'wood' },
      { name: 'Ringaal Bamboo', icon: 'bamboo' },
      { name: 'Copper Ware', icon: 'copper' },
      { name: 'Handmade Gifts', icon: 'handmade' },
    ],
  },
  {
    id: 'snacks-sweets',
    name: 'Sweets',
    headline: 'Taste of home, made traditional',
    blurb: 'Bal mithai, singori, and classic hill sweets prepared the way you remember.',
    banner: categoryBannerSweets,
    items: [
      { name: 'Bal Mithai', icon: 'sweet' },
      { name: 'Singori', icon: 'sweet' },
      { name: 'Rus', icon: 'snack' },
      { name: 'Pahadi Snacks', icon: 'snack' },
    ],
  },
  {
    id: 'gift-hampers',
    name: 'Gifts',
    headline: 'Share pahadi taste with love',
    blurb: 'Festival hampers and organic gift boxes ready to send warmth from the hills.',
    banner: categoryBannerGifts,
    items: [
      { name: 'Festival Hampers', icon: 'gift' },
      { name: 'Prasad Boxes', icon: 'prasad' },
      { name: 'Organic Gift Boxes', icon: 'gift' },
    ],
  },
]

export const features = [
  {
    title: 'Direct from the Hills',
    icon: 'mountain',
    desc: 'We work with pahadi farmers and artisans — not middlemen — so you get real mountain products at fair prices.',
    points: ['Village-sourced goods', 'Fair pay for makers', 'Authentic hill recipes'],
  },
  {
    title: 'Pure, Not Processed',
    icon: 'leaf',
    desc: 'No bulk blending, no artificial fillers. What you order is what grows and is made in the mountains.',
    points: ['No preservatives', 'Farm-fresh batches', 'Clean ingredient labels'],
  },
  {
    title: 'Trusted Every Order',
    icon: 'shield',
    desc: 'Checked, packed with care, and delivered safely — so quality stays the same from first order to repeat.',
    points: ['Quality checks', 'Secure packaging', 'Reliable delivery'],
  },
]

export const testimonials = [
  {
    name: 'Mukesh Rawat',
    location: 'Dehradun',
    rating: 5,
    product: 'Raw Forest Honey',
    text: 'Fresh, authentic pahadi products every time. Packaging is neat and delivery reached us faster than expected.',
  },
  {
    name: 'Tejas Rawat',
    location: 'Nainital',
    rating: 5,
    product: 'Pahadi Rajma',
    text: 'Real Himalayan taste - honey, rajma, and snacks feel homemade and pure. Already reordered twice.',
  },
  {
    name: 'Babita Rawat',
    location: 'Delhi',
    rating: 5,
    product: 'Bal Mithai',
    text: 'Bal mithai tasted just like home. Gift packing was lovely and my family asked where I ordered from.',
  },
]

/** Home product catalogues */
export const products = [
  {
    id: 'pahadi-rajma',
    name: 'Pahadi Rajma | Kidney Beans from the Hills',
    image: packPahadiRajma,
    price: 249,
    compareAt: 399,
    sizes: ['500g', '1 kg', '2 kg'],
    rating: 4.8,
    tags: ['bestseller', 'trending'],
    categoryId: 'organic-food',
    subcategory: 'Pahadi Rajma',
  },
  {
    id: 'raw-honey',
    name: 'Raw Forest Honey | Unprocessed Himalayan Honey',
    image: packRawHoney,
    price: 349,
    compareAt: 499,
    sizes: ['250g', '500g', '1 kg'],
    rating: 4.9,
    tags: ['bestseller', 'handpicked'],
    categoryId: 'honey-natural',
    subcategory: 'Raw Honey',
  },
  {
    id: 'mandua-flour',
    name: 'Mandua Atta | Finger Millet Flour',
    image: packManduaFlour,
    price: 189,
    compareAt: 279,
    sizes: ['500g', '1 kg', '2 kg'],
    rating: 4.7,
    tags: ['bestseller', 'trending'],
    categoryId: 'organic-food',
    subcategory: 'Mandua',
  },
  {
    id: 'gahat-dal',
    name: 'Gahat Dal | Horse Gram from Uttarakhand',
    image: packGahatDal,
    price: 199,
    compareAt: 299,
    sizes: ['500g', '1 kg'],
    rating: 4.6,
    tags: ['bestseller'],
    categoryId: 'organic-food',
    subcategory: 'Gahat Dal',
  },
  {
    id: 'red-rice',
    name: 'Pahadi Red Rice | Naturally Aged',
    image: packRedRice,
    price: 299,
    compareAt: 449,
    sizes: ['1 kg', '2 kg', '5 kg'],
    rating: 4.8,
    tags: ['trending', 'handpicked'],
    categoryId: 'organic-food',
    subcategory: 'Red Rice',
  },
  {
    id: 'bal-mithai',
    name: 'Bal Mithai | Classic Almora Sweet',
    image: packBalMithai,
    price: 399,
    compareAt: 549,
    sizes: ['250g', '500g'],
    rating: 4.9,
    tags: ['bestseller', 'trending'],
    categoryId: 'snacks-sweets',
    subcategory: 'Bal Mithai',
  },
  {
    id: 'herbal-tea',
    name: 'Himalayan Herbal Tea | Mountain Blend',
    image: packHerbalTea,
    price: 229,
    compareAt: 349,
    sizes: ['100g', '250g'],
    rating: 4.7,
    tags: ['trending', 'handpicked'],
    categoryId: 'honey-natural',
    subcategory: 'Herbal Tea',
  },
  {
    id: 'buransh-squash',
    name: 'Buransh Squash | Rhododendron Drink Mix',
    image: packBuranshSquash,
    price: 279,
    compareAt: 399,
    sizes: ['500ml', '1 L'],
    rating: 4.8,
    tags: ['trending', 'handpicked'],
    categoryId: 'honey-natural',
    subcategory: 'Jams',
  },
  {
    id: 'pahadi-topi',
    name: 'Pahadi Topi | Traditional Wool Cap',
    image: packPahadiTopi,
    price: 449,
    compareAt: 699,
    sizes: ['Free size'],
    rating: 4.5,
    tags: ['handpicked'],
    categoryId: 'clothing',
    subcategory: 'Pahadi Topi',
  },
  {
    id: 'ringaal-basket',
    name: 'Ringaal Bamboo Basket | Handcrafted',
    image: packRingaalBasket,
    price: 599,
    compareAt: 899,
    sizes: ['Medium', 'Large'],
    rating: 4.6,
    tags: ['handpicked'],
    categoryId: 'handicrafts',
    subcategory: 'Ringaal Bamboo',
  },
  {
    id: 'jhangora',
    name: 'Jhangora | Barnyard Millet',
    image: packJhangora,
    price: 169,
    compareAt: 249,
    sizes: ['500g', '1 kg'],
    rating: 4.7,
    tags: ['bestseller', 'trending'],
    categoryId: 'organic-food',
    subcategory: 'Jhangora',
  },
  {
    id: 'singori',
    name: 'Singori | Leaf-Wrapped Kumaoni Sweet',
    image: packSingori,
    price: 349,
    compareAt: 499,
    sizes: ['6 pcs', '12 pcs'],
    rating: 4.9,
    tags: ['trending', 'handpicked'],
    categoryId: 'snacks-sweets',
    subcategory: 'Singori',
  },
  {
    id: 'gangajal',
    name: 'Gangajal | Sacred Water from the Himalayas',
    image: packGangajal,
    price: 149,
    compareAt: 219,
    sizes: ['250ml', '500ml', '1 L'],
    rating: 4.8,
    tags: ['bestseller', 'handpicked'],
    categoryId: 'spiritual',
    subcategory: 'Gangajal',
  },
  {
    id: 'rudraksha-mala',
    name: 'Rudraksha Mala | 5 Mukhi Authentic Beads',
    image: packRudrakshaMala,
    price: 699,
    compareAt: 999,
    sizes: ['108 beads'],
    rating: 4.7,
    tags: ['handpicked'],
    categoryId: 'spiritual',
    subcategory: 'Rudraksha',
  },
  {
    id: 'festival-hamper',
    name: 'Festival Hamper | Honey, Sweets & Grains',
    image: packFestivalHamper,
    price: 1299,
    compareAt: 1799,
    sizes: ['Standard', 'Premium'],
    rating: 4.9,
    tags: ['bestseller', 'handpicked'],
    categoryId: 'gift-hampers',
    subcategory: 'Festival Hampers',
  },
  {
    id: 'organic-gift-box',
    name: 'Organic Gift Box | Clean Pahadi Essentials',
    image: packOrganicGiftBox,
    price: 899,
    compareAt: 1249,
    sizes: ['Box of 4', 'Box of 6'],
    rating: 4.8,
    tags: ['trending', 'handpicked'],
    categoryId: 'gift-hampers',
    subcategory: 'Organic Gift Boxes',
  },
]

export const getProductsByTag = (tag) =>
  products.filter((p) => p.tags.includes(tag))

/** Convert size label into a comparable weight/quantity unit */
const toBaseUnits = (amount, unit) => {
  if (unit === 'kg' || unit === 'l') return amount * 1000
  return amount
}

const sizeWeight = (size) => {
  const raw = String(size).toLowerCase().replace(/\s+/g, '')

  const multi = raw.match(/^(\d+)x(\d+(?:\.\d+)?)(g|kg|ml|l)$/)
  if (multi) {
    return Number(multi[1]) * toBaseUnits(Number(multi[2]), multi[3])
  }

  const measured = raw.match(/^(\d+(?:\.\d+)?)(g|kg|ml|l)$/)
  if (measured) {
    return toBaseUnits(Number(measured[1]), measured[2])
  }

  const pcs = raw.match(/^(\d+)pcs?$/)
  if (pcs) return Number(pcs[1])

  const named = {
    freesize: 1,
    medium: 1,
    large: 1.35,
    standard: 1,
    premium: 1.4,
    boxof4: 4,
    boxof6: 6,
    '108beads': 1,
  }

  return named[raw] || 1
}

const nicePrice = (value) => {
  const n = Math.max(1, Math.round(value))
  if (n < 20) return n
  return Math.round(n / 10) * 10 - 1
}

/**
 * Size options with price for a product.
 * Base `price` / `compareAt` apply to the first size; larger sizes scale up with a small bulk discount.
 * Optional product.variants overrides auto pricing.
 */
export const getProductVariants = (product) => {
  if (!product) return []

  if (product.variants?.length) {
    return product.variants.map((v) => ({
      size: v.size,
      price: v.price,
      compareAt: v.compareAt ?? v.price,
    }))
  }

  const sizes = product.sizes?.length ? product.sizes : ['Default']
  const weights = sizes.map(sizeWeight)
  const baseWeight = weights[0] || 1

  return sizes.map((size, index) => {
    const ratio = weights[index] / baseWeight
    const bulk =
      ratio > 1 ? 1 - Math.min(0.12, (Math.sqrt(ratio) - 1) * 0.08) : 1
    return {
      size,
      price: index === 0 ? product.price : nicePrice(product.price * ratio * bulk),
      compareAt:
        index === 0
          ? product.compareAt
          : nicePrice(product.compareAt * ratio * bulk),
    }
  })
}

export const getVariantBySize = (product, size) => {
  const variants = getProductVariants(product)
  if (!variants.length) {
    return {
      size: size || 'Default',
      price: product?.price || 0,
      compareAt: product?.compareAt || 0,
    }
  }
  return variants.find((v) => v.size === size) || variants[0]
}

export const getProductMinPrice = (product) => {
  const variants = getProductVariants(product)
  return variants.reduce(
    (min, v) => Math.min(min, v.price),
    variants[0]?.price ?? product.price
  )
}

export const getProductMaxPrice = (product) => {
  const variants = getProductVariants(product)
  return variants.reduce(
    (max, v) => Math.max(max, v.price),
    variants[0]?.price ?? product.price
  )
}

export const productMatchesPrice = (product, min, max, sizeFilter = []) => {
  const variants = getProductVariants(product)
  const pool = sizeFilter.length
    ? variants.filter((v) => sizeFilter.includes(v.size))
    : variants

  if (!pool.length) return false

  return pool.some((v) => {
    if (min != null && !Number.isNaN(min) && v.price < min) return false
    if (max != null && !Number.isNaN(max) && v.price > max) return false
    return true
  })
}

export const getCategoryById = (id) =>
  categoryGroups.find((group) => group.id === id) || null

export const getProductsByCategory = (categoryId, { subcategory } = {}) => {
  if (!categoryId) return []

  return products.filter((product) => {
    if (product.categoryId !== categoryId) return false
    if (!subcategory) return true
    const needle = String(subcategory).trim().toLowerCase()
    return String(product.subcategory || '')
      .trim()
      .toLowerCase()
      .includes(needle)
  })
}

export const getCategoryProductCount = (categoryId) =>
  getProductsByCategory(categoryId).length

/** Single promo banner for a category landing hero */
export const getCategoryBanner = (categoryId) => {
  const category = getCategoryById(categoryId)
  if (!category) return null

  const firstProduct = getProductsByCategory(categoryId)[0]
  const image =
    category.banner ||
    firstProduct?.image ||
    bannerRajma ||
    bannerHoney ||
    bannerTea

  return {
    id: category.id,
    image,
    alt: `${category.name} from the Himalayas`,
    headline: category.headline || category.name,
    blurb: category.blurb,
  }
}

/** Related categories with image + product count for discovery cards */
export const getRelatedCategories = (categoryId, limit = 4) =>
  categoryGroups
    .filter((group) => group.id !== categoryId)
    .slice(0, limit)
    .map((group) => {
      const count = getCategoryProductCount(group.id)
      const cover =
        group.banner || getProductsByCategory(group.id)[0]?.image || null
      return {
        ...group,
        count,
        cover,
      }
    })

export const getProductById = (id) => {
  const product = products.find((p) => p.id === id)
  if (!product) return null

  const category = categoryGroups.find((g) => g.id === product.categoryId)
  const variants = getProductVariants(product)

  return {
    ...product,
    variants,
    categoryName: category?.name || 'Shop',
    images: product.images || [product.image, product.image, product.image],
    description:
      product.description ||
      `${product.name.split('|')[0].trim()} is sourced from Himalayan growers and packed with care for everyday pahadi kitchens. Fresh taste, honest ingredients, and no unnecessary processing.`,
    highlights: product.highlights || [
      'Sourced from Uttarakhand / Himachal makers',
      'Clean packing for pan-India delivery',
      'No artificial preservatives',
      'Best enjoyed fresh after opening',
    ],
    details: product.details || [
      { label: 'Category', value: category?.name || '-' },
      { label: 'Type', value: product.subcategory || '-' },
      { label: 'Origin', value: 'Himalayan hills, India' },
    ],
  }
}

export const getRelatedProducts = (product, limit = 10) => {
  if (!product) return []
  const sameCategory = products.filter(
    (p) => p.id !== product.id && p.categoryId === product.categoryId
  )
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit)

  const sameTag = products.filter(
    (p) =>
      p.id !== product.id &&
      !sameCategory.some((s) => s.id === p.id) &&
      p.tags.some((t) => product.tags.includes(t))
  )

  const rest = products.filter(
    (p) =>
      p.id !== product.id &&
      !sameCategory.some((s) => s.id === p.id) &&
      !sameTag.some((s) => s.id === p.id)
  )

  return [...sameCategory, ...sameTag, ...rest].slice(0, limit)
}

export const getAllSizes = () => {
  const set = new Set()
  products.forEach((p) => p.sizes.forEach((s) => set.add(s)))
  return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

export const getPriceBounds = () => {
  if (!products.length) return { min: 0, max: 0 }
  let min = Infinity
  let max = 0
  products.forEach((p) => {
    getProductVariants(p).forEach((v) => {
      if (v.price < min) min = v.price
      if (v.price > max) max = v.price
    })
  })
  return { min: min === Infinity ? 0 : min, max }
}

export const productTabs = [
  { id: 'bestseller', label: 'Best Sellers' },
  { id: 'trending', label: 'Trending' },
  { id: 'handpicked', label: 'Handpicked' },
]
