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
