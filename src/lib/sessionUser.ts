import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/db";

export async function requireDbUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: session.user?.name ?? email
    },
    create: {
      email,
      name: session.user?.name ?? email
    }
  });
  return user;
}

export async function requireDefaultList(userId: string) {
  const existing = await prisma.shoppingList.findFirst({
    where: { userId }
  });
  if (existing) return existing;
  return prisma.shoppingList.create({
    data: {
      userId,
      name: "הרשימה שלי"
    }
  });
}
