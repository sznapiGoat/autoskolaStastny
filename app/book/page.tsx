import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { BookingCalendar } from "@/components/student/booking-calendar";

export default async function BookPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const user = session.user as any;
  if (user.role === "INSTRUCTOR") redirect("/instructor");

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Rezervace lekce jízdy</h1>
          <p className="text-gray-500 mt-1">Vyberte datum a čas vaší lekce</p>
        </div>
        <BookingCalendar />
      </main>
    </div>
  );
}
