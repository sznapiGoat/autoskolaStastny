import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTimeSlots } from "@/lib/booking-utils";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");

  if (!dateStr) {
    return NextResponse.json({ error: "Datum je povinné" }, { status: 400 });
  }

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  const now = new Date();
  if (date < now) {
    return NextResponse.json({ slots: [] });
  }

  const instructor = await prisma.user.findFirst({
    where: { role: "INSTRUCTOR" },
  });

  if (!instructor) {
    return NextResponse.json({ slots: [] });
  }

  const blocked = await prisma.blockedDate.findFirst({
    where: {
      instructorId: instructor.id,
      date,
    },
  });

  if (blocked) {
    return NextResponse.json({ slots: [], blocked: true, reason: blocked.reason });
  }

  const dayOfWeek = date.getDay();

  const availability = await prisma.availability.findFirst({
    where: {
      instructorId: instructor.id,
      dayOfWeek,
    },
  });

  if (!availability) {
    return NextResponse.json({ slots: [] });
  }

  const allSlots = generateTimeSlots(availability.startTime, availability.endTime);

  const existingBookings = await prisma.booking.findMany({
    where: {
      instructorId: instructor.id,
      date,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: { startTime: true },
  });

  const bookedTimes = new Set(existingBookings.map((b: { startTime: string }) => b.startTime));

  const now2 = new Date();
  const isToday = date.toDateString() === now2.toDateString();

  const availableSlots = allSlots.map((slot) => {
    const isBooked = bookedTimes.has(slot);
    let isPast = false;

    if (isToday) {
      const [h, m] = slot.split(":").map(Number);
      const slotTime = new Date(date);
      slotTime.setHours(h, m, 0, 0);
      isPast = slotTime <= now2;
    }

    return {
      time: slot,
      available: !isBooked && !isPast,
    };
  });

  return NextResponse.json({ slots: availableSlots });
}
