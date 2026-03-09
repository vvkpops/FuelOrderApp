"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Send,
  AlertTriangle,
  Search,
  Edit3,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Calendar,
  Globe,
  Clock,
  FileText,
  Mail,
} from "lucide-react";
import { useToast } from "./Toast";
import { OrderModal } from "./OrderModal";

interface Flight {
  id: string;
  flightNumber: string;
  acRegistration: string;
  acType: string;
  deptIcao: string;
  deptTime: string;
  arrivalIcao: string | null;
  arrivalTime: string | null;
  eta: string | null;
  fuelLoad: number | null;
  dispatcher: string | null;
  hasOrder: boolean;
  latestOrderStatus: string | null;
  orderAcReg: string | null;
  acRegChanged: boolean;
}

export function FlightTable() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fb_showFilters");
      return stored === null ? true : stored === "true";
    }
    return true;
  });
  const [filterDate, setFilterDate] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fb_filterDate");
      // Default to today if no stored value
      return stored || new Date().toISOString().slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
  });
  const [filterFlightNo, setFilterFlightNo] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("fb_filterFlightNo") || "";
    return "";
  });
  const [filterReg, setFilterReg] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("fb_filterReg") || "";
    return "";
  });
  const [sortField, setSortField] = useState<keyof Flight>(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("fb_sortField2") as keyof Flight) || "deptTime";
    return "deptTime";
  });
  const [sortDir, setSortDir] = useState<"asc" | "desc">(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("fb_sortDir2") as "asc" | "desc") || "desc";
    return "desc";
  });
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [boardTimeFormat, setBoardTimeFormat] = useState<"local" | "utc">(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("fb_timeFormat") as "local" | "utc") || "local";
    return "local";
  });
  const [tzCache, setTzCache] = useState<Record<string, string | null>>({});
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(false);
  const { addToast } = useToast();

  // Load settings (auto-email enabled)
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data.autoEmailEnabled) {
          setAutoEmailEnabled(data.data.autoEmailEnabled === "true");
        }
      })
      .catch(() => {});
  }, []);

  // Persist filter state to localStorage
  useEffect(() => {
    localStorage.setItem("fb_showFilters", String(showFilters));
    localStorage.setItem("fb_filterDate", filterDate);
    localStorage.setItem("fb_filterFlightNo", filterFlightNo);
    localStorage.setItem("fb_filterReg", filterReg);
    localStorage.setItem("fb_sortField2", sortField);
    localStorage.setItem("fb_sortDir2", sortDir);
    localStorage.setItem("fb_timeFormat", boardTimeFormat);
  }, [showFilters, filterDate, filterFlightNo, filterReg, sortField, sortDir, boardTimeFormat]);

  const fetchFlights = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set("date", filterDate);
      const res = await fetch(`/api/flights?${params.toString()}`);
      const data = await res.json();
      if (data.success) setFlights(data.data);
      else addToast("error", data.error || "Failed to fetch flights");
    } catch {
      addToast("error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [addToast, filterDate]);

  const syncFlights = async () => {
    setRefreshing(true);
    try {
      await fetchFlights();
      addToast("success", "Flights refreshed");
    } catch {
      addToast("error", "Failed to refresh flights");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  // Look up timezones for all unique ICAO codes in flight list
  useEffect(() => {
    const icaos = [...new Set(flights.map((f) => f.deptIcao.toUpperCase()))];
    const missing = icaos.filter((code) => !(code in tzCache));
    if (missing.length === 0) return;
    Promise.all(
      missing.map((code) =>
        fetch(`/api/airports?q=${encodeURIComponent(code)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.success && data.data && !Array.isArray(data.data)) {
              return [code, data.data.timezone || null] as [string, string | null];
            }
            return [code, null] as [string, string | null];
          })
          .catch(() => [code, null] as [string, string | null])
      )
    ).then((results) => {
      setTzCache((prev) => {
        const next = { ...prev };
        for (const [code, tz] of results) next[code] = tz;
        return next;
      });
    });
  }, [flights]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDeptTime = (deptTime: string, deptIcao: string) => {
    const d = new Date(deptTime);
    if (boardTimeFormat === "utc") {
      const mon = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
      const day = String(d.getUTCDate()).padStart(2, "0");
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      return `${mon} ${day}, ${hh}${mm}Z`;
    }
    const tz = tzCache[deptIcao.toUpperCase()];
    if (!tz) {
      const mon = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
      const day = String(d.getUTCDate()).padStart(2, "0");
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      return `${mon} ${day}, ${hh}${mm}Z`;
    }
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(d);
      const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
      return `${get("month")} ${get("day")}, ${get("hour")}${get("minute")}L`;
    } catch {
      const mon = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
      const day = String(d.getUTCDate()).padStart(2, "0");
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      return `${mon} ${day}, ${hh}${mm}Z`;
    }
  };

  const handleSort = (field: keyof Flight) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const activeFilterCount = [filterFlightNo, filterReg].filter(Boolean).length;

  const clearFilters = () => {
    setFilterDate(new Date().toISOString().slice(0, 10));
    setFilterFlightNo("");
    setFilterReg("");
  };

  const filtered = flights
    .filter((f) => {
      // Date filtering is done server-side via API
      if (filterFlightNo) {
        const terms = filterFlightNo.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
        if (terms.length > 0 && !terms.some((t) => f.flightNumber.toLowerCase().includes(t))) return false;
      }
      if (filterReg) {
        const terms = filterReg.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
        if (terms.length > 0 && !terms.some((t) => f.acRegistration.toLowerCase().includes(t))) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ field }: { field: keyof Flight }) => {
    if (sortField !== field) return <ChevronDown size={14} className="opacity-30" />;
    return sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const statusBadge = (flight: Flight) => {
    if (!flight.hasOrder) return null;
    
    // Show A/C REG changed warning if registration differs from order
    if (flight.acRegChanged) {
      return (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-400 dark:border dark:border-orange-500/30">
            REG: {flight.orderAcReg} → {flight.acRegistration}
          </span>
        </div>
      );
    }
    
    const colors: Record<string, string> = {
      PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30",
      SENT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30",
      UPDATED: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400 dark:border dark:border-sky-500/30",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30",
    };
    const status = flight.latestOrderStatus || "PENDING";
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || ""}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Flight Board
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 font-mono">
            {filtered.length} of {flights.length} flights &bull; Select a flight to create a fuel order
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
              showFilters || activeFilterCount > 0
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-emerald-400"
                : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            }`}
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-emerald-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800/60 rounded-lg p-0.5 border border-transparent dark:border-gray-700">
            <button
              onClick={() => setBoardTimeFormat("local")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                boardTimeFormat === "local"
                  ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Clock size={13} />
              Local
            </button>
            <button
              onClick={() => setBoardTimeFormat("utc")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                boardTimeFormat === "utc"
                  ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Globe size={13} />
              UTC
            </button>
          </div>
          <button
            onClick={syncFlights}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 shadow-lg shadow-emerald-600/20"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Search size={14} />
              Filter Flights
            </span>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
              >
                <X size={12} />
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-500 mb-1 uppercase tracking-wider">
                <Calendar size={12} className="inline mr-1" />
                Departure Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-500 mb-1 uppercase tracking-wider">
                Flight Number
              </label>
              <input
                type="text"
                placeholder="e.g. PVL232, PVL245"
                value={filterFlightNo}
                onChange={(e) => setFilterFlightNo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-500 mb-1 uppercase tracking-wider">
                Registration
              </label>
              <input
                type="text"
                placeholder="e.g. C-GWEN, C-FABC"
                value={filterReg}
                onChange={(e) => setFilterReg(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900/80 rounded-xl shadow-sm dark:shadow-2xl dark:shadow-black/30 border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                {[
                  { key: "flightNumber", label: "Flight" },
                  { key: "acRegistration", label: "Registration" },
                  { key: "acType", label: "AC Type" },
                  { key: "deptIcao", label: "Dept ICAO" },
                  { key: "arrivalIcao", label: "Arr ICAO" },
                  { key: "deptTime", label: boardTimeFormat === "utc" ? "Dept Time (UTC)" : "Dept Time (Local)" },
                  { key: "fuelLoad", label: "Fuel Load" },
                  { key: "dispatcher", label: "Dispatcher" },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key as keyof Flight)}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-all duration-200 ${
                      sortField === key
                        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5"
                        : "text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <SortIcon field={key as keyof Flight} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500 dark:text-gray-500">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-emerald-500" />
                    <span className="font-mono text-sm">Loading flights...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500 dark:text-gray-500">
                    {flights.length === 0
                      ? 'No flights loaded. Click "Sync Flights" to fetch from the Flight Data API.'
                      : "No flights match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((flight) => (
                  <tr
                    key={flight.id}
                    className="av-row hover:bg-gray-50 dark:hover:bg-emerald-500/[0.04] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-bold font-mono text-gray-900 dark:text-white">
                      {flight.flightNumber}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300">
                      {flight.acRegistration}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-400">
                      {flight.acType}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-teal-700 dark:text-cyan-400">
                      {flight.deptIcao}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-indigo-700 dark:text-indigo-400">
                      {flight.arrivalIcao || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300">
                      {formatDeptTime(flight.deptTime, flight.deptIcao)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300">
                      {flight.fuelLoad != null ? (
                        <span className="dark:text-emerald-400 font-medium">{flight.fuelLoad.toLocaleString()} LBS</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-400">
                      {flight.dispatcher || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {statusBadge(flight)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Generate button - opens modal */}
                        <button
                          onClick={() => {
                            setSelectedFlight(flight);
                            setShowOrderModal(true);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            flight.acRegChanged
                              ? "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20 dark:border dark:border-orange-500/30"
                              : flight.hasOrder
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 dark:border dark:border-amber-500/30"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-700 dark:border dark:border-gray-600"
                          }`}
                        >
                          {flight.acRegChanged ? (
                            <>
                              <AlertTriangle size={14} />
                              Verify
                            </>
                          ) : flight.hasOrder ? (
                            <>
                              <Edit3 size={14} />
                              Update
                            </>
                          ) : (
                            <>
                              <FileText size={14} />
                              Generate
                            </>
                          )}
                        </button>
                        {/* Order button - auto-email (enabled via settings) */}
                        {!flight.hasOrder && (
                          <button
                            onClick={() => {
                              if (!autoEmailEnabled) {
                                addToast("info", "Auto-email is disabled. Enable it in Settings.");
                                return;
                              }
                              // TODO: Implement auto-email order
                              addToast("info", "Auto-email order coming soon");
                            }}
                            disabled={!autoEmailEnabled}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                              autoEmailEnabled
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 dark:border dark:border-emerald-500/30"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border dark:border-gray-700"
                            }`}
                            title={autoEmailEnabled ? "Send order via email" : "Enable auto-email in Settings"}
                          >
                            <Mail size={14} />
                            Order
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedFlight && (
        <OrderModal
          flight={selectedFlight}
          isUpdate={selectedFlight.hasOrder}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedFlight(null);
          }}
          onSuccess={() => {
            setShowOrderModal(false);
            setSelectedFlight(null);
            fetchFlights();
          }}
        />
      )}
    </div>
  );
}
