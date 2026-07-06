import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing records
  await prisma.supplierPayment.deleteMany({});
  await prisma.customerPayment.deleteMany({});
  await prisma.purchaseVoucherLine.deleteMany({});
  await prisma.purchaseVoucher.deleteMany({});
  await prisma.salesVoucherLine.deleteMany({});
  await prisma.salesVoucher.deleteMany({});
  await prisma.stockItem.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create default Admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@smarterp.com',
      passwordHash,
    },
  });
  console.log(`Created user: ${user.email}`);

  // 3. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Acme Corporates',
      mobile: '9876543210',
      address: '123 Business Park, Sector 5, Cityville',
      openingBalance: 1500.00,
    },
  });
  const customer2 = await prisma.customer.create({
    data: {
      name: 'Retail Geniuses',
      mobile: '8765432109',
      address: 'G-98 Commercial Complex, Mall Road',
      openingBalance: 0.00,
    },
  });
  console.log(`Created customers: ${customer1.name}, ${customer2.name}`);

  // 4. Create Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Global Tech Distributors',
      contact: '9988776655',
      address: 'A-45 Industrial Area, Phase II',
      openingBalance: 5000.00,
    },
  });
  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Prime Goods Wholesalers',
      contact: '8877665544',
      address: '77 Warehouse Street, Depot Zone',
      openingBalance: 0.00,
    },
  });
  console.log(`Created suppliers: ${supplier1.name}, ${supplier2.name}`);

  // 5. Create Stock Items
  const item1 = await prisma.stockItem.create({
    data: {
      name: 'Ergonomic Office Chair',
      sku: 'SKU-CHAIR-01',
      unit: 'PCS',
      purchaseRate: 2500.00,
      sellingRate: 4500.00,
      openingStock: 10,
      gstPercent: 18,
    },
  });
  const item2 = await prisma.stockItem.create({
    data: {
      name: 'Mechanical Keyboard (RGB)',
      sku: 'SKU-KB-MX',
      unit: 'PCS',
      purchaseRate: 1200.00,
      sellingRate: 2200.00,
      openingStock: 25,
      gstPercent: 18,
    },
  });
  const item3 = await prisma.stockItem.create({
    data: {
      name: 'A4 Printing Paper (Ream)',
      sku: 'SKU-PAPER-A4',
      unit: 'PACK',
      purchaseRate: 180.00,
      sellingRate: 250.00,
      openingStock: 100,
      gstPercent: 12,
    },
  });
  const item4 = await prisma.stockItem.create({
    data: {
      name: 'USB-C Charging Cable 1.5m',
      sku: 'SKU-CABLE-USBC',
      unit: 'PCS',
      purchaseRate: 150.00,
      sellingRate: 350.00,
      openingStock: 4, // low stock test
      gstPercent: 18,
    },
  });
  console.log(`Created stock items: ${item1.name}, ${item2.name}, ${item3.name}, ${item4.name}`);

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
