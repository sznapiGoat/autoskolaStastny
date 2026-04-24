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
import { CalendarPlus, Clock, MapPin, Phone, Loader2, CheckCircle2, BookOpen } from "lucide-react";
import { formatCzechDate } from "@/lib/booking-utils";

const TOTAL_LESSONS_REQUIRED = 28;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Čeká na potvrzení",
  CONFIRMED: "Potvrzeno",
  CANCELLED: "Zrušeno",
  COMPLETED: "Absolvováno",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
};

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  pickupLocation?: string;
}

interface Props {
  userName: string;
  upcomingBookings: Booking[];
  pastBookings: Booking[];
  completedCount: number;
}

export function StudentDashboard({ userName, upcomingBookings, pastBookings, completedCount }: Props) {
  const [bookings, setBookings] = useState(upcomingBookings);
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function cancelBooking(id: string) {
    setCancelling(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Zrušení se nezdařilo");
        return;
      }

      setBookings((prev) => prev.filter((b) => b.id !== id));
      toast.success("Lekce byla zrušena");
    } catch {
      toast.error("Chyba serveru, zkuste to znovu");
    } finally {
      setCancelling(null);
    }
  }

  function isLateCancel(dateStr: string, startTime: string): boolean {
    const lessonDate = new Date(dateStr);
    const [h, m] = startTime.split(":").map(Number);
    lessonDate.setHours(h, m, 0, 0);
    const hoursUntil = (lessonDate.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil < 24;
  }

  const progress = Math.min((completedCount / TOTAL_LESSONS_REQUIRED) * 100, 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dobrý den, {userName}</h1>
        <p className="text-gray-500 mt-1">Váš přehled lekcí jízdy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Absolvované lekce</p>
                <p className="text-2xl font-bold">{completedCount}/{TOTAL_LESSONS_REQUIRED}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Postup</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <CalendarPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Nadcházející lekce</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Zbývá lekcí</p>
                <p className="text-2xl font-bold">{Math.max(0, TOTAL_LESSONS_REQUIRED - completedCount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Nadcházející lekce</CardTitle>
          <Link href="/book">
            <Button size="sm">
              <CalendarPlus className="w-4 h-4 mr-2" />
              Rezervovat
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <CalendarPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Žádné nadcházející lekce</p>
              <Link href="/book">
                <Button variant="outline" className="mt-4">
                  Rezervovat lekci
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const late = isLateCancel(booking.date, booking.startTime);
                return (
                  <div
                    key={booking.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {formatCzechDate(booking.date)}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[booking.status]}`}
                        >
                          {STATUS_LABELS[booking.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {booking.startTime} – {booking.endTime}
                        </span>
                        {booking.pickupLocation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {booking.pickupLocation}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${process.env.NEXT_PUBLIC_INSTRUCTOR_PHONE || "+420777000000"}`}>
                        <Button variant="outline" size="sm">
                          <Phone className="w-3.5 h-3.5 mr-1" />
                          Kontakt
                        </Button>
                      </a>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={cancelling === booking.id}
                            >
                              {cancelling === booking.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "Zrušit"
                              )}
                            </Button>
                          }
                        />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Zrušit lekci?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {late ? (
                                <span className="text-orange-600 font-medium">
                                  Upozornění: Lekce je za méně než 24 hodin. Pozdní zrušení
                                  může být zpoplatněno.{" "}
                                </span>
                              ) : null}
                              Opravdu chcete zrušit lekci dne{" "}
                              <strong>{formatCzechDate(booking.date)}</strong> v{" "}
                              <strong>{booking.startTime}</strong>?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Zpět</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelBooking(booking.id)}
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
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {pastBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historie lekcí</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-sm text-gray-700">
                      {formatCzechDate(booking.date)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {booking.startTime} – {booking.endTime}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[booking.status]}`}
                  >
                    {STATUS_LABELS[booking.status]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
