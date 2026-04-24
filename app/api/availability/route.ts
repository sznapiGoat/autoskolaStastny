import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const instructor = await prisma.user.findFirst({
    where: { role: "INSTRUCTOR" },
  });

  if (!instructor) {
    return NextResponse.json([]);
  }

  const availability = await prisma.availability.findMany({
    where: { instructorId: instructor.id },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json(availability);
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
  const { dayOfWeek, startTime, endTime } = body;

  const existing = await prisma.availability.findFirst({
    where: { instructorId: user.id, dayOfWeek },
  });

  if (existing) {
    const updated = await prisma.availability.update({
      where: { id: existing.id },
      data: { startTime, endTime },
    });
    return NextResponse.json(updated);
  }

  const created = await prisma.availability.create({
    data: {
      instructorId: user.id,
      dayOfWeek,
      startTime,
      endTime,
    },
  });

  return NextResponse.json(created, { status: 201 });
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
  const dayOfWeek = parseInt(searchParams.get("dayOfWeek") || "");

  await prisma.availability.deleteMany({
    where: { instructorId: user.id, dayOfWeek },
  });

  return NextResponse.json({ success: true });
}
