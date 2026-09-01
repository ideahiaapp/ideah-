"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { HowItWorksPanel } from "@/components/dashboard/HowItWorksModal";
import { HowItWorksProvider } from "@/lib/how-it-works-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <HowItWorksProvider>
      <div className="dashboard-shell flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <TopBar onMenuClick={() => setMobileNavOpen(true)} />
          <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 min-w-0 overflow-y-auto p-6 print:p-0">
              {children}
            </main>
            <HowItWorksPanel />
          </div>
        </div>
      </div>
    </HowItWorksProvider>
  );
}
