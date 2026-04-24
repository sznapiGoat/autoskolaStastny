"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { cs } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Clock, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { formatCzechDate } from "@/lib/booking-utils";
import { cn } from "@/lib/utils";

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

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-400",
  CONFIRMED: "bg-green-400",
  CANCELLED: "bg-red-400",
  COMPLETED: "bg-blue-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Čeká",
  CONFIRMED: "Potvrzeno",
  CANCELLED: "Zrušeno",
  COMPLETED: "Absolvováno",
};

export function InstructorCalendar({ bookings: initialBookings }: { bookings: Booking[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  function getBookingsForDay(date: Date) {
    return bookings.filter((b) => {
      const bDate = new Date(b.date);
      return isSameDay(bDate, date);
    });
  }

  const selectedDayBookings = selectedDay ? getBookingsForDay(selectedDay) : [];

  async function updateStatus(id: string, status: string) {
    setProcessing(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setBookings((prev) =>
        status === "CANCELLED"
          ? prev.map((b) => (b.id === id ? { ...b, status } : b))
          : prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
      toast.success(status === "COMPLETED" ? "Označeno jako absolvováno" : "Zrušeno");
    } catch {
      toast.error("Chyba aktualizace");
    } finally {
      setProcessing(null);
    }
  }

  const weekDays = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

  const firstDayOffset = (days[0].getDay() + 6) % 7;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="capitalize">
              {format(currentMonth, "LLLL yyyy", { locale: cs })}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const dayBookings = getBookingsForDay(day);
              const isToday = isSameDay(day, new Date());
              const hasBookings = dayBookings.length > 0;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "aspect-square rounded-lg p-1 text-sm transition-all flex flex-col items-center justify-start",
                    isToday && "bg-blue-100 font-bold",
                    hasBookings && "hover:bg-gray-100",
                    !hasBookings && "text-gray-400 hover:bg-gray-50",
                    selectedDay && isSameDay(day, selectedDay) && "ring-2 ring-blue-500"
                  )}
                >
                  <span className={cn("text-xs", isToday && "text-blue-700")}>
                    {format(day, "d")}
                  </span>
                  {hasBookings && (
                    <div className="flex gap-0.5 flex-wrap justify-center mt-0.5">
                      {dayBookings.slice(0, 3).map((b) => (
                        <div
                          key={b.id}
                          className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[b.status] || "bg-gray-400"}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 mt-4 flex-wrap">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[key]}`} />
                {label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && formatCzechDate(selectedDay)}
            </DialogTitle>
          </DialogHeader>
          {selectedDayBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Žádné rezervace tento den</p>
          ) : (
            <div className="space-y-3">
              {selectedDayBookings.map((b) => (
                <div key={b.id} className="p-4 border rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{b.student.name}</div>
                      <div className="text-sm text-gray-500">{b.student.email}</div>
                      {b.student.phone && (
                        <div className="text-sm text-gray-500">{b.student.phone}</div>
                      )}
                    </div>
                    <Badge
                      className={cn(
                        "text-white",
                        STATUS_COLORS[b.status]
                      )}
                    >
                      {STATUS_LABELS[b.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-3.5 h-3.5" />
                    {b.startTime} – {b.endTime}
                  </div>
                  {b.status !== "CANCELLED" && b.status !== "COMPLETED" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-green-600"
                        disabled={processing === b.id}
                        onClick={() => updateStatus(b.id, "COMPLETED")}
                      >
                        {processing === b.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Absolvováno
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-600"
                        disabled={processing === b.id}
                        onClick={() => updateStatus(b.id, "CANCELLED")}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Zrušit
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
