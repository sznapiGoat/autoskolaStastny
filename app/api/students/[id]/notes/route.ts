import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const user = session.user as any;
  if (user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
  }

  const { notes } = await req.json();

  const updated = await prisma.user.update({
    where: { id },
    data: { notes },
  });

  return NextResponse.json({ success: true, notes: updated.notes });
}
