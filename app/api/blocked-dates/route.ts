import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const instructor = await prisma.user.findFirst({
    where: { role: "INSTRUCTOR" },
  });

  if (!instructor) return NextResponse.json([]);

  const blocked = await prisma.blockedDate.findMany({
    where: { instructorId: instructor.id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(blocked);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const user = session.user as any;
  if (user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
  }

  const body = await req.json();
  const { date, reason } = body;

  const blockDate = new Date(date);
  blockDate.setHours(0, 0, 0, 0);

  const existing = await prisma.blockedDate.findFirst({
    where: { instructorId: user.id, date: blockDate },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Tento den je již zablokován" },
      { status: 400 }
    );
  }

  const blocked = await prisma.blockedDate.create({
    data: { instructorId: user.id, date: blockDate, reason },
  });

  return NextResponse.json(blocked, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const user = session.user as any;
  if (user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID je povinné" }, { status: 400 });
  }

  await prisma.blockedDate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
