import {
  Clock3,
  Edit3,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Timer,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import { authFetch } from "../lib/api";
import { PageSkeleton } from "../components/ui/PageSkeleton";

export type FacilitySettings = {
  id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  price_per_slot: string;
  slot_duration: number;
  opening_time: string;
  closing_time: string;
  status: string;
  facebook: string;
  instagram: string;
  twitter: string;
  tiktok: string;
  created_at: string;
  updated_at: string;
};
type FutsalResponse = {
  success: boolean;
  message: string;
  data: FacilitySettings;
};

export const facilitySettings: FacilitySettings = {
  id: "",
  name: "",
  description: "",
  location: "",
  address: "",
  phone: "",
  email: "",
  price_per_slot: "",
  slot_duration: 0,
  opening_time: "",
  closing_time: "",
  status: "ACTIVE",
  facebook: "",
  instagram: "",
  twitter: "",
  tiktok: "",
  created_at: "",
  updated_at: "",
};

export function SettingsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<FacilitySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    authFetch(`${apiBase}/api/v1/admin/futsal/`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success)
          throw new Error(
            body?.message || body?.detail || "Unable to load futsal settings.",
          );
        return body as FutsalResponse;
      })
      .then((response) => {
        if (active) setSettings(response.data);
      })
      .catch((error: Error) => {
        if (active) showToast(error.message, "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  if (loading)
    return (
      <PageSkeleton
        variant="form"
        eyebrow="Facility management"
        title="Settings"
        description="Manage your futsal facility details."
      />
    );
  if (!settings)
    return (
      <div className="settings-page">
        <div className="empty-state">Futsal settings could not be loaded.</div>
      </div>
    );

  return (
    <div className="settings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace configuration</p>
          <h1>Settings</h1>
          <p className="muted">View and manage your facility information.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => navigate("/settings/edit")}
        >
          <Edit3 size={16} />
          Edit settings
        </button>
      </div>
      <section className="settings-card">
        <div className="settings-title">
          <div className="facility-mark">N</div>
          <div>
            <h2>{settings.name}</h2>
            <p>{settings.description}</p>
          </div>
          <span className="status-badge">
            <span className="status-dot" />
            {settings.status}
          </span>
        </div>
        <div className="settings-section">
          <h3>Contact information</h3>
          <div className="settings-grid">
            <SettingItem
              icon={<MapPin size={17} />}
              label="Location"
              value={settings.location}
            />
            <SettingItem
              icon={<MapPin size={17} />}
              label="Address"
              value={settings.address}
            />
            <SettingItem
              icon={<Phone size={17} />}
              label="Phone"
              value={settings.phone}
            />
            <SettingItem
              icon={<Mail size={17} />}
              label="Email"
              value={settings.email}
            />
          </div>
        </div>
        <div className="settings-section">
          <h3>Slot configuration</h3>
          <div className="settings-grid three">
            <SettingItem
              icon={<WalletCards size={17} />}
              label="Price per slot"
              value={formatPrice(settings.price_per_slot)}
            />
            <SettingItem
              icon={<Timer size={17} />}
              label="Slot duration"
              value={`${settings.slot_duration} minutes`}
            />
            <SettingItem
              icon={<Clock3 size={17} />}
              label="Opening hours"
              value={`${formatTime(settings.opening_time)} – ${formatTime(settings.closing_time)}`}
            />
          </div>
        </div>
        <div className="settings-section">
          <h3>Social media</h3>
          <div className="settings-grid">
            <SettingItem
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              }
              label="Facebook"
              value={settings.facebook}
            />
            <SettingItem
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              }
              label="Instagram"
              value={settings.instagram}
            />
            <SettingItem
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                </svg>
              }
              label="Twitter"
              value={settings.twitter}
            />
            <SettingItem
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                </svg>
              }
              label="TikTok"
              value={settings.tiktok}
            />
          </div>
        </div>
        <div className="settings-section timestamps">
          <div>
            <span>Created at</span>
            <strong>{formatDate(settings.created_at)}</strong>
          </div>
          <div>
            <span>Last updated</span>
            <strong>{formatDate(settings.updated_at)}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function SettingItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="setting-item">
      <div className="setting-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value || "—"}</strong>
      </div>
    </div>
  );
}
function formatPrice(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `NPR ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";
}
function formatTime(value: string) {
  const [hour = "", minute = ""] = value.split(":");
  const hourNumber = Number(hour);
  if (!Number.isFinite(hourNumber) || !minute) return "—";
  return `${hourNumber % 12 || 12}:${minute} ${hourNumber >= 12 ? "PM" : "AM"}`;
}
function formatDate(value: string) {
  return value
    ? new Date(value).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
}
