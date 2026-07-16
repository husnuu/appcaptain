import { PrismaClient } from "../generated/client/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@getyourboat.com";

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    console.log("No admin user found with that email.");
    return;
  }

  console.log("Admin user found:");
  console.log("  id:", admin.id);
  console.log("  email:", admin.email);
  console.log("  fullName:", admin.fullName);
  console.log("  role:", admin.role);
  console.log("  isActive:", admin.isActive);

  const passwordMatch = await bcrypt.compare("Admin1234!", admin.passwordHash);
  console.log("  password 'Admin1234!' matches:", passwordMatch);

  // Check rate limit lock
  const rlKey = `rl_admin_${email.toLowerCase()}`;
  const rl = await prisma.systemSetting.findUnique({ where: { key: rlKey } });
  if (rl) {
    const data = JSON.parse(rl.value) as { count: number; resetAt: string };
    const locked = new Date(data.resetAt) > new Date() && data.count >= 5;
    console.log("  rate limit entry:", data, "| locked:", locked);
  } else {
    console.log("  no rate limit lock");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
