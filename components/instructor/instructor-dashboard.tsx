"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import { formatCzechDate } from "@/lib/booking-utils";

interface Student {
  name: string;
  email: string;
  phone?: string;
}

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  student: Student;
}

interface Props {
  todayBookings: Booking[];
  upcomingBookings: Booking[];
  totalStudents: number;
}

export function InstructorDashboard({ todayBookings, upcomingBookings, totalStudents }: Props) {
  const [bookings, setBookings] = useState({ today: todayBookings, upcoming: upcomingBookings });
  const [processing, setProcessing] = useState<string | null>(null);

  async function updateStatus(id: string, status: string, list: "today" | "upcoming") {
    setProcessing(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Chyba aktualizace");
        return;
      }

      if (status === "CANCELLED" || status === "COMPLETED") {
        setBookings((prev) => ({
          ...prev,
          [list]: prev[list].filter((b) => b.id !== id),
        }));
      } else {
        setBookings((prev) => ({
          ...prev,
          [list]: prev[list].map((b) =>
            b.id === id ? { ...b, status } : b
          ),
        }));
      }

      const msg =
        status === "COMPLETED"
          ? "Lekce označena jako absolvovaná"
          : status === "CANCELLED"
          ? "Lekce zrušena"
          : "Stav aktualizován";
      toast.success(msg);
    } catch {
      toast.error("Chyba serveru");
    } finally {
      setProcessing(null);
    }
  }

  function BookingCard({ booking, list }: { booking: Booking; list: "today" | "upcoming" }) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl gap-4">
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{booking.student.name}</div>
          <div className="text-sm text-gray-500">{booking.student.email}</div>
          {booking.student.phone && (
            <div className="text-sm text-gray-500">{booking.student.phone}</div>
          )}
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
            <Clock className="w-3.5 h-3.5" />
            <span>{booking.startTime} – {booking.endTime}</span>
            {list === "upcoming" && (
              <span className="text-gray-400">· {formatCzechDate(booking.date)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-200 hover:bg-green-50"
            disabled={processing === booking.id}
            onClick={() => updateStatus(booking.id, "COMPLETED", list)}
          >
            {processing === booking.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Absolvováno
              </>
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  disabled={processing === booking.id}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Zrušit
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Zrušit lekci?</AlertDialogTitle>
                <AlertDialogDescription>
                  Opravdu chcete zrušit lekci studenta{" "}
                  <strong>{booking.student.name}</strong> dne{" "}
                  <strong>{formatCzechDate(booking.date)}</strong> v{" "}
                  <strong>{booking.startTime}</strong>?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Zpět</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => updateStatus(booking.id, "CANCELLED", list)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Zrušit lekci
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Přehled instruktora</h1>
        <p className="text-gray-500 mt-1">Autoškola Šťastný – správa rezervací</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Dnes</p>
                <p className="text-xl font-bold">{bookings.today.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Nadcházející</p>
                <p className="text-xl font-bold">{bookings.upcoming.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Studenti</p>
                <p className="text-xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Link href="/instructor/availability">
              <Button variant="outline" size="sm" className="w-full">
                Správa dostupnosti
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dnešní rozvrh</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.today.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarDays className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>Dnes nejsou žádné lekce</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.today.map((b) => (
                <BookingCard key={b.id} booking={b} list="today" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Nadcházející lekce</CardTitle>
          <Link href="/instructor/calendar">
            <Button variant="outline" size="sm">Zobrazit kalendář</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {bookings.upcoming.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>Žádné nadcházející lekce</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.upcoming.map((b) => (
                <BookingCard key={b.id} booking={b} list="upcoming" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
