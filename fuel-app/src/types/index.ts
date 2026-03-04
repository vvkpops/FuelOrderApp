// Shared types used across client and server

export interface FlightData {
  id: string;
  flightNumber: string;
  acRegistration: string;
  acType: string;
  deptIcao: string;
  deptTime: string;
  arrivalIcao: string | null;
  arrivalTime: string | null;
  alternateIcao: string | null;
  eta: string | null;
  fuelLoad: number | null;
  dispatcher: string | null;
  ingestedAt: string;
}

export interface FuelOrderData {
  id: string;
  flightId: string;
  flightNumber: string;
  acRegistration: string;
  acType: string;
  deptIcao: string;
  deptTime: string;
  fuelLoad: number | null;
  dispatcher: string;
  status: "PENDING" | "SENT" | "UPDATED" | "CANCELLED";
  sentAt: string | null;
  sentTo: string[];
  ccTo: string[];
  emailSubject: string | null;
  emailBody: string | null;
  isUpdate: boolean;
  originalOrderId: string | null;
  updateReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StationData {
  id: string;
  icaoCode: string;
  name: string | null;
  emails: string[];
  ccEmails: string[];
  isActive: boolean;
}

export interface SettingData {
  id: string;
  key: string;
  value: string;
}

// Form types
export interface OrderFormData {
  flightId: string;
  flightNumber: string;
  acRegistration: string;
  acType: string;
  deptIcao: string;
  deptTime: string;
  fuelLoad: number | null;
  dispatcher: string;
  isUpdate?: boolean;
  originalOrderId?: string;
  updateReason?: string;
}

export interface StationFormData {
  icaoCode: string;
  name?: string;
  emails: string[];
  ccEmails?: string[];
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
