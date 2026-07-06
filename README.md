# SmartERP Billing, Inventory, and Accounting Portal (MVP)

SmartERP is a Tally-inspired, keyboard-first Billing, Inventory, and Accounting web portal. This MVP focuses on Customer, Supplier, and Stock ledgers, as well as Sales and Purchase voucher transactions.

---

## Folder Structure

- `/backend`: Node.js + Express + TypeScript + Prisma ORM + PostgreSQL API
- `/frontend`: Next.js (App Router) + React + Tailwind CSS + TanStack Table + React Hook Form + Zod

---

## Setup Instructions

### 1. Database Connection

To run migrations and seed the database, you will need to provide a PostgreSQL database connection string:

1. Open `backend/.env`
2. Update the `DATABASE_URL` line:
   ```env
   DATABASE_URL="postgresql://username:password@hostname:port/databasename?schema=public"
   ```

### 2. Backend Installation & Migration

In your terminal, navigate to the `backend` folder and run the installation, migration, and seeding scripts:

```bash
cd backend
npm install

# Push database schema structure
npx prisma db push

# Generate Prisma Client
npm run db:generate

# Seed the database with mock ledgers and items
npm run db:seed

# Start the backend server in development mode
npm run dev
```

The backend server will run on [http://localhost:5000](http://localhost:5000).

### 3. Frontend Installation & Running

In a separate terminal, navigate to the `frontend` folder and start the Next.js development server:

```bash
cd frontend
npm install
npm run dev
```

The frontend portal will be accessible at [http://localhost:3000](http://localhost:3000).

---

## Keyboard Shortcuts (ERP System)

- **`Ctrl + K`**: Open Fuzzy Global Search / Command Menu (type to jump to ledgers/vouchers, use arrow keys and enter to navigate)
- **`F8`**: Open New Sales Voucher form
- **`F9`**: Open New Purchase Voucher form
- **`Ctrl + C`**: Open New Customer form (disabled when typing inside input text fields to allow normal copy action)
- **`Alt + S`** (or **`Ctrl + S`**): Open New Supplier form
- **`Esc`**: Go back or close the current modal menu

---

## Default Seeding Accounts

After database seeding, you can use this account to log in:
- **Email**: `admin@smarterp.com`
- **Password**: `admin123`
