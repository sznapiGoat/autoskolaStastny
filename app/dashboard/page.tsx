import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";
import { StudentDashboard } from "@/components/student/student-dashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const user = session.user as any;
  if (user.role === "INSTRUCTOR") redirect("/instructor");

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const [upcomingBookings, pastBookings, userDetails] = await Promise.all([
    prisma.booking.findMany({
      where: {
        studentId: user.id,
        date: { gte: now },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.booking.findMany({
      where: {
        studentId: user.id,
        OR: [
          { date: { lt: now } },
          { status: { in: ["CANCELLED", "COMPLETED"] } },
        ],
      },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
      take: 10,
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, phone: true },
    }),
  ]);

  const completedCount = await prisma.booking.count({
    where: { studentId: user.id, status: "COMPLETED" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentDashboard
          userName={userDetails?.name || user.name || "Student"}
          upcomingBookings={JSON.parse(JSON.stringify(upcomingBookings))}
          pastBookings={JSON.parse(JSON.stringify(pastBookings))}
          completedCount={completedCount}
        />
      </main>
    </div>
  );
}
