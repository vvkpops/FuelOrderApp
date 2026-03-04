"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "./AuthGate";
import { Plane, History, Settings, Fuel, LogOut } from "lucide-react";

const navItems = [
  { href: "/", label: "Flights", icon: Plane },
  { href: "/history", label: "Order History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <nav className="bg-white dark:bg-gray-950/95 dark:backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="av-runway-stripe" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="relative bg-emerald-600 text-white p-2 rounded-lg shadow-lg shadow-emerald-500/20">
              <Fuel size={20} />
              <div className="absolute inset-0 rounded-lg bg-emerald-400/20 animate-pulse-glow" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">
                Fuel Ordering
              </span>
              <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-500 ml-2 font-mono uppercase tracking-widest">
                Dispatch System
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 shadow-sm dark:shadow-emerald-500/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-emerald-300 dark:hover:bg-gray-800/60"
                    }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
            <div className="ml-2 border-l border-gray-200 dark:border-gray-700 pl-2 flex items-center gap-1">
              <ThemeToggle />
              <button
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
