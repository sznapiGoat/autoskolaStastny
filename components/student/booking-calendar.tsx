"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, addDays, startOfDay, isBefore } from "date-fns";
import { cs } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { formatCzechDate, getSlotEndTime } from "@/lib/booking-utils";

interface Slot {
  time: string;
  available: boolean;
}

type Step = "date" | "time" | "confirm";

export function BookingCalendar() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [pickupLocation, setPickupLocation] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedTime(null);

    fetch(`/api/slots?date=${format(selectedDate, "yyyy-MM-dd")}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []))
      .catch(() => toast.error("Nepodařilo se načíst dostupné termíny"))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  async function handleBook() {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(selectedDate, "yyyy-MM-dd"),
          startTime: selectedTime,
          pickupLocation: pickupLocation || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Rezervace se nezdařila");
        return;
      }

      toast.success("Lekce byla úspěšně rezervována!");
      router.push("/dashboard");
    } catch {
      toast.error("Chyba serveru, zkuste to znovu");
    } finally {
      setSubmitting(false);
    }
  }

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        {(["date", "time", "confirm"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? "bg-blue-600 text-white"
                  : step === "time" && s === "date"
                  ? "bg-green-500 text-white"
                  : step === "confirm" && s !== "confirm"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {(step === "time" && s === "date") || (step === "confirm" && s !== "confirm") ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            <span className="text-sm hidden sm:block">
              {s === "date" ? "Datum" : s === "time" ? "Čas" : "Potvrzení"}
            </span>
            {i < 2 && <div className="w-8 h-px bg-gray-300 hidden sm:block" />}
          </div>
        ))}
      </div>

      {step === "date" && (
        <Card>
          <CardHeader>
            <CardTitle>Vyberte datum</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                if (date) setStep("time");
              }}
              disabled={(date) => isBefore(startOfDay(date), today) || date > maxDate}
              locale={cs}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      )}

      {step === "time" && selectedDate && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Vyberte čas – {formatCzechDate(selectedDate)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">Načítání termínů...</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>V tento den nejsou dostupné žádné termíny</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setStep("date")}
                  >
                    Vybrat jiný den
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      onClick={() => {
                        setSelectedTime(slot.time);
                        setStep("confirm");
                      }}
                      className={`p-3 rounded-xl text-sm font-medium transition-all ${
                        !slot.available
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : selectedTime === slot.time
                          ? "bg-blue-600 text-white"
                          : "bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >
                      {slot.time}
                      {!slot.available && (
                        <span className="block text-xs mt-0.5">obsazeno</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => setStep("date")}>
            ← Zpět
          </Button>
        </div>
      )}

      {step === "confirm" && selectedDate && selectedTime && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Potvrdit rezervaci</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">
                    {formatCzechDate(selectedDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>
                    {selectedTime} – {getSlotEndTime(selectedTime)} (45 minut)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup" className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  Místo vyzvednutí (volitelné)
                </Label>
                <Input
                  id="pickup"
                  placeholder="např. Humpolec, náměstí"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("time")}
                  disabled={submitting}
                >
                  ← Zpět
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleBook}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rezervuji...
                    </>
                  ) : (
                    "Potvrdit rezervaci"
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Po potvrzení obdržíte email s detaily rezervace.
                Lekci lze zrušit nejpozději 24 hodin předem.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
