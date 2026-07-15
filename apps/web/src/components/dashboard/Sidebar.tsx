"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Users,
  MessageSquare,
  Briefcase,
  Settings,
  LogOut,
  CalendarDays,
  Home,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard/home",        icon: Home,            label: "Home" },
  { href: "/dashboard/supervision", icon: MessageSquare,   label: "Supervisão" },
  { href: "/dashboard/clients",     icon: Users,           label: "Clientes" },
  { href: "/dashboard/schedule",    icon: CalendarDays,    label: "Agenda" },
  { href: "/dashboard/reports",     icon: Briefcase,       label: "Meu escritório" },
  { href: "/dashboard/certificate", icon: Award,           label: "Certificado" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-brand-500 border-r border-black/10 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/15">
        <Link href="/dashboard/home">
          <Image src="/logoPaideia.png" alt="Paideia" width={170} height={85} className="rounded-lg" priority />
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
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className={cn("w-4.5 h-4.5", active ? "text-white" : "text-white/60")} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-white/15 pt-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4 text-white/60" strokeWidth={1.8} />
          Configurações
        </Link>
        <Link
          href="/auth/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 text-white/60" strokeWidth={1.8} />
          Sair
        </Link>
      </div>
    </aside>
  );
}
