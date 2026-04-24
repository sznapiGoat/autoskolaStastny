import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";
import { InstructorCalendar } from "@/components/instructor/instructor-calendar";

export default async function InstructorCalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const user = session.user as any;
  if (user.role !== "INSTRUCTOR") redirect("/dashboard");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const bookings = await prisma.booking.findMany({
    where: {
      instructorId: user.id,
      date: { gte: thirtyDaysAgo },
    },
    include: {
      student: { select: { name: true, email: true, phone: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Kalendář lekcí</h1>
          <p className="text-gray-500 mt-1">Přehled všech rezervací</p>
        </div>
        <InstructorCalendar bookings={JSON.parse(JSON.stringify(bookings))} />
      </main>
    </div>
  );
}
