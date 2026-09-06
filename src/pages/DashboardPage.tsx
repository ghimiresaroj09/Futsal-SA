import {
  ArrowUpRight,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import { authFetch } from "../lib/api";
import { PageSkeleton } from "../components/ui/PageSkeleton";

type Slot = {
  slot_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED";
  price: number;
};
type ScheduleItem = {
  booking_id: string;
  booking_reference: string;
  start_time: string;
  end_time: string;
  full_name: string;
  futsal_name: string;
  status: string;
  payment_status: string;
};
type DashboardData = {
  date: string;
  facility: {
    id: string;
    name: string;
    opening_time: string;
    closing_time: string;
  };
  operational_stats: {
    todays_bookings: number;
    upcoming_bookings: number;
    available_slots: number;
    total_slots: number;
    occupancy_percent: number;
    todays_revenue: number;
  };
  slot_availability: Slot[];
  todays_schedule: ScheduleItem[];
  facility_snapshot: {
    next_closed_date: string | null;
    next_available_slot: Pick<Slot, "date" | "start_time" | "end_time"> | null;
    peak_booking_window: Pick<Slot, "start_time" | "end_time"> | null;
    most_used_slot_duration: number | null;
  };
};
type DashboardResponse = {
  success: boolean;
  message: string;
  data: DashboardData;
};

const apiBase = import.meta.env.DEV
  ? "/backend"
  : import.meta.env.VITE_API_BASE_URL || "";
const formatCurrency = (value: number) =>
  `NPR ${Number(value).toLocaleString()}`;
const formatTime = (time: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`2000-01-01T${time}`));
const formatDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
const formatShortDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
const statusLabel = (status: string) =>
  status.charAt(0) + status.slice(1).toLowerCase();
const statusTone = (status: string) =>
  ({
    COMPLETED: "confirmed",
    CONFIRMED: "confirmed",
    RESCHEDULED: "pending",
    PENDING: "pending",
    CANCELLED: "cancelled",
  })[status] || "pending";
