"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Para quem", href: "#para-quem" },
  { label: "Ética e CFP", href: "#etica" },
  { label: "Preços", href: "#precos" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/landing" className="flex-shrink-0">
          <Image src="/paideia-wordmark-light.svg" alt="Paideia" width={120} height={48} priority />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-gray-600 hover:text-brand-500 font-medium transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/auth/register"
            className="text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-5 py-2 rounded-xl transition-colors"
          >
            Começar agora
          </Link>
        </div>

        {/* Hamburger mobile */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-gray-700 font-medium"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <hr className="border-gray-100" />
          <Link href="/auth/login" className="text-sm font-semibold text-brand-600">
            Entrar
          </Link>
          <Link
            href="/auth/register"
            className="text-sm font-semibold text-white bg-brand-500 px-5 py-2.5 rounded-xl text-center"
          >
            Começar agora
          </Link>
        </div>
      )}
    </header>
  );
}
