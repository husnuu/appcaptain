import type { ProfileRole } from "@getyourboat/shared";
import { prisma } from "../../client.js";
import type { AuthProfile, ProfileRepository } from "../profile.repository.js";

export class PrismaProfileRepository implements ProfileRepository {
  async upsertFromAuth(id: string, email: string | null): Promise<AuthProfile> {
    const profile = await prisma.profile.upsert({
      where: { id },
      update: { email },
      create: { id, email },
    });
    return { id: profile.id, email: profile.email, role: profile.role as ProfileRole };
  }
}
