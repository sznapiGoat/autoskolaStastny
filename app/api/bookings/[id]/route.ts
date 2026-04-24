import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCancellationEmail } from "@/lib/email";

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
  const body = await req.json();
  const { status, notes, pickupLocation } = body;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { student: true, instructor: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Rezervace nenalezena" }, { status: 404 });
  }

  if (user.role === "STUDENT" && booking.studentId !== user.id) {
    return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
  }

  if (status === "CANCELLED") {
    const now = new Date();
    const lessonDate = new Date(booking.date);
    const [hours, minutes] = booking.startTime.split(":").map(Number);
    lessonDate.setHours(hours, minutes, 0, 0);

    const hoursUntilLesson = (lessonDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (user.role === "STUDENT" && hoursUntilLesson < 0) {
      return NextResponse.json(
        { error: "Nelze zrušit proběhlou lekci" },
        { status: 400 }
      );
    }

    try {
      await sendCancellationEmail({
        recipientName: booking.student.name,
        recipientEmail: booking.student.email,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        cancelledBy: user.role === "STUDENT" ? "student" : "instructor",
      });

      const instructorUser = await prisma.user.findFirst({
        where: { role: "INSTRUCTOR" },
      });
      if (instructorUser) {
        await sendCancellationEmail({
          recipientName: instructorUser.name,
          recipientEmail: instructorUser.email,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          cancelledBy: user.role === "STUDENT" ? "student" : "instructor",
        });
      }
    } catch (emailError) {
      console.error("Email error:", emailError);
    }
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      ...(pickupLocation !== undefined && { pickupLocation }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
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

  await prisma.booking.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
