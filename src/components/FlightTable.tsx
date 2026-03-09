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
        <span className="av-badge av-badge-amber text-[10px]">
          {flight.orderAcReg}→{flight.acRegistration}
        </span>
      );
    }
    
    const colors: Record<string, string> = {
      PENDING: "av-badge-amber",
      GENERATED: "av-badge-blue",
      SENT: "av-badge-green",
      UPDATED: "av-badge-blue",
      CANCELLED: "av-badge-red",
    };
    const status = flight.latestOrderStatus || "PENDING";
    const displayStatus = status === "GENERATED" ? "Generated" : status === "SENT" ? "Sent" : status;
    return (
      <span className={`av-badge ${colors[status] || ""}`}>
        {displayStatus}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Flight Board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
            <span className="font-mono">{filtered.length}</span> of <span className="font-mono">{flights.length}</span> flights
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
              showFilters || activeFilterCount > 0
                ? "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-400"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-sky-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/60 rounded-lg p-0.5 border border-transparent dark:border-slate-700">
            <button
              onClick={() => setBoardTimeFormat("local")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                boardTimeFormat === "local"
                  ? "bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Clock size={12} />
              Local
            </button>
            <button
              onClick={() => setBoardTimeFormat("utc")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                boardTimeFormat === "utc"
                  ? "bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Globe size={12} />
              UTC
            </button>
          </div>
          <button
            onClick={syncFlights}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 av-btn-primary rounded-lg text-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="mb-4 p-4 av-panel">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
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
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-500 mb-1 uppercase tracking-wider">
                <Calendar size={11} className="inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-500 mb-1 uppercase tracking-wider">
                Flight #
              </label>
              <input
                type="text"
                placeholder="e.g. PVL232, PVL245"
                value={filterFlightNo}
                onChange={(e) => setFilterFlightNo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-500 mb-1 uppercase tracking-wider">
                Registration
              </label>
              <input
                type="text"
                placeholder="e.g. C-GWEN"
                value={filterReg}
                onChange={(e) => setFilterReg(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="av-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="av-table min-w-[1000px]">
            <colgroup>
              <col className="w-[90px]" />   {/* Flight */}
              <col className="w-[100px]" />  {/* Registration */}
              <col className="w-[80px]" />   {/* AC Type */}
              <col className="w-[70px]" />   {/* Dept */}
              <col className="w-[70px]" />   {/* Arr */}
              <col className="w-[140px]" />  {/* Dept Time */}
              <col className="w-[100px]" />  {/* Fuel Load */}
              <col className="w-[80px]" />   {/* Dispatcher */}
              <col className="w-[100px]" />  {/* Status */}
              <col className="w-[170px]" />  {/* Action */}
            </colgroup>
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/50">
                {[
                  { key: "flightNumber", label: "Flight" },
                  { key: "acRegistration", label: "Reg" },
                  { key: "acType", label: "Type" },
                  { key: "deptIcao", label: "Dept" },
                  { key: "arrivalIcao", label: "Arr" },
                  { key: "deptTime", label: boardTimeFormat === "utc" ? "Time (Z)" : "Time (L)" },
                  { key: "fuelLoad", label: "Fuel" },
                  { key: "dispatcher", label: "Disp" },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key as keyof Flight)}
                    className={`px-3 py-3 text-left cursor-pointer select-none transition-all duration-200 ${
                      sortField === key
                        ? "text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-500/5"
                        : "text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <SortIcon field={key as keyof Flight} />
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-left text-slate-500 dark:text-slate-500">
                  Status
                </th>
                <th className="px-3 py-3 text-right text-slate-500 dark:text-slate-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-slate-500 dark:text-slate-500">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-sky-500" />
                    <span className="text-sm">Loading flights...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-slate-500 dark:text-slate-500">
                    {flights.length === 0
                      ? 'No flights loaded. Click "Refresh" to fetch from the Flight Data API.'
                      : "No flights match your filters."}
                  </td>
                </tr>
              ) : (
                filtered.map((flight) => (
                  <tr
                    key={flight.id}
                    className="hover:bg-slate-50 dark:hover:bg-sky-500/[0.03] transition-colors"
                  >
                    <td className="px-3 py-2.5 text-sm font-bold font-mono text-slate-900 dark:text-white truncate">
                      {flight.flightNumber}
                    </td>
                    <td className="px-3 py-2.5 text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                      {flight.acRegistration}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400 truncate">
                      {flight.acType}
                    </td>
                    <td className="px-3 py-2.5 text-sm font-mono font-semibold text-sky-700 dark:text-cyan-400">
                      {flight.deptIcao}
                    </td>
                    <td className="px-3 py-2.5 text-sm font-mono font-semibold text-indigo-700 dark:text-indigo-400">
                      {flight.arrivalIcao || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-sm font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDeptTime(flight.deptTime, flight.deptIcao)}
                    </td>
                    <td className="px-3 py-2.5 text-sm font-mono">
                      {flight.fuelLoad != null ? (
                        <span className="av-fuel">{flight.fuelLoad.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400 truncate">
                      {flight.dispatcher || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-sm">
                      {statusBadge(flight)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Generate button - opens modal */}
                        <button
                          onClick={() => {
                            setSelectedFlight(flight);
                            setShowOrderModal(true);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                            flight.acRegChanged
                              ? "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30"
                              : flight.hasOrder
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600"
                          }`}
                        >
                          {flight.acRegChanged ? (
                            <>
                              <AlertTriangle size={12} />
                              Verify
                            </>
                          ) : flight.hasOrder ? (
                            <>
                              <Edit3 size={12} />
                              Update
                            </>
                          ) : (
                            <>
                              <FileText size={12} />
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
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                              autoEmailEnabled
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600 border border-slate-200 dark:border-slate-700"
                            }`}
                            title={autoEmailEnabled ? "Send order via email" : "Enable auto-email in Settings"}
                          >
                            <Mail size={12} />
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
