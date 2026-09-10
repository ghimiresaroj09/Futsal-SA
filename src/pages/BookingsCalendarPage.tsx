import {
  CalendarDays,
  Clock3,
  Eye,
  LoaderCircle,
  Mail,
  Phone,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "../components/ui/Toast";
import { authFetch } from "../lib/api";

type Booking = {
  id: string;
  booking_reference: string;
  slot: {
    date: string;
    start_time: string;
    end_time: string;
    price: string;
    status: string;
  };
  futsal_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  amount: string;
  status: string;
  booking_source: string;
  payment_status: string;
  payment_method?: string;
  advance_amount?: string;
  remaining_amount?: string;
  cancelled_at: string | null;
  cancellation_reason: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

type BookingsResponse = {
  success: boolean;
  message: string;
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: Booking[];
  };
};

type BookingDetailResponse = {
  success: boolean;
  message: string;
  data: Booking;
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

export function BookingsCalendarPage() {
  const { showToast } = useToast();

  const today = getLocalDate();
  const currentMonth = getLocalMonth();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState(today);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const visibleDates = getMonthDates(selectedMonth);

  useEffect(() => {
    let active = true;

    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";

    setLoading(true);

    authFetch(
      `${apiBase}/api/v1/admin/bookings/?date=${encodeURIComponent(
        selectedDate,
      )}`,
    )
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));

        if (!response.ok || !body.success) {
          throw new Error(body?.message || "Unable to load bookings.");
        }

        return body as BookingsResponse;
      })
      .then((result) => {
        if (active) {
          setBookings(result.data.results);
          setCount(result.data.count);
        }
      })
      .catch((error: Error) => {
        if (active) {
          setBookings([]);
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

  useEffect(() => {
    if (!selectedBooking) return;
    let active = true;
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    authFetch(`${apiBase}/api/v1/admin/bookings/${selectedBooking.id}/`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success)
          throw new Error(body?.message || "Unable to load booking details.");
        return body as BookingDetailResponse;
      })
      .then((result) => {
        if (active) setSelectedBooking(result.data);
      })
      .catch((error: Error) => {
        if (active) showToast(error.message, "error");
      });
    return () => {
      active = false;
    };
  }, [selectedBooking?.id, showToast]);

  return (
    <div className="availability-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace activity</p>

          <h1>Bookings Calendar</h1>

          <p className="muted">
            Select a month and date to view bookings for that day.
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

                  if (newMonth === currentMonth) {
                    setSelectedDate(today);
                  } else {
                    setSelectedDate(`${newMonth}-01`);
                  }
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
              onClick={() => setSelectedDate(date)}
            >
              <span>
                {new Date(`${date}T00:00:00`).toLocaleDateString([], {
                  weekday: "short",
                })}
              </span>

              <strong>{new Date(`${date}T00:00:00`).getDate()}</strong>

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
            <h2>{formatFullDate(selectedDate)}</h2>

            <p>
              {count} {count === 1 ? "booking" : "bookings"} for this date
            </p>
          </div>

          <div className="availability-legend">
            <span>
              <i className="confirmed-dot" />
              Confirmed
            </span>

            <span>
              <i className="pending-dot" />
              Pending
            </span>

            <span>
              <i className="cancelled-dot" />
              Cancelled
            </span>

            <span>
              <i className="completed-dot" />
              Completed
            </span>

            <span>
              <i className="rescheduled-dot" />
              Rescheduled
            </span>
          </div>
        </div>

        <div className="availability-slots">
          {loading ? (
            <div className="empty-availability">
              <LoaderCircle className="spin" size={24} />

              <p>Loading bookings...</p>
            </div>
          ) : bookings.length ? (
            bookings.map((booking) => (
              <article
                className={`availability-slot booking-slot ${booking.status.toLowerCase()}`}
                key={booking.id}
              >
                <div className="availability-slot-icon">
                  <Clock3 size={19} />
                </div>

                <div className="availability-slot-info">
                  <strong>
                    {formatTime(booking.slot.start_time)} –{" "}
                    {formatTime(booking.slot.end_time)}
                  </strong>

                  <div className="booking-customer-info">
                    <span className="customer-name">
                      {booking.full_name}
                    </span>
                    <span className="booking-contact-mini">
                      <Mail size={11} />
                      {booking.email}
                    </span>
                    <span className="booking-contact-mini">
                      <Phone size={11} />
                      {booking.phone_number}
                    </span>
                  </div>

                  <span className="booking-amount">
                    NPR {Number(booking.amount).toLocaleString()}
                  </span>
                </div>

                <div className="booking-slot-actions">
                  <span
                    className={`slot-status ${booking.status.toLowerCase()}`}
                  >
                    {labelStatus(booking.status)}
                  </span>

                  <button
                    className="view-booking-btn"
                    title="View booking details"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <Eye size={14} />
                    View
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-availability">
              <CalendarDays size={24} />

              <p>No bookings found for {formatFullDate(selectedDate)}.</p>
            </div>
          )}
        </div>
      </section>

      {selectedBooking && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="contact-modal booking-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Booking details</p>
                <h2>{selectedBooking.booking_reference}</h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedBooking(null)}
                aria-label="Close booking details"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-content">
              <div className="booking-modal-summary">
                <div>
                  <span>Customer</span>
                  <strong>{selectedBooking.full_name}</strong>
                </div>
                <span
                  className={`booking-status ${selectedBooking.status.toLowerCase()}`}
                >
                  {labelStatus(selectedBooking.status)}
                </span>
              </div>
              <div className="modal-data-grid">
                <ModalData label="Futsal" value={selectedBooking.futsal_name} />
                <ModalData
                  label="Booking source"
                  value={labelSource(selectedBooking.booking_source)}
                />
                <ModalData label="Email" value={selectedBooking.email} />
                <ModalData
                  label="Phone number"
                  value={selectedBooking.phone_number}
                />
                <ModalData
                  label="Amount"
                  value={`NPR ${Number(selectedBooking.amount).toLocaleString()}`}
                />
                <ModalData
                  label="Payment status"
                  value={labelPayment(selectedBooking.payment_status)}
                />
                <ModalData
                  label="Payment method"
                  value={labelPayment(selectedBooking.payment_method || "")}
                />
                <ModalData
                  label="Advance amount"
                  value={`NPR ${Number(selectedBooking.advance_amount || 0).toLocaleString()}`}
                />
                <ModalData
                  label="Remaining amount"
                  value={`NPR ${Number(selectedBooking.remaining_amount || 0).toLocaleString()}`}
                />
              </div>
              <div className="booking-modal-section">
                <h3>Slot details</h3>
                <div className="modal-data-grid">
                  <ModalData label="Date" value={selectedBooking.slot.date} />
                  <ModalData
                    label="Time"
                    value={`${formatTime(selectedBooking.slot.start_time)} – ${formatTime(selectedBooking.slot.end_time)}`}
                  />
                  <ModalData
                    label="Slot price"
                    value={`NPR ${Number(selectedBooking.slot.price).toLocaleString()}`}
                  />
                  <ModalData
                    label="Slot status"
                    value={selectedBooking.slot.status}
                  />
                </div>
              </div>
              <div className="booking-modal-section">
                <h3>Additional information</h3>
                <div className="modal-data-grid">
                  <ModalData
                    label="Cancellation reason"
                    value={selectedBooking.cancellation_reason || "—"}
                  />
                  <ModalData
                    label="Cancelled at"
                    value={
                      selectedBooking.cancelled_at
                        ? formatDate(selectedBooking.cancelled_at)
                        : "—"
                    }
                  />
                  <ModalData
                    label="Notes"
                    value={selectedBooking.notes || "—"}
                  />
                  <ModalData
                    label="Created at"
                    value={formatDate(selectedBooking.created_at)}
                  />
                  <ModalData
                    label="Updated at"
                    value={formatDate(selectedBooking.updated_at)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalData({ label, value }: { label: string; value: string }) {
  return (
    <div className="modal-data">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getMonthDates(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  const total = new Date(year, monthNumber, 0).getDate();

  return Array.from(
    { length: total },
    (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`,
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatFullDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function labelStatus(value: string) {
  return (
    (
      {
        PENDING: "Pending",
        CONFIRMED: "Confirmed",
        CANCELLED: "Cancelled",
        COMPLETED: "Completed",
        RESCHEDULED: "Rescheduled",
      } as Record<string, string>
    )[value] || value
  );
}

function labelSource(value: string) {
  return value === "ADMIN" ? "Admin" : "User";
}

function labelPayment(value: string) {
  return (
    (
      {
        CASH: "Cash",
        CARD: "Card",
        ESEWA: "eSewa",
        KHALTI: "Khalti",
        BANK_TRANSFER: "Bank transfer",
        PENDING: "Pending",
        ADVANCED: "Advanced",
      } as Record<string, string>
    )[value] || value
  );
}
