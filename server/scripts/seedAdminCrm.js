import 'dotenv/config'
import { connectDB, disconnectDB } from '../config/db.js'
import User from '../models/User.js'
import Order, { buildOrderNumber } from '../models/Order.js'
import CrmLead from '../models/CrmLead.js'

async function seed() {
  await connectDB()

  const admin = await User.findOne({ role: 'admin' })
  if (!admin) {
    console.error('No admin user found. Run npm run seed:admin first.')
    process.exit(1)
  }

  const orderCount = await Order.countDocuments()
  if (orderCount === 0) {
    await Order.create({
      orderNumber: await buildOrderNumber(),
      user: admin._id,
      customerName: 'Priya Sharma',
      customerEmail: 'priya@example.com',
      customerPhone: '9876543210',
      items: [
        { name: 'Raw Honey 500g', quantity: 2, price: 399 },
        { name: 'Pahadi Rajma 1kg', quantity: 1, price: 249 },
      ],
      totalAmount: 1047,
      status: 'confirmed',
      paymentStatus: 'paid',
      shippingAddress: {
        line1: 'Mall Road',
        city: 'Dehradun',
        state: 'Uttarakhand',
        pincode: '248001',
      },
      notes: 'Sample order',
    })
    await Order.create({
      orderNumber: await buildOrderNumber(),
      customerName: 'Rahul Negi',
      customerEmail: 'rahul@example.com',
      customerPhone: '9123456780',
      items: [{ name: 'Woolen Shawl', quantity: 1, price: 1299 }],
      totalAmount: 1299,
      status: 'pending',
      paymentStatus: 'pending',
      shippingAddress: {
        line1: 'Tallital',
        city: 'Nainital',
        state: 'Uttarakhand',
        pincode: '263001',
      },
    })
    console.log('Sample orders created')
  } else {
    console.log(`Orders already exist (${orderCount})`)
  }

  const leadCount = await CrmLead.countDocuments()
  if (leadCount === 0) {
    await CrmLead.create([
      {
        name: 'Ananya Joshi',
        email: 'ananya@example.com',
        phone: '9988776655',
        source: 'website',
        status: 'new',
        interest: 'Gift hampers',
        notes: 'Asked about festival packs',
        assignedTo: admin._id,
      },
      {
        name: 'Vikram Rawat',
        email: 'vikram@example.com',
        phone: '8877665544',
        source: 'whatsapp',
        status: 'interested',
        interest: 'Organic food wholesale',
        notes: 'Wants bulk rajma & honey',
        assignedTo: admin._id,
        lastContactAt: new Date(),
      },
    ])
    console.log('Sample CRM leads created')
  } else {
    console.log(`CRM leads already exist (${leadCount})`)
  }

  console.log({
    database: 'Pahadi_link_DB',
    collections: ['orders', 'crmleads', 'users'],
  })

  await disconnectDB()
}

seed().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
