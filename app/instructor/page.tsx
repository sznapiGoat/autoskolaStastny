import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";
import { InstructorDashboard } from "@/components/instructor/instructor-dashboard";

export default async function InstructorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const user = session.user as any;
  if (user.role !== "INSTRUCTOR") redirect("/dashboard");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayBookings, upcomingBookings, totalStudents] = await Promise.all([
    prisma.booking.findMany({
      where: {
        instructorId: user.id,
        date: today,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        student: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        instructorId: user.id,
        date: { gte: tomorrow },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        student: { select: { name: true, email: true, phone: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 10,
    }),
    prisma.user.count({ where: { role: "STUDENT" } }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InstructorDashboard
          todayBookings={JSON.parse(JSON.stringify(todayBookings))}
          upcomingBookings={JSON.parse(JSON.stringify(upcomingBookings))}
          totalStudents={totalStudents}
        />
      </main>
    </div>
  );
}
