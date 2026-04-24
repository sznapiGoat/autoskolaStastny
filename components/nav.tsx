"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Car, LayoutDashboard, CalendarPlus, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const studentLinks = [
  { href: "/dashboard", label: "Přehled", icon: LayoutDashboard },
  { href: "/book", label: "Rezervovat lekci", icon: CalendarPlus },
];

const instructorLinks = [
  { href: "/instructor", label: "Přehled", icon: LayoutDashboard },
  { href: "/instructor/calendar", label: "Kalendář", icon: CalendarPlus },
  { href: "/instructor/students", label: "Studenti", icon: LayoutDashboard },
  { href: "/instructor/availability", label: "Dostupnost", icon: CalendarPlus },
];

export function Nav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const user = session?.user as any;
  const isInstructor = user?.role === "INSTRUCTOR";
  const links = isInstructor ? instructorLinks : studentLinks;

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={isInstructor ? "/instructor" : "/dashboard"} className="flex items-center gap-2">
            <Car className="w-6 h-6" />
            <span className="font-bold text-lg hidden sm:block">Autoškola Šťastný</span>
            <span className="font-bold text-lg sm:hidden">AŠ</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-white/20 text-white"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-blue-200 text-sm hidden md:block">{user?.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-blue-100 hover:text-white hover:bg-white/10 hidden md:flex"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Odhlásit
            </Button>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 pb-3">
          <div className="px-4 pt-3 pb-2 text-blue-200 text-sm">{user?.name}</div>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-3 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-white/20 text-white"
                  : "text-blue-100 hover:bg-white/10"
              )}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="block w-full text-left px-4 py-3 text-sm text-blue-100 hover:bg-white/10"
          >
            Odhlásit se
          </button>
        </div>
      )}
    </nav>
  );
}
