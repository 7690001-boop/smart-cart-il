import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { users } from "@/lib/data";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(3)
});

export async function POST(request: Request) {
  const body = bodySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = users.find((u) => u.email === body.data.email && u.password === body.data.password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const jar = await cookies();
  jar.set("smart_cart_user_id", user.id, { httpOnly: true, sameSite: "lax", path: "/" });
  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
