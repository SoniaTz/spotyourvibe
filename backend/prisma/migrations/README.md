# Prisma Migrations

This directory contains all database migrations for the EventFlow backend.

## 🔄 How Migrations Work

Prisma tracks changes to your database schema and creates migration files that can be applied to update the database structure.

---

## 📝 Migration: Payment Removal (v2.0.0)

**Migration Name:** `remove_payment_fields`

**Changes:**
- Removed `price` column from `Event` table
- Removed `totalPrice` column from `Booking` table

**How to Apply:**

```bash
# Fresh database (recommended)
npx prisma migrate dev --name remove_payment_fields

# Or reset and apply all migrations
npx prisma migrate reset
```

---

## 🎯 Expected Migration SQL

When you run the migration, Prisma will generate SQL similar to:

```sql
-- DropColumn: Remove price from Event
ALTER TABLE "Event" DROP COLUMN "price";

-- DropColumn: Remove totalPrice from Booking  
ALTER TABLE "Booking" DROP COLUMN "totalPrice";
```

**⚠️ This is destructive!** The columns and their data will be permanently deleted.

---

## ✅ Verify Migration

After running the migration:

```bash
# 1. Check migration was applied
npx prisma migrate status

# 2. Inspect database
npx prisma studio

# 3. Verify columns are removed
# Open Prisma Studio and check Event and Booking tables
```

---

## 🔧 Troubleshooting

### Migration Failed?

```bash
# Mark migration as applied (use with caution!)
npx prisma migrate resolve --applied MIGRATION_NAME

# Or start fresh
npx prisma migrate reset
```

### Need to rollback?

SQLite doesn't support column addition after deletion easily. Best approach:

1. Restore from backup: `cp prisma/dev.db.backup prisma/dev.db`
2. Or recreate database from scratch

---

## 📚 More Info

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

---

**Current Schema Version:** 2.0.0  
**Last Migration:** remove_payment_fields
