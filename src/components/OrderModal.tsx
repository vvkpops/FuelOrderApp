"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { X, AlertTriangle, Eye, Plus, FileText } from "lucide-react";
import { useToast } from "./Toast";
import { formatEmailSubject, formatEmailBody, generateMailtoUrl } from "@/lib/email";

interface Flight {
  id: string;
  flightNumber: string;
  acRegistration: string;
  acType: string;
  deptIcao: string;
  deptTime: string;
  fuelLoad: number | null;
  dispatcher: string | null;
}

interface OrderModalProps {
  flight: Flight;
  isUpdate?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderModal({ flight, isUpdate, onClose, onSuccess }: OrderModalProps) {
  const [form, setForm] = useState({
    flightNumber: flight.flightNumber,
    acRegistration: flight.acRegistration,
    acType: flight.acType,
    deptIcao: flight.deptIcao,
    deptTime: flight.deptTime,
    fuelLoad: flight.fuelLoad?.toString() || "",
    dispatcher: flight.dispatcher || "",
    updateReason: "",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [defaultDispatcher, setDefaultDispatcher] = useState("");
  const [timeFormat, setTimeFormat] = useState<"local" | "utc">("local");
  const [stationTimezone, setStationTimezone] = useState<string | null>(null);
  const [showStationSetup, setShowStationSetup] = useState(false);
  const [stationEmail, setStationEmail] = useState("");
  const [stationCc, setStationCc] = useState("");
  const [savingStation, setSavingStation] = useState(false);
  const { addToast } = useToast();

  // Look up station timezone from airports database
  useEffect(() => {
    if (form.deptIcao.length === 4) {
      fetch(`/api/airports?q=${encodeURIComponent(form.deptIcao)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data && !Array.isArray(data.data)) {
            setStationTimezone(data.data.timezone || null);
          } else {
            setStationTimezone(null);
          }
        })
        .catch(() => setStationTimezone(null));
    }
  }, [form.deptIcao]);

  // Load default dispatcher from settings
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data.defaultDispatcher) {
          setDefaultDispatcher(data.data.defaultDispatcher);
          if (!form.dispatcher) {
            setForm((prev) => ({ ...prev, dispatcher: data.data.defaultDispatcher }));
          }
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Compute a display string for the departure time based on toggle
  const formattedDeptTime = (() => {
    if (!form.deptTime) return "";
    const utcDate = new Date(form.deptTime);
    if (timeFormat === "utc") {
      return utcDate.toUTCString().slice(0, -4) + " UTC";
    }
    if (!stationTimezone) {
      return utcDate.toUTCString().slice(0, -4) + " UTC";
    }
    try {
      const localStr = utcDate.toLocaleString("en-US", {
        timeZone: stationTimezone,
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const tzAbbr = utcDate
        .toLocaleString("en-US", {
          timeZone: stationTimezone,
          timeZoneName: "short",
        })
        .split(" ")
        .pop();
      return `${localStr} ${tzAbbr}`;
    } catch {
      return utcDate.toUTCString().slice(0, -4) + " UTC";
    }
  })();

  const emailSubject = formatEmailSubject({
    flightNumber: form.flightNumber,
    deptIcao: form.deptIcao,
    acRegistration: form.acRegistration,
    isUpdate,
  });

  const emailBody = formatEmailBody({
    flightNumber: form.flightNumber,
    acRegistration: form.acRegistration,
    acType: form.acType,
    deptIcao: form.deptIcao,
    deptTime: new Date(form.deptTime).toUTCString(),
    fuelLoad: form.fuelLoad ? parseFloat(form.fuelLoad) : null,
    dispatcher: form.dispatcher || defaultDispatcher,
    isUpdate,
    updateReason: form.updateReason,
    timezone: timeFormat === "local" ? stationTimezone : null,
  });

  const handleSend = async () => {
    if (!form.dispatcher) {
      addToast("warning", "Please enter dispatcher initials");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightId: flight.id,
          flightNumber: form.flightNumber,
          acRegistration: form.acRegistration,
          acType: form.acType,
          deptIcao: form.deptIcao.toUpperCase(),
          deptTime: form.deptTime,
          fuelLoad: form.fuelLoad ? parseFloat(form.fuelLoad) : null,
          dispatcher: form.dispatcher,
          isUpdate,
          updateReason: form.updateReason || undefined,
          timeFormat,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Open default mail app
        if (data.mailtoUrl) {
          window.open(data.mailtoUrl, "_self");
        }
        addToast("success", `Order generated — opening email client`);
        onSuccess();
      } else if (data.error === "DUPLICATE_WARNING") {
        addToast("warning", data.message);
      } else if (data.error === "NO_STATION_EMAIL") {
        setShowStationSetup(true);
      } else {
        addToast("error", data.error || "Failed to create order");
      }
    } catch {
      addToast("error", "Failed to connect to server");
    } finally {
      setSending(false);
    }
  };

  const handleSaveStation = async () => {
    if (!stationEmail.trim()) {
      addToast("warning", "Please enter at least one email address");
      return;
    }
    setSavingStation(true);
    try {
      const emails = stationEmail.split(",").map((e) => e.trim()).filter(Boolean);
      const ccEmails = stationCc ? stationCc.split(",").map((e) => e.trim()).filter(Boolean) : [];

      // Look up airport name and timezone
      let name = "";
      let timezone = "";
      try {
        const airportRes = await fetch(`/api/airports?q=${encodeURIComponent(form.deptIcao)}`);
        const airportData = await airportRes.json();
        if (airportData.success && airportData.data && !Array.isArray(airportData.data)) {
          name = airportData.data.name || "";
          timezone = airportData.data.timezone || "";
        }
      } catch { /* ignore */ }

      const res = await fetch("/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          icaoCode: form.deptIcao.toUpperCase(),
          name,
          timezone,
          emails,
          ccEmails,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("success", `Station ${form.deptIcao} saved — you can now send the order`);
        setShowStationSetup(false);
      } else {
        addToast("error", data.error || "Failed to save station");
      }
    } catch {
      addToast("error", "Failed to save station");
    } finally {
      setSavingStation(false);
    }
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl dark:shadow-black/50 border border-slate-200 dark:border-slate-700/60 transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700/60">
                  <div>
                    <DialogTitle as="h2" className="text-lg font-bold text-slate-900 dark:text-white">
                      {isUpdate ? "Update Fuel Order" : "Generate Fuel Order"}
                    </DialogTitle>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-0.5 font-mono">
                      {form.flightNumber} • {form.deptIcao} • {form.acRegistration}
                    </p>
                  </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {isUpdate && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                This will send an updated fuel order. The previous order will be marked as superseded.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Flight Number
              </label>
              <input
                type="text"
                value={form.flightNumber}
                onChange={(e) => handleChange("flightNumber", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Registration
              </label>
              <input
                type="text"
                value={form.acRegistration}
                onChange={(e) => handleChange("acRegistration", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                AC Type
              </label>
              <input
                type="text"
                value={form.acType}
                onChange={(e) => handleChange("acType", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Dept ICAO
              </label>
              <input
                type="text"
                value={form.deptIcao}
                onChange={(e) => handleChange("deptIcao", e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200 font-mono"
                maxLength={4}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Departure Time
              </label>
              <input
                type="datetime-local"
                value={form.deptTime ? form.deptTime.slice(0, 16) : ""}
                onChange={(e) => handleChange("deptTime", new Date(e.target.value).toISOString())}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200"
              />
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="local"
                    checked={timeFormat === "local"}
                    onChange={() => setTimeFormat("local")}
                    className="accent-sky-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Local{stationTimezone ? ` (${stationTimezone.split("/").pop()?.replace(/_/g, " ")})` : ""}
                  </span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="utc"
                    checked={timeFormat === "utc"}
                    onChange={() => setTimeFormat("utc")}
                    className="accent-sky-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">UTC</span>
                </label>
              </div>
              {formattedDeptTime && (
                <p className="mt-1.5 text-xs font-medium font-mono text-sky-600 dark:text-sky-400">
                  → {formattedDeptTime}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Fuel Load (LBS) {!form.fuelLoad && <span className="text-amber-500">*</span>}
              </label>
              <input
                type="number"
                value={form.fuelLoad}
                onChange={(e) => handleChange("fuelLoad", e.target.value)}
                placeholder="Enter fuel..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Dispatcher *
              </label>
              <input
                type="text"
                value={form.dispatcher}
                onChange={(e) => handleChange("dispatcher", e.target.value)}
                placeholder="Initials..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200"
              />
            </div>
            {isUpdate && (
              <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Update Reason
              </label>
              <input
                type="text"
                value={form.updateReason}
                onChange={(e) => handleChange("updateReason", e.target.value)}
                placeholder="e.g. AC swap, fuel change..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200"
                />
              </div>
            )}
          </div>
        </div>

        {/* Inline Station Setup */}
        {showStationSetup && (
          <div className="mx-6 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={16} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  No email configured for {form.deptIcao}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  Add station email below, then try sending again.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                  To Email(s) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={stationEmail}
                  onChange={(e) => setStationEmail(e.target.value)}
                  placeholder="fuel@handler.com, ops@handler.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                  CC Email(s)
                </label>
                <input
                  type="text"
                  value={stationCc}
                  onChange={(e) => setStationCc(e.target.value)}
                  placeholder="optional cc addresses..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200"
                />
              </div>
              <button
                onClick={handleSaveStation}
                disabled={savingStation || !stationEmail.trim()}
                className="flex items-center gap-2 px-4 py-2 av-btn-success rounded-lg text-sm disabled:opacity-50"
              >
                <Plus size={14} />
                {savingStation ? "Saving..." : `Save Station ${form.deptIcao}`}
              </button>
            </div>
          </div>
        )}

        {/* Email Preview */}
        {showPreview && (
          <div className="mx-6 mb-4 av-panel p-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Email Preview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">Subject:</p>
            <p className="text-sm font-mono text-slate-900 dark:text-white mb-3">{emailSubject}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">Body:</p>
            <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
              {emailBody}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-950/50 rounded-b-2xl">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Eye size={16} />
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !form.dispatcher}
              className="flex items-center gap-2 px-5 py-2 av-btn-primary rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={16} />
              {sending ? "Processing..." : isUpdate ? "Generate Update" : "Generate Order"}
            </button>
          </div>
        </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
