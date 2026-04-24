import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  sendBookingConfirmationToStudent,
  sendBookingNotificationToInstructor,
} from "@/lib/email";
import { getSlotEndTime } from "@/lib/booking-utils";

const bookingSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  pickupLocation: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");

  if (user.role === "INSTRUCTOR") {
    const where: any = {};
    if (dateStr) {
      const date = new Date(dateStr);
      where.date = date;
    }
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
    return NextResponse.json(bookings);
  }

  const bookings = await prisma.booking.findMany({
    where: { studentId: user.id },
    include: {
      instructor: { select: { name: true, email: true, phone: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const user = session.user as any;
  if (user.role !== "STUDENT") {
    return NextResponse.json({ error: "Pouze studenti mohou rezervovat" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = bookingSchema.parse(body);

    const instructor = await prisma.user.findFirst({
      where: { role: "INSTRUCTOR" },
    });

    if (!instructor) {
      return NextResponse.json({ error: "Instruktor nenalezen" }, { status: 404 });
    }

    const bookingDate = new Date(data.date);
    bookingDate.setHours(0, 0, 0, 0);

    const activeBooking = await prisma.booking.findFirst({
      where: {
        studentId: user.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        date: { gte: new Date() },
      },
    });

    if (activeBooking) {
      return NextResponse.json(
        { error: "Již máte rezervovanou lekci. Nejdříve ji zrušte." },
        { status: 400 }
      );
    }

    const existing = await prisma.booking.findFirst({
      where: {
        instructorId: instructor.id,
        date: bookingDate,
        startTime: data.startTime,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Tento termín je již obsazen" },
        { status: 400 }
      );
    }

    const endTime = getSlotEndTime(data.startTime);

    const booking = await prisma.booking.create({
      data: {
        studentId: user.id,
        instructorId: instructor.id,
        date: bookingDate,
        startTime: data.startTime,
        endTime,
        pickupLocation: data.pickupLocation,
        status: "CONFIRMED",
      },
      include: {
        student: true,
        instructor: true,
      },
    });

    try {
      await sendBookingConfirmationToStudent({
        studentName: booking.student.name,
        studentEmail: booking.student.email,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        pickupLocation: booking.pickupLocation ?? undefined,
      });

      await sendBookingNotificationToInstructor({
        studentName: booking.student.name,
        studentEmail: booking.student.email,
        studentPhone: booking.student.phone ?? undefined,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        pickupLocation: booking.pickupLocation ?? undefined,
      });
    } catch (emailError) {
      console.error("Email send error:", emailError);
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data" }, { status: 400 });
    }
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
