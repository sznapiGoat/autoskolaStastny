import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = addDays(new Date(), 1);
  const tomorrowStart = startOfDay(tomorrow);
  const tomorrowEnd = endOfDay(tomorrow);

  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: tomorrowStart, lte: tomorrowEnd },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: {
      student: { select: { name: true, email: true } },
    },
  });

  let sent = 0;
  for (const booking of bookings) {
    try {
      await sendReminderEmail({
        studentName: booking.student.name,
        studentEmail: booking.student.email,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        pickupLocation: booking.pickupLocation ?? undefined,
      });
      sent++;
    } catch (err) {
      console.error(`Failed reminder for booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ sent, total: bookings.length });
}
