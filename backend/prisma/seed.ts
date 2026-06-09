import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Jaipur', 'Ahmedabad', 'Lucknow'];
const genders = ['Male', 'Female', 'Other'];
const categories = ['Electronics', 'Fashion', 'Beauty', 'Home & Kitchen', 'Sports', 'Books', 'Food & Beverages', 'Health', 'Toys', 'Automotive'];
const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya', 'Aadhya', 'Ira', 'Anika', 'Priya', 'Riya', 'Neha', 'Pooja', 'Shreya', 'Tanvi', 'Meera', 'Kabir', 'Rohan', 'Arnav', 'Dhruv', 'Yash'];
const lastNames = ['Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Reddy', 'Iyer', 'Nair', 'Das', 'Joshi', 'Mehta', 'Shah', 'Rao', 'Malhotra', 'Chopra', 'Kapoor', 'Bhat', 'Mukherjee', 'Agarwal'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.communicationEvent.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.campaignInsight.deleteMany();
  await prisma.campaignAnalytics.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.audience.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  console.log('Cleared existing data');

  // Create 500 customers
  const customerCount = 500;
  const customers = [];

  for (let i = 0; i < customerCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const daysAgo = Math.floor(Math.random() * 365);
    const totalSpent = Math.round((Math.random() * 50000 + 200) * 100) / 100;

    // Create different customer segments:
    // 20% high-value (spent > 25000)
    // 30% dormant (no purchase in 60+ days)
    // 15% new (created in last 30 days)
    // 35% regular
    
    let adjustedSpent = totalSpent;
    let adjustedDays = daysAgo;

    if (i < customerCount * 0.2) {
      // High-value customers
      adjustedSpent = Math.round((Math.random() * 40000 + 25000) * 100) / 100;
      adjustedDays = Math.floor(Math.random() * 90);
    } else if (i < customerCount * 0.5) {
      // Dormant customers
      adjustedDays = Math.floor(Math.random() * 200) + 60;
    } else if (i < customerCount * 0.65) {
      // New customers
      adjustedDays = Math.floor(Math.random() * 30);
      adjustedSpent = Math.round((Math.random() * 5000 + 500) * 100) / 100;
    }

    customers.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      phone: `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`,
      city: randomElement(cities),
      age: Math.floor(Math.random() * 45) + 18,
      gender: randomElement(genders),
      totalSpent: adjustedSpent,
      lastPurchaseDate: new Date(Date.now() - adjustedDays * 24 * 60 * 60 * 1000),
    });
  }

  await prisma.customer.createMany({ data: customers });
  console.log(`✅ Created ${customerCount} customers`);

  // Create orders (3-8 per customer)
  const allCustomers = await prisma.customer.findMany({ select: { id: true, createdAt: true } });
  const orders = [];

  for (const customer of allCustomers) {
    const orderCount = Math.floor(Math.random() * 6) + 3;
    for (let j = 0; j < orderCount; j++) {
      orders.push({
        customerId: customer.id,
        amount: Math.round((Math.random() * 8000 + 300) * 100) / 100,
        category: randomElement(categories),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000),
      });
    }
  }

  // Batch insert orders in chunks of 500
  for (let i = 0; i < orders.length; i += 500) {
    const chunk = orders.slice(i, i + 500);
    await prisma.order.createMany({ data: chunk });
  }
  console.log(`✅ Created ${orders.length} orders`);

  // Update totalSpent based on actual orders
  for (const customer of allCustomers) {
    const orderTotal = await prisma.order.aggregate({
      where: { customerId: customer.id },
      _sum: { amount: true },
    });
    const lastOrder = await prisma.order.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });
    
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalSpent: orderTotal._sum.amount || 0,
        lastPurchaseDate: lastOrder?.createdAt || null,
      },
    });
  }
  console.log('✅ Updated customer spend totals');

  console.log('\n🎉 Seed complete!');
  console.log(`   ${customerCount} customers`);
  console.log(`   ${orders.length} orders`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
