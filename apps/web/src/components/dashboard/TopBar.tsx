"use client";

import { Bell, Search } from "lucide-react";
import { mockUser } from "@/lib/mock-data";
import { getInitials } from "@/lib/utils";

export function TopBar() {
  const daysLeft = mockUser.subscription.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(mockUser.subscription.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      {/* Busca */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar cliente, supervisão..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Badge trial */}
        {daysLeft !== null && daysLeft <= 7 && (
          <div className="hidden md:flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            Trial: {daysLeft} {daysLeft === 1 ? "dia" : "dias"} restantes
          </div>
        )}

        {/* Notificações */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
          <Bell className="w-5 h-5" strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
            {getInitials(mockUser.name)}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800 leading-none">{mockUser.name.split(" ")[0]}</p>
            <p className="text-xs text-gray-400 mt-0.5">Terapeuta</p>
          </div>
        </div>
      </div>
    </header>
  );
}
