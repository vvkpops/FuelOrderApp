"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Save,
  Trash2,
  Edit3,
  X,
  RefreshCw,
} from "lucide-react";
import { useToast } from "./Toast";

interface Station {
  id: string;
  icaoCode: string;
  name: string | null;
  timezone: string | null;
  emails: string[];
  ccEmails: string[];
  isActive: boolean;
}


export function StationSettings() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    icaoCode: "",
    name: "",
    timezone: "",
    emails: "",
    ccEmails: "",
  });
  const { addToast } = useToast();

  // Auto-lookup airport data when ICAO code changes
  const lookupAirport = useCallback(async (icao: string) => {
    if (icao.length < 3) return;
    try {
      const res = await fetch(`/api/airports?q=${encodeURIComponent(icao)}`);
      const data = await res.json();
      if (data.success && data.data && !Array.isArray(data.data)) {
        setForm((prev) => ({
          ...prev,
          name: prev.name || data.data.name || "",
          timezone: data.data.timezone || prev.timezone,
        }));
      }
    } catch {
      // silent
    }
  }, []);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stations");
      const data = await res.json();
      if (data.success) setStations(data.data);
    } catch {
      addToast("error", "Failed to fetch stations");
    } finally {
      setLoading(false);
    }
  }, [addToast]);


  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const resetForm = () => {
    setForm({ icaoCode: "", name: "", timezone: "", emails: "", ccEmails: "" });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleAdd = async () => {
    if (!form.icaoCode || !form.emails) {
      addToast("warning", "ICAO code and at least one email required");
      return;
    }

    try {
      const res = await fetch("/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          icaoCode: form.icaoCode.toUpperCase(),
          name: form.name || null,
          timezone: form.timezone || null,
          emails: form.emails.split(",").map((e) => e.trim()).filter(Boolean),
          ccEmails: form.ccEmails ? form.ccEmails.split(",").map((e) => e.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("success", data.message);
        resetForm();
        fetchStations();
      } else {
        addToast("error", data.error);
      }
    } catch {
      addToast("error", "Failed to add station");
    }
  };

  const handleUpdate = async (station: Station) => {
    try {
      const res = await fetch(`/api/stations/${station.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          icaoCode: form.icaoCode.toUpperCase(),
          name: form.name || null,
          timezone: form.timezone || null,
          emails: form.emails.split(",").map((e) => e.trim()).filter(Boolean),
          ccEmails: form.ccEmails ? form.ccEmails.split(",").map((e) => e.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("success", data.message);
        resetForm();
        fetchStations();
      } else {
        addToast("error", data.error);
      }
    } catch {
      addToast("error", "Failed to update station");
    }
  };

  const handleDelete = async (station: Station) => {
    if (!confirm(`Delete station ${station.icaoCode}?`)) return;
    try {
      const res = await fetch(`/api/stations/${station.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        addToast("success", `Station ${station.icaoCode} deleted`);
        fetchStations();
      } else {
        addToast("error", data.error);
      }
    } catch {
      addToast("error", "Failed to delete station");
    }
  };

  const startEdit = (station: Station) => {
    setEditingId(station.id);
    setForm({
      icaoCode: station.icaoCode,
      name: station.name || "",
      timezone: station.timezone || "",
      emails: station.emails.join(", "),
      ccEmails: station.ccEmails.join(", "),
    });
    setShowAddForm(false);
  };


  return (
    <div className="space-y-8">
      {/* App Settings */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
          Configure station emails and application defaults
        </p>


      </div>

      {/* Station Configuration */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Station Email Configuration
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStations}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 text-sm font-medium shadow-lg shadow-emerald-600/20"
            >
              <Plus size={16} />
              Add Station
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {editingId ? "Edit Station" : "Add New Station"}
              </h3>
              <button onClick={resetForm} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                  ICAO Code *
                </label>
                <input
                  type="text"
                  value={form.icaoCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setForm((p) => ({ ...p, icaoCode: val }));
                    if (val.length === 4) lookupAirport(val);
                  }}
                  placeholder="e.g. KJFK"
                  maxLength={4}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Station Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. John F. Kennedy International"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Timezone
                </label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Select timezone...</option>
                  <optgroup label="North America">
                    <option value="America/St_Johns">America/St_Johns (NST/NDT)</option>
                    <option value="America/Halifax">America/Halifax (AST/ADT)</option>
                    <option value="America/Moncton">America/Moncton (AST/ADT)</option>
                    <option value="America/Toronto">America/Toronto (EST/EDT)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                    <option value="America/Winnipeg">America/Winnipeg (CST/CDT)</option>
                    <option value="America/Regina">America/Regina (CST)</option>
                    <option value="America/Edmonton">America/Edmonton (MST/MDT)</option>
                    <option value="America/Denver">America/Denver (MST/MDT)</option>
                    <option value="America/Vancouver">America/Vancouver (PST/PDT)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                    <option value="America/Anchorage">America/Anchorage (AKST/AKDT)</option>
                    <option value="America/Whitehorse">America/Whitehorse (MST)</option>
                    <option value="America/Yellowknife">America/Yellowknife (MST/MDT)</option>
                    <option value="America/Iqaluit">America/Iqaluit (EST/EDT)</option>
                    <option value="America/Goose_Bay">America/Goose_Bay (AST/ADT)</option>
                    <option value="Pacific/Honolulu">Pacific/Honolulu (HST)</option>
                  </optgroup>
                  <optgroup label="Caribbean / Central America">
                    <option value="America/Nassau">America/Nassau (EST/EDT)</option>
                    <option value="America/Jamaica">America/Jamaica (EST)</option>
                    <option value="America/Puerto_Rico">America/Puerto_Rico (AST)</option>
                    <option value="America/Barbados">America/Barbados (AST)</option>
                    <option value="America/Curacao">America/Curacao (AST)</option>
                    <option value="America/Panama">America/Panama (EST)</option>
                    <option value="America/Mexico_City">America/Mexico_City (CST/CDT)</option>
                    <option value="America/Cancun">America/Cancun (EST)</option>
                  </optgroup>
                  <optgroup label="Europe">
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                    <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
                    <option value="Europe/Amsterdam">Europe/Amsterdam (CET/CEST)</option>
                    <option value="Europe/Zurich">Europe/Zurich (CET/CEST)</option>
                    <option value="Europe/Rome">Europe/Rome (CET/CEST)</option>
                    <option value="Europe/Madrid">Europe/Madrid (CET/CEST)</option>
                    <option value="Europe/Lisbon">Europe/Lisbon (WET/WEST)</option>
                    <option value="Atlantic/Reykjavik">Atlantic/Reykjavik (GMT)</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="UTC">UTC</option>
                    <option value="Atlantic/Bermuda">Atlantic/Bermuda (AST/ADT)</option>
                    <option value="Atlantic/Azores">Atlantic/Azores (AZOT/AZOST)</option>
                    <option value="America/Bogota">America/Bogota (COT)</option>
                    <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Email(s) * <span className="text-gray-400 dark:text-gray-600 font-normal">comma-separated</span>
                </label>
                <input
                  type="text"
                  value={form.emails}
                  onChange={(e) => setForm((p) => ({ ...p, emails: e.target.value }))}
                  placeholder="fuel@station.com, backup@station.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                  CC Email(s) <span className="text-gray-400 dark:text-gray-600 font-normal">comma-separated</span>
                </label>
                <input
                  type="text"
                  value={form.ccEmails}
                  onChange={(e) => setForm((p) => ({ ...p, ccEmails: e.target.value }))}
                  placeholder="ops@airline.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (editingId) {
                  const station = stations.find((s) => s.id === editingId);
                  if (station) handleUpdate(station);
                } else {
                  handleAdd();
                }
              }}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 text-sm font-medium shadow-lg shadow-emerald-600/20"
            >
              <Save size={16} />
              {editingId ? "Update Station" : "Add Station"}
            </button>
          </div>
        )}

        {/* Stations Table */}
        <div className="bg-white dark:bg-gray-900/80 rounded-xl shadow-sm dark:shadow-lg dark:shadow-black/20 border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase">
                    ICAO
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase">
                    Timezone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase">
                    Email(s)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase">
                    CC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-500">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-emerald-500" />
                      Loading stations...
                    </td>
                  </tr>
                ) : stations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-500">
                      No stations configured. Add your first station above.
                    </td>
                  </tr>
                ) : (
                  stations.map((station) => (
                    <tr key={station.id} className="av-row hover:bg-gray-50 dark:hover:bg-emerald-500/[0.04]">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-teal-700 dark:text-cyan-400">
                        {station.icaoCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {station.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-500 font-mono">
                        {station.timezone || "UTC"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                        {station.emails.join(", ")}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-500 max-w-xs truncate">
                        {station.ccEmails.length > 0 ? station.ccEmails.join(", ") : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            station.isActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
                          }`}
                        >
                          {station.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(station)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(station)}
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
