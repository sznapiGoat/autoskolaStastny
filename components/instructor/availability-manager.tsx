"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Loader2, CalendarDays, Trash2, Plus } from "lucide-react";
import { DAY_NAMES_CZ, formatCzechDate } from "@/lib/booking-utils";

interface AvailabilityRecord {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
}

interface Props {
  initialAvailability: AvailabilityRecord[];
  initialBlockedDates: BlockedDate[];
}

const DEFAULT_TIMES = { startTime: "09:00", endTime: "17:00" };

export function AvailabilityManager({ initialAvailability, initialBlockedDates }: Props) {
  const [availability, setAvailability] = useState<AvailabilityRecord[]>(initialAvailability);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(initialBlockedDates);
  const [saving, setSaving] = useState<number | null>(null);
  const [blockDate, setBlockDate] = useState<Date | undefined>();
  const [blockReason, setBlockReason] = useState("");
  const [addingBlock, setAddingBlock] = useState(false);
  const [deletingBlock, setDeletingBlock] = useState<string | null>(null);
  const [localTimes, setLocalTimes] = useState<Record<number, { startTime: string; endTime: string }>>(
    Object.fromEntries(
      [0, 1, 2, 3, 4, 5, 6].map((day) => {
        const rec = initialAvailability.find((a) => a.dayOfWeek === day);
        return [day, rec ? { startTime: rec.startTime, endTime: rec.endTime } : DEFAULT_TIMES];
      })
    )
  );

  function isEnabled(day: number) {
    return availability.some((a) => a.dayOfWeek === day);
  }

  async function toggleDay(day: number) {
    if (isEnabled(day)) {
      setSaving(day);
      try {
        const res = await fetch(`/api/availability?dayOfWeek=${day}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        setAvailability((prev) => prev.filter((a) => a.dayOfWeek !== day));
        toast.success(`${DAY_NAMES_CZ[day]} odstraněn z dostupnosti`);
      } catch {
        toast.error("Chyba při odstraňování");
      } finally {
        setSaving(null);
      }
    } else {
      await saveDay(day);
    }
  }

  async function saveDay(day: number) {
    const times = localTimes[day];
    setSaving(day);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek: day, ...times }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAvailability((prev) => {
        const filtered = prev.filter((a) => a.dayOfWeek !== day);
        return [...filtered, data];
      });
      toast.success(`${DAY_NAMES_CZ[day]} uložen`);
    } catch {
      toast.error("Chyba při ukládání");
    } finally {
      setSaving(null);
    }
  }

  async function addBlockedDate() {
    if (!blockDate) return;
    setAddingBlock(true);
    try {
      const res = await fetch("/api/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(blockDate, "yyyy-MM-dd"),
          reason: blockReason || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Chyba při blokování data");
        return;
      }
      const data = await res.json();
      setBlockedDates((prev) => [...prev, data]);
      setBlockDate(undefined);
      setBlockReason("");
      toast.success("Datum zablokováno");
    } catch {
      toast.error("Chyba serveru");
    } finally {
      setAddingBlock(false);
    }
  }

  async function removeBlockedDate(id: string) {
    setDeletingBlock(id);
    try {
      const res = await fetch(`/api/blocked-dates?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBlockedDates((prev) => prev.filter((b) => b.id !== id));
      toast.success("Blokace odstraněna");
    } catch {
      toast.error("Chyba při odstraňování");
    } finally {
      setDeletingBlock(null);
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Týdenní dostupnost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const enabled = isEnabled(day);
              const times = localTimes[day];

              return (
                <div
                  key={day}
                  className={`p-4 rounded-xl border transition-all ${
                    enabled ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={enabled}
                        onCheckedChange={() => toggleDay(day)}
                        disabled={saving === day}
                      />
                      <span className="font-medium text-gray-900 w-24">
                        {DAY_NAMES_CZ[day]}
                      </span>
                    </div>
                    {saving === day && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    )}
                  </div>

                  {enabled && (
                    <div className="flex items-end gap-3 flex-wrap">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Od</Label>
                        <Input
                          type="time"
                          value={times.startTime}
                          onChange={(e) =>
                            setLocalTimes((prev) => ({
                              ...prev,
                              [day]: { ...prev[day], startTime: e.target.value },
                            }))
                          }
                          className="w-32"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Do</Label>
                        <Input
                          type="time"
                          value={times.endTime}
                          onChange={(e) =>
                            setLocalTimes((prev) => ({
                              ...prev,
                              [day]: { ...prev[day], endTime: e.target.value },
                            }))
                          }
                          className="w-32"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => saveDay(day)}
                        disabled={saving === day}
                      >
                        Uložit
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zablokovaná data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label>Datum</Label>
                <Popover>
                  <PopoverTrigger render={<Button variant="outline" className="w-44 justify-start" />}>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    {blockDate ? formatCzechDate(blockDate) : "Vyberte datum"}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={blockDate}
                      onSelect={setBlockDate}
                      disabled={(date) => date < new Date()}
                      locale={cs}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1 flex-1 min-w-[180px]">
                <Label>Důvod (volitelný)</Label>
                <Input
                  placeholder="např. dovolená"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
              <Button
                onClick={addBlockedDate}
                disabled={!blockDate || addingBlock}
              >
                {addingBlock ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Zablokovat
                  </>
                )}
              </Button>
            </div>
          </div>

          {blockedDates.length === 0 ? (
            <p className="text-gray-500 text-sm">Žádná zablokovaná data</p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-sm">{formatCzechDate(b.date)}</span>
                    {b.reason && (
                      <span className="text-gray-500 text-sm ml-2">– {b.reason}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlockedDate(b.id)}
                    disabled={deletingBlock === b.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                  >
                    {deletingBlock === b.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
