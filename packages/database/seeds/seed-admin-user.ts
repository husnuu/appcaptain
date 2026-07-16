import { PrismaClient } from "../generated/client/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@getyourboat.com";
  const password = "Admin1234!";
  const fullName = "Super Admin";

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log(`Created admin user: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
