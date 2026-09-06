import {
  CalendarDays,
  Check,
  Clock3,
  Copy,
  LoaderCircle,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "../components/ui/Toast";
import { authFetch } from "../lib/api";

type Slot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  price: string;
  status: string;
};

type SlotsResponse = {
  success: boolean;
  message: string;
  data: { count: number; results: Slot[] };
};

type CopySlotsResponse = {
  success: boolean;
  message: string;
  data: { created: number; slots: Slot[] };
};

function getLocalDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLocalMonth() {
  return getLocalDate().slice(0, 7);
}

export function AvailabilityPage() {
  const { showToast } = useToast();

  const today = getLocalDate();
  const currentMonth = getLocalMonth();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const visibleDates = getMonthDates(selectedMonth);

  useEffect(() => {
    let active = true;

    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";

    setLoading(true);

    authFetch(
      `${apiBase}/api/v1/admin/slots/?date=${encodeURIComponent(
        selectedDate
      )}`
    )
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));

        if (!response.ok || !body.success) {
          throw new Error(
            body?.message || "Unable to load slot availability."
          );
        }

        return body as SlotsResponse;
      })
      .then((result) => {
        if (active) {
          setSlots(result.data.results);
          setCount(result.data.count);
        }
      })
      .catch((error: Error) => {
        if (active) {
          setSlots([]);
          setCount(0);
          showToast(error.message, "error");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedDate, showToast]);

  const copyPreviousDay = async () => {
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";

    setCopying(true);

    try {
      const response = await authFetch(
        `${apiBase}/api/v1/admin/slots/copy-next-day/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: selectedDate,
          }),
        }
      );

      const body = await response.json().catch(() => ({}));

      if (!response.ok || !body.success) {
        throw new Error(
          body?.message || "Unable to copy the previous day’s slots."
        );
      }

      const result = body as CopySlotsResponse;

      setSlots(result.data.slots);
      setCount(result.data.created);
      setCopied(true);
      setCopyOpen(false);

      showToast(
        result.message || "Previous day slots copied successfully.",
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to copy previous day slots.",
        "error"
      );
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="availability-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Slot management</p>

          <h1>Availability</h1>

          <p className="muted">
            Select a month and date to view slot availability.
          </p>
        </div>

        <div className="availability-actions">
          <label className="month-picker">
            <span>Month</span>

            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => {
                if (event.target.value) {
                  const newMonth = event.target.value;

                  setSelectedMonth(newMonth);

                  /*
                   * If the selected month is the current month,
                   * keep today's date active.
                   *
                   * Otherwise select the first day of the
                   * selected month.
                   */
                  if (newMonth === currentMonth) {
                    setSelectedDate(today);
                  } else {
                    setSelectedDate(`${newMonth}-01`);
                  }

                  setCopied(false);
                }
              }}
            />
          </label>
        </div>
      </div>

      <section className="availability-card">
        <div className="date-strip">
          {visibleDates.map((date) => (
            <button
              key={date}
              className={selectedDate === date ? "active" : ""}
              onClick={() => {
                setCopied(false);
                setSelectedDate(date);
              }}
            >
              <span>
                {new Date(`${date}T00:00:00`).toLocaleDateString([], {
                  weekday: "short",
                })}
              </span>

              <strong>
                {new Date(`${date}T00:00:00`).getDate()}
              </strong>

              <small>
                {new Date(`${date}T00:00:00`).toLocaleDateString([], {
                  month: "short",
                })}
              </small>
            </button>
          ))}
        </div>

        <div className="availability-heading">
          <div>
            <h2>{formatDate(selectedDate)}</h2>

            <p>
              {count} {count === 1 ? "slot" : "slots"} for this date
            </p>
          </div>

          <div className="availability-legend">
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
        </div>

        <div className="availability-slots">
          {loading ? (
            <div className="empty-availability">
              <LoaderCircle className="spin" size={24} />

              <p>Loading slots...</p>
            </div>
          ) : slots.length ? (
            slots.map((slot) => (
              <article
                className={`availability-slot ${slot.status.toLowerCase()}`}
                key={slot.id}
              >
                <div className="availability-slot-icon">
                  <Clock3 size={19} />
                </div>

                <div className="availability-slot-info">
                  <strong>
                    {formatTime(slot.start_time)} –{" "}
                    {formatTime(slot.end_time)}
                  </strong>

                  <span>
                    NPR {Number(slot.price).toLocaleString()}
                  </span>
                </div>

                <span
                  className={`slot-status ${slot.status.toLowerCase()}`}
                >
                  {labelStatus(slot.status)}
                </span>
              </article>
            ))
          ) : (
            <div className="empty-availability">
              <CalendarDays size={24} />

              <p>
                No slots available for {formatDate(selectedDate)}.
              </p>

              <button
                className="secondary-button"
                onClick={() => {
                  setCopied(false);
                  setCopyOpen(true);
                }}
              >
                <Copy size={16} />
                Copy previous day
              </button>
            </div>
          )}
        </div>
      </section>

      {copyOpen && (
        <div
          className="modal-backdrop"
          onClick={() => !copying && setCopyOpen(false)}
        >
          <div
            className="contact-modal copy-day-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Availability</p>

                <h2>Copy previous day</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setCopyOpen(false)}
                disabled={copying}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-content">
              <p className="copy-day-description">
                Copy the previous day’s time slots and prices into this
                availability view. Copied slots are marked as available.
              </p>

              <label className="field">
                <span>Target date</span>

                <input
                  type="date"
                  value={selectedDate}
                  readOnly
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setCopyOpen(false)}
                  disabled={copying}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void copyPreviousDay()}
                  disabled={copying}
                >
                  {copying ? (
                    "Copying..."
                  ) : copied ? (
                    <>
                      <Check size={16} />
                      Slots copied
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy slots
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getMonthDates(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  const total = new Date(year, monthNumber, 0).getDate();

  return Array.from(
    { length: total },
    (_, index) =>
      `${month}-${String(index + 1).padStart(2, "0")}`
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);

  return `${hour % 12 || 12}:${String(minute).padStart(
    2,
    "0"
  )} ${hour >= 12 ? "PM" : "AM"}`;
}

function labelStatus(value: string) {
  return value === "AVAILABLE"
    ? "Available"
    : value === "BOOKED"
      ? "Booked"
      : "Blocked";
}