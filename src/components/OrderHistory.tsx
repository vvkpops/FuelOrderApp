"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  RotateCcw,
} from "lucide-react";
import { useToast } from "./Toast";

interface Order {
  id: string;
  flightNumber: string;
  acRegistration: string;
  acType: string;
  deptIcao: string;
  deptTime: string;
  fuelLoad: number | null;
  dispatcher: string;
  status: string;
  sentAt: string | null;
  sentTo: string[];
  ccTo: string[];
  emailSubject: string | null;
  emailBody: string | null;
  isUpdate: boolean;
  updateReason: string | null;
  createdAt: string;
}

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch {
      addToast("error", "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, addToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const exportCSV = () => {
    window.open("/api/orders/export", "_blank");
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sorted = [...orders].sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[sortField] ?? "";
    const bVal = (b as unknown as Record<string, unknown>)[sortField] ?? "";
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30",
    SENT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30",
    UPDATED: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400 dark:border dark:border-sky-500/30",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30",
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronDown size={14} className="opacity-30" />;
    return sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Order History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 font-mono">
            {sorted.length} of {orders.length} orders
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none w-56"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="UPDATED">Updated</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 text-sm font-medium shadow-lg shadow-emerald-600/20"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Order Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-emerald-500 mr-3" />
          <span className="text-gray-500 dark:text-gray-400">Loading orders...</span>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white dark:bg-gray-900/80 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 py-16 text-center text-gray-500 dark:text-gray-500">
          No orders found.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-900/80 rounded-xl shadow-sm dark:shadow-lg dark:shadow-black/20 border border-gray-200 dark:border-gray-800 overflow-hidden transition-all hover:shadow-md dark:hover:border-gray-700"
            >
              {/* Card Header Row */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-6 flex-wrap min-w-0">
                  {/* Flight & Registration */}
                  <div className="min-w-[120px]">
                    <p className="text-sm font-bold text-gray-900 dark:text-white font-mono flex items-center gap-1.5">
                      {order.flightNumber}
                      {order.isUpdate && <RotateCcw size={12} className="text-sky-500" />}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">{order.acRegistration}</p>
                  </div>

                  {/* Station */}
                  <div className="min-w-[60px]">
                    <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wide">Station</p>
                    <p className="text-sm font-mono font-medium text-teal-700 dark:text-cyan-400">{order.deptIcao}</p>
                  </div>

                  {/* Fuel Load */}
                  <div className="min-w-[80px]">
                    <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wide">Fuel</p>
                    <p className="text-sm font-medium font-mono text-gray-800 dark:text-emerald-400">
                      {order.fuelLoad ? `${order.fuelLoad.toLocaleString()} LBS` : "N/A"}
                    </p>
                  </div>

                  {/* Dispatcher */}
                  <div className="min-w-[60px]">
                    <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wide">Dispatcher</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-300">{order.dispatcher}</p>
                  </div>

                  {/* Sent At */}
                  <div className="min-w-[140px]">
                    <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wide">Sent</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {order.sentAt ? new Date(order.sentAt).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || ""}`}>
                    {order.status}
                  </span>
                  {/* Expand Arrow */}
                  {expandedId === order.id ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === order.id && (
                <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 px-5 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wide mb-1">Aircraft Type</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-300">{order.acType}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wide mb-1">Departure Time</p>
                      <p className="text-sm font-medium font-mono text-gray-800 dark:text-gray-300">
                        {new Date(order.deptTime).toUTCString().slice(0, -4)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wide mb-1">Created At</p>
                      <p className="text-sm font-medium font-mono text-gray-800 dark:text-gray-300">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wide mb-1">Sent To</p>
                      <p className="text-sm text-gray-800 dark:text-gray-300 break-all">
                        {order.sentTo.join(", ") || "—"}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wide mb-1">CC</p>
                      <p className="text-sm text-gray-800 dark:text-gray-300 break-all">
                        {order.ccTo.join(", ") || "—"}
                      </p>
                    </div>
                    {order.updateReason && (
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-sky-200 dark:border-sky-500/30">
                        <p className="text-xs text-sky-500 uppercase tracking-wide mb-1">Update Reason</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-300">{order.updateReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Email Body */}
                  {order.emailBody && (
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                          Email Body
                        </p>
                      </div>
                      <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap p-4">
                        {order.emailBody}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
