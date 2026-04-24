"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Phone, Mail, Calendar, BookOpen, Loader2, FileText } from "lucide-react";
import { formatCzechDate } from "@/lib/booking-utils";

const TOTAL_LESSONS = 28;

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  notes?: string | null;
  createdAt: string;
  completedCount: number;
  totalCount: number;
  hasActiveBooking: boolean;
}

export function StudentList({ students: initialStudents }: { students: Student[] }) {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search))
  );

  async function saveNotes(studentId: string) {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/students/${studentId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error();
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, notes } : s))
      );
      if (selected?.id === studentId) {
        setSelected((prev) => prev && { ...prev, notes });
      }
      toast.success("Poznámky uloženy");
    } catch {
      toast.error("Chyba při ukládání poznámek");
    } finally {
      setSavingNotes(false);
    }
  }

  function openStudent(s: Student) {
    setSelected(s);
    setNotes(s.notes || "");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Studenti ({students.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Hledat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Žádní studenti nenalezeni</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((student) => {
                const progress = Math.min(
                  (student.completedCount / TOTAL_LESSONS) * 100,
                  100
                );

                return (
                  <div
                    key={student.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl gap-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => openStudent(student)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{student.name}</span>
                        {student.hasActiveBooking && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            Má rezervaci
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {student.email}
                        </span>
                        {student.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {student.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {student.completedCount}/{TOTAL_LESSONS} lekcí
                        </span>
                      </div>
                      <div className="mt-2 w-full max-w-48">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openStudent(student)}>
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      Detail
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selected.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{selected.email}</p>
                </div>
                {selected.phone && (
                  <div>
                    <p className="text-gray-500">Telefon</p>
                    <p className="font-medium">{selected.phone}</p>
                  </div>
                )}
                {selected.dateOfBirth && (
                  <div>
                    <p className="text-gray-500">Datum narození</p>
                    <p className="font-medium">{formatCzechDate(selected.dateOfBirth)}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Registrace</p>
                  <p className="font-medium">{formatCzechDate(selected.createdAt)}</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Postup výuky</span>
                  <span className="text-gray-600">
                    {selected.completedCount}/{TOTAL_LESSONS} lekcí
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min((selected.completedCount / TOTAL_LESSONS) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Poznámky instruktora</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Poznámky ke studentovi..."
                  rows={4}
                />
                <Button
                  size="sm"
                  onClick={() => saveNotes(selected.id)}
                  disabled={savingNotes}
                >
                  {savingNotes ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : null}
                  Uložit poznámky
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
