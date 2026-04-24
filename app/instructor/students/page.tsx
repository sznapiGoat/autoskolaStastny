import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";
import { StudentList } from "@/components/instructor/student-list";

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const user = session.user as any;
  if (user.role !== "INSTRUCTOR") redirect("/dashboard");

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      bookings: {
        where: { instructorId: user.id },
        select: { id: true, status: true, date: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const studentsData = students.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    dateOfBirth: s.dateOfBirth?.toISOString() || null,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
    completedCount: s.bookings.filter((b) => b.status === "COMPLETED").length,
    totalCount: s.bookings.length,
    hasActiveBooking: s.bookings.some(
      (b) => (b.status === "PENDING" || b.status === "CONFIRMED") && new Date(b.date) >= new Date()
    ),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Správa studentů</h1>
          <p className="text-gray-500 mt-1">Přehled všech registrovaných studentů</p>
        </div>
        <StudentList students={studentsData} />
      </main>
    </div>
  );
}
