"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart2,
  Settings,
  LogOut,
  CalendarDays,
  ScrollText,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard/home",        icon: Home,            label: "Home" },
  { href: "/dashboard/supervision", icon: MessageSquare,   label: "Supervisão" },
  { href: "/dashboard/evolution",   icon: ScrollText,      label: "Evolução" },
  { href: "/dashboard/clients",     icon: Users,           label: "Clientes" },
  { href: "/dashboard/schedule",    icon: CalendarDays,    label: "Agenda" },
  { href: "/dashboard",             icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/reports",     icon: BarChart2,       label: "Relatórios" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-100">
        <Link href="/">
          <Image src="/paideia-wordmark-light.svg" alt="Paideia" width={170} height={68} priority />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-4.5 h-4.5", active ? "text-brand-500" : "text-gray-400")} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-gray-100 pt-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
          Configurações
        </Link>
        <Link
          href="/auth/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
          Sair
        </Link>
      </div>
    </aside>
  );
}