function getGreeting() {
  const hour = new Date().getHours();
  return hour < 12
    ? "Good Morning"
    : hour < 18
      ? "Good Afternoon"
      : "Good Evening";
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("current_user") || "null") as {
        full_name?: string;
      } | null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    authFetch(`${apiBase}/api/v1/dashboard/`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success)
          throw new Error(body?.message || "Unable to load dashboard.");
        return body as DashboardResponse;
      })
      .then((response) => {
        if (active) setDashboard(response.data);
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
        eyebrow="Workspace"
        title="Dashboard"
        description="Here’s the operational overview for your facility today."
      />
    );
  if (!dashboard)
    return (
      <div className="empty-page">
        <h1>Dashboard unavailable</h1>
        <p>
          We couldn’t load the latest operational data. Please refresh and try
          again.
        </p>
      </div>
    );

  const { operational_stats: stats, facility_snapshot: snapshot } = dashboard;
  const operations = [
    {
      label: "Today's bookings",
      value: String(stats.todays_bookings),
      note: `${stats.upcoming_bookings} upcoming today`,
      icon: CalendarCheck2,
      tone: "violet",
    },
    {
      label: "Available slots",
      value: String(stats.available_slots),
      note: `of ${stats.total_slots} slots today`,
      icon: Clock3,
      tone: "blue",
    },
    {
      label: "Occupancy today",
      value: `${stats.occupancy_percent}%`,
      note: `${stats.total_slots - stats.available_slots} occupied slots`,
      icon: UsersRound,
      tone: "green",
    },
    {
      label: "Today's revenue",
      value: formatCurrency(stats.todays_revenue),
      note: "Today's earnings",
      icon: CircleDollarSign,
      tone: "orange",
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{formatDate(dashboard.date)}</p>
          <h1>
            {getGreeting()},{" "}
            {currentUser?.full_name?.split(" ")[0] || "Administrator"}{" "}
            <span>✦</span>
          </h1>
          <p className="muted">
            Here’s the operational overview for {dashboard.facility.name} today.
          </p>
        </div>
        <div className="dashboard-actions">
          <button
            className="secondary-button"
            onClick={() => navigate("/bookings")}
          >
            <CalendarCheck2 size={16} />
            View bookings
          </button>
          <button
            className="primary-button"
            onClick={() => navigate("/slot-availability")}
          >
            <Plus size={16} />
            View availability
          </button>
        </div>
      </div>
      <section className="stats-grid dashboard-ops-stats">
        {operations.map(({ label, value, note, icon: Icon, tone }) => (
          <article className="stat-card dashboard-stat" key={label}>
            <div className={`stat-icon ${tone}`}>
              <Icon size={19} />
            </div>
            <div className="stat-top">
              <span>{label}</span>
              <MoreHorizontal size={18} />
            </div>
            <strong className="stat-value">{value}</strong>
            <div className="stat-change dashboard-note">
              <span>
                {label === "Occupancy today" && <ArrowUpRight size={12} />}
                {note}
              </span>
            </div>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Today’s slot availability</h2>
              <p className="muted">
                Live slot status across today’s operating hours
              </p>
            </div>
            <span className="today-badge">
              {formatShortDate(dashboard.date)}
            </span>
          </div>
          <div className="slot-timeline">
            {dashboard.slot_availability.map((slot) => (
              <div className="slot-time-cell" key={slot.slot_id}>
                <span
                  className={`slot-status-block ${slot.status.toLowerCase()}`}
                  title={slot.status}
                />
                <small>
                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                </small>
              </div>
            ))}
          </div>
          <div className="slot-timeline-legend">
            <span>
              <i className="available-dot" />
              Available
            </span>
            <span>
              <i className="booked-dot" />
              Booked
            </span>
            <span>
              <i className="blocked-dot" />
              Blocked
            </span>
          </div>
        </article>
        <article className="panel utilization-panel">
          <div className="panel-heading">
            <div>
              <h2>Facility utilization</h2>
              <p className="muted">Slot usage for today</p>
            </div>
          </div>
          <div
            className="utilization-ring"
            style={{
              background: `conic-gradient(#7569e8 0 ${stats.occupancy_percent}%, #e8e8f1 ${stats.occupancy_percent}% 100%)`,
            }}
          >
            <div>
              <strong>{stats.occupancy_percent}%</strong>
              <span>Occupied</span>
            </div>
          </div>
          <div className="utilization-legend">
            <span>
              <i className="used" />
              Used slots <b>{stats.total_slots - stats.available_slots}</b>
            </span>
            <span>
              <i className="open" />
              Available <b>{stats.available_slots}</b>
            </span>
          </div>
        </article>
      </section>
      <section className="dashboard-lower-grid">
        <article className="panel schedule-panel">
          <div className="panel-heading">
            <div>
              <h2>Today’s schedule</h2>
              <p className="muted">
                Upcoming bookings for {formatShortDate(dashboard.date)}
              </p>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("/bookings")}
            >
              View all
            </button>
          </div>
          <div className="schedule-list">
            {dashboard.todays_schedule.length ? (
              dashboard.todays_schedule.map((item) => (
                <div className="schedule-row" key={item.booking_id}>
                  <div className="schedule-time">
                    <Clock3 size={14} />
                    {formatTime(item.start_time)} – {formatTime(item.end_time)}
                  </div>
                  <div className="schedule-customer">
                    <strong>{item.full_name}</strong>
                    <span>{item.booking_reference}</span>
                  </div>
                  <span
                    className={`schedule-status ${statusTone(item.status)}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">No bookings scheduled for today.</p>
            )}
          </div>
        </article>
        <article className="panel snapshot-panel">
          <div className="panel-heading">
            <div>
              <h2>Facility snapshot</h2>
              <p className="muted">A quick look at what is coming next</p>
            </div>
          </div>
          <div className="snapshot-list">
            <div>
              <div className="attention-icon purple">
                <CalendarCheck2 size={16} />
              </div>
              <span>
                <small>Next closed date</small>
                <strong>
                  {snapshot.next_closed_date
                    ? formatDate(snapshot.next_closed_date)
                    : "No closure scheduled"}
                </strong>
              </span>
            </div>
            <div>
              <div className="attention-icon blue">
                <Clock3 size={16} />
              </div>
              <span>
                <small>Peak booking window</small>
                <strong>
                  {snapshot.peak_booking_window
                    ? `${formatTime(snapshot.peak_booking_window.start_time)} – ${formatTime(snapshot.peak_booking_window.end_time)}`
                    : "No booking data yet"}
                </strong>
              </span>
            </div>
            <div>
              <div className="attention-icon green">
                <CheckCircle2 size={16} />
              </div>
              <span>
                <small>Next available slot</small>
                <strong>
                  {snapshot.next_available_slot
                    ? `${snapshot.next_available_slot.date === dashboard.date ? "Today" : formatShortDate(snapshot.next_available_slot.date)}, ${formatTime(snapshot.next_available_slot.start_time)}`
                    : "No slots available"}
                </strong>
              </span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
