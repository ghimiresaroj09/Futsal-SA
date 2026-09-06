import {
  CalendarDays,
  Check,
  LoaderCircle,
  Plus,
  Unlock,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../components/ui/Toast";
import { authFetch } from "../lib/api";
import { PageSkeleton } from "../components/ui/PageSkeleton";

type Closure = { id: string; date: string; reason: string; created_at: string };
type ClosuresResponse = {
  success: boolean;
  message: string;
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: Closure[];
  };
};
type UnblockDayResponse = {
  success: boolean;
  message: string;
  data: { date: string; released_slots: number };
};
type BlockDayResponse = {
  success: boolean;
  message: string;
  data: {
    date: string;
    reason: string;
    blocked_slots: number;
    cancelled_bookings: number;
    skipped_booked_slots: number;
  };
};
type BlockRangeResponse = {
  success: boolean;
  message: string;
  data: {
    days_blocked: number;
    blocked_slots: number;
    cancelled_bookings: number;
    skipped_booked_slots: number;
    days: Array<{
      date: string;
      reason: string;
      blocked_slots: number;
      cancelled_bookings: number;
      skipped_booked_slots: number;
    }>;
  };
};

export function ClosurePage() {
  const { showToast } = useToast();
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"day" | "range" | null>(null);
  const [reopenClosure, setReopenClosure] = useState<Closure | null>(null);
  const [reopening, setReopening] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const blockingRequest = useRef(false);
  const [form, setForm] = useState({
    date: "",
    start_date: "",
    end_date: "",
    reason: "",
    cancel_bookings: false,
  });

  useEffect(() => {
    const button = document.querySelector<HTMLButtonElement>(
      '.closure-modal button[type="submit"]',
    );
    if (!button) return;
    button.disabled = blocking;
    button.classList.toggle("closure-submit-loading", blocking);
    button.setAttribute("aria-busy", String(blocking));
  }, [blocking, modal]);

  useEffect(() => {
    let active = true;
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    authFetch(`${apiBase}/api/v1/admin/slots/closures/`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success)
          throw new Error(body?.message || "Unable to load closures.");
        return body as ClosuresResponse;
      })
      .then((response) => {
        if (active) setClosures(response.data.results);
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

  const open = (type: "day" | "range") => {
    setModal(type);
    setForm({
      date: "",
      start_date: "",
      end_date: "",
      reason: "",
      cancel_bookings: false,
    });
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (modal === "day") {
      if (blockingRequest.current) return;
      blockingRequest.current = true;
      setBlocking(true);
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";
      try {
        const response = await authFetch(
          `${apiBase}/api/v1/admin/slots/block-day/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: form.date,
              reason: form.reason,
              cancel_bookings: form.cancel_bookings,
            }),
          },
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success)
          throw new Error(body?.message || "Unable to close this day.");
        const result = body as BlockDayResponse;
        setClosures((items) => [
          {
            id: temporaryClosureId(result.data.date),
            date: result.data.date,
            reason: result.data.reason,
            created_at: new Date().toISOString(),
          },
          ...items.filter((item) => item.date !== result.data.date),
        ]);
        setModal(null);
        showToast(result.message, "success");
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Unable to close this day.",
          "error",
        );
      } finally {
        blockingRequest.current = false;
        setBlocking(false);
      }
      return;
    }
    if (blockingRequest.current) return;
    blockingRequest.current = true;
    setBlocking(true);
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    try {
      const response = await authFetch(
        `${apiBase}/api/v1/admin/slots/block-range/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_date: form.start_date,
            end_date: form.end_date,
            reason: form.reason,
            cancel_bookings: form.cancel_bookings,
          }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success)
        throw new Error(body?.message || "Unable to close this date range.");
      const result = body as BlockRangeResponse;
      const returnedDates = new Set(result.data.days.map((day) => day.date));
      const createdAt = new Date().toISOString();
      setClosures((items) => [
        ...result.data.days.map((day) => ({
          id: temporaryClosureId(day.date),
          date: day.date,
          reason: day.reason,
          created_at: createdAt,
        })),
        ...items.filter((item) => !returnedDates.has(item.date)),
      ]);
      setModal(null);
      showToast(result.message, "success");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to close this date range.",
        "error",
      );
    } finally {
      blockingRequest.current = false;
      setBlocking(false);
    }
  };
  const reopenDay = async () => {
    if (!reopenClosure || reopening) return;
    setReopening(true);
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    try {
      const response = await authFetch(
        `${apiBase}/api/v1/admin/slots/unblock-day/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: reopenClosure.date }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success)
        throw new Error(body?.message || "Unable to reopen this day.");
      const result = body as UnblockDayResponse;
      setClosures((items) =>
        items.filter((item) => item.id !== reopenClosure.id),
      );
      setReopenClosure(null);
      showToast(
        `${result.message}${result.data.released_slots ? ` ${result.data.released_slots} slots released.` : ""}`,
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to reopen this day.",
        "error",
      );
    } finally {
      setReopening(false);
    }
  };

  if (loading)
    return (
      <PageSkeleton
        variant="table"
        eyebrow="Slot management"
        title="Closures"
        description="Block dates when your facility is unavailable."
      />
    );

  return (
    <div className="closure-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Slot management</p>
          <h1>Closure</h1>
          <p className="muted">
            View and manage dates when the facility is closed.
          </p>
        </div>
        <div className="closure-actions">
          <button className="secondary-button" onClick={() => open("day")}>
            <CalendarDays size={16} />
            Close a day
          </button>
          <button className="primary-button" onClick={() => open("range")}>
            <Plus size={16} />
            Close date range
          </button>
        </div>
      </div>
      <section className="table-card">
        <div className="table-toolbar">
          <div>
            <h2>List of closed dates</h2>
            <p>{closures.length} closed dates</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="closure-table">
            <thead>
              <tr>
                <th className="sn-col">SN</th>
                <th>Closed date</th>
                <th>Reason</th>
                <th>Created at</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {closures.length ? (
                closures.map((closure, index) => (
                  <tr key={closure.id}>
                    <td className="sn-col">{index + 1}</td>
                    <td>
                      <span className="closed-date">
                        <CalendarDays size={15} />
                        {formatDateLabel(closure.date)}
                      </span>
                    </td>
                    <td>
                      <span className="closure-reason">
                        {closure.reason || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="created-date">
                        {formatDateTime(closure.created_at)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="reopen-button"
                        onClick={() => setReopenClosure(closure)}
                      >
                        <Unlock size={14} />
                        Reopen
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="table-empty">
                    No closed dates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <form
            className="contact-modal closure-modal"
            onClick={(event) => event.stopPropagation()}
            onSubmit={submit}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Slot management</p>
                <h2>
                  {modal === "day"
                    ? "Close an entire day"
                    : "Close a range of days"}
                </h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-content closure-form">
              {modal === "day" ? (
                <label className="field">
                  <span>Date</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm({ ...form, date: event.target.value })
                    }
                    required
                  />
                </label>
              ) : (
                <div className="modal-data-grid">
                  <label className="field">
                    <span>Start date</span>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(event) =>
                        setForm({ ...form, start_date: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span>End date</span>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(event) =>
                        setForm({ ...form, end_date: event.target.value })
                      }
                      min={form.start_date}
                      required
                    />
                  </label>
                </div>
              )}
              <label className="field">
                <span>Reason</span>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(event) =>
                    setForm({ ...form, reason: event.target.value })
                  }
                  placeholder="Add a reason"
                />
              </label>
              <label className="closure-checkbox">
                <input
                  type="checkbox"
                  checked={form.cancel_bookings}
                  onChange={(event) =>
                    setForm({ ...form, cancel_bookings: event.target.checked })
                  }
                />
                <span>Cancel existing bookings during this closure</span>
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Check size={16} />
                  Create closure
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      {reopenClosure && (
        <div
          className="modal-backdrop"
          onClick={() => !reopening && setReopenClosure(null)}
        >
          <div
            className="confirmation-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="confirmation-icon confirm-danger">
              <Unlock size={22} />
            </div>
            <h2>Reopen this date?</h2>
            <p>
              {formatDateLabel(reopenClosure.date)} will become available for
              slot bookings again.
            </p>
            <div className="confirmation-actions">
              <button
                className="secondary-button"
                onClick={() => setReopenClosure(null)}
                disabled={reopening}
              >
                No, keep closed
              </button>
              <button
                className="danger-button"
                onClick={reopenDay}
                disabled={reopening}
              >
                {reopening ? "Reopening..." : "Yes, reopen date"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateLabel(value: string) {
  if (value.includes(" – ")) return value;
  return new Date(`${value}T00:00:00`).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
function temporaryClosureId(date: string) {
  return `closure-${date}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
