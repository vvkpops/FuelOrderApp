"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "./AuthGate";
import { Plane, History, Settings, Fuel, LogOut, Menu as MenuIcon, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Flights", icon: Plane },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
      <div className="av-status-bar" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5">
            <div className="relative bg-gradient-to-br from-sky-500 to-sky-600 text-white p-2 rounded-lg shadow-lg shadow-sky-500/25">
              <Fuel size={18} />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight">
                Fuel Orders
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-sky-300 dark:hover:bg-slate-800/60"
                    }`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </Link>
              );
            })}
            <div className="ml-2 border-l border-slate-200 dark:border-slate-700 pl-2 flex items-center gap-1">
              <ThemeToggle />
              <button
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center gap-2">
            <ThemeToggle />
            <Menu as="div" className="relative">
              <MenuButton className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                <MenuIcon size={20} />
              </MenuButton>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white dark:bg-slate-900 shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none py-1">
                  {navItems.map(({ href, label, icon: Icon }) => (
                    <MenuItem key={href}>
                      {({ focus }) => (
                        <Link
                          href={href}
                          className={`flex items-center gap-2 px-4 py-2.5 text-sm ${
                            focus
                              ? "bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <Icon size={16} />
                          {label}
                        </Link>
                      )}
                    </MenuItem>
                  ))}
                  <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={logout}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm w-full ${
                          focus
                            ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <LogOut size={16} />
                        Sign out
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
}
