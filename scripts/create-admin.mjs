/**
 * One-time script: create a SUPER_ADMIN user in the database.
 * Usage: node scripts/create-admin.mjs
 *
 * Reads DATABASE_URL / DIRECT_URL from the root .env file.
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const { PrismaClient } = await import("../packages/database/generated/client/index.js");
const prisma = new PrismaClient();

const EMAIL = process.env.ADMIN_EMAIL ?? "admin@getyourboat.com";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin1234!";
const FULL_NAME = process.env.ADMIN_NAME ?? "Super Admin";

const existing = await prisma.adminUser.findUnique({ where: { email: EMAIL } });
if (existing) {
  console.log(`Admin user already exists: ${EMAIL}`);
  process.exit(0);
}

const passwordHash = await bcrypt.hash(PASSWORD, 12);
const admin = await prisma.adminUser.create({
  data: {
    email: EMAIL,
    passwordHash,
    fullName: FULL_NAME,
    role: "SUPER_ADMIN",
  },
});

console.log(`Created admin user:`);
console.log(`  ID:    ${admin.id}`);
console.log(`  Email: ${admin.email}`);
console.log(`  Role:  ${admin.role}`);
console.log(`  Password: ${PASSWORD}`);

await prisma.$disconnect();
