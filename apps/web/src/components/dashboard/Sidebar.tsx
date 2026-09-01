"use client";

import { useEffect } from "react";
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
  ClipboardList,
  BarChart3,
  BookOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { API_BASE } from "@/lib/api-base";

const NAV = [
  { href: "/dashboard/home",         icon: Home,            label: "Home",                     adminOnly: false },
  { href: "/dashboard/supervision",  icon: MessageSquare,   label: "Supervisão",                adminOnly: false },
  { href: "/dashboard/clients",      icon: Users,           label: "Clientes",                  adminOnly: false },
  { href: "/dashboard/schedule",     icon: CalendarDays,    label: "Agenda",                     adminOnly: false },
  { href: "/dashboard/reports",      icon: Briefcase,       label: "Meu escritório",              adminOnly: false },
  { href: "/dashboard/certificate",  icon: Award,           label: "Certificado",                adminOnly: false },
  { href: "/dashboard/survey",       icon: ClipboardList,   label: "Pesquisa de Satisfação",      adminOnly: false },
  { href: "/dashboard/survey-results", icon: BarChart3,     label: "Resultados da Pesquisa",      adminOnly: true },
  { href: "/dashboard/manual",       icon: BookOpen,        label: "Manual",                     adminOnly: false },
];

interface SidebarProps {
  /** Controla o drawer mobile — ignorado em telas md+ (onde o menu fica sempre visível). */
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  // Fecha o drawer mobile automaticamente ao navegar para outra tela.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const navLinks = NAV.filter(item => !item.adminOnly || isAdmin).map(({ href, icon: Icon, label }) => {
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
  });

  const footer = (
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
  );

  return (
    <>
      {/* Desktop — sempre visível */}
      <aside className="print-hide hidden md:flex w-60 bg-brand-500 border-r border-black/10 flex-col flex-shrink-0">
        <div className="px-5 py-6 border-b border-white/15">
          <Link href="/dashboard/home">
            <Image src={`${API_BASE}/paideia-wordmark-white.svg`} alt="Paideia" width={170} height={40} priority />
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">{navLinks}</nav>
        {footer}
      </aside>

      {/* Mobile — drawer com overlay, controlado pelo botão hambúrguer no TopBar */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
          <aside className="print-hide relative w-64 max-w-[80vw] h-full bg-brand-500 flex flex-col shadow-xl">
            <div className="px-5 py-6 border-b border-white/15 flex items-center justify-between">
              <Link href="/dashboard/home">
                <Image src={`${API_BASE}/paideia-wordmark-white.svg`} alt="Paideia" width={150} height={36} priority />
              </Link>
              <button
                onClick={onClose}
                aria-label="Fechar menu"
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">{navLinks}</nav>
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}
