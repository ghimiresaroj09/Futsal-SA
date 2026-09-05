import {
  BellRing,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  History,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import { authFetch, authFetchAll } from "../lib/api";

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
type CreateBookingResponse = {
  success: boolean;
  message: string;
  data: Booking;
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

let dateWiseSlots: Slot[] = [
  {
    id: "58e0aab2-f0c1-42d2-af94-0f7b7c32e13b",
    date: "2026-09-05",
    start_time: "07:00:00",
    end_time: "08:00:00",
    price: "2000.00",
    status: "AVAILABLE",
  },
  {
    id: "f5078fee-ab18-4fa1-b488-95fee238ee48",
    date: "2026-09-05",
    start_time: "09:00:00",
    end_time: "10:00:00",
    price: "2092451.00",
    status: "BOOKED",
  },
];

type Reminder = {
  id: string;
  booking: string;
  booking_reference: string;
  reminder_type: "AUTOMATIC_ONE_HOUR" | "MANUAL";
  scheduled_at: string;
  sent_at: string | null;
  status: "PENDING" | "SENT" | "FAILED";
  error_message: string;
  created_at: string;
};
type ReminderResponse = { success: boolean; message: string; data: Reminder };
const initialReminders: Reminder[] = [
  {
    id: "6277f9d2-09fd-4ec1-9fa9-b8ba94239b2f",
    booking: "3cf897e2-67b8-4653-ac7f-e82fd10909be",
    booking_reference: "FSL-20260905-0003",
    reminder_type: "MANUAL",
    scheduled_at: "2026-09-04T22:52:41.530439+05:45",
    sent_at: "2026-09-04T22:52:47.159951+05:45",
    status: "SENT",
    error_message: "",
    created_at: "2026-09-04T22:52:41.541400+05:45",
  },
];

const bookings: Booking[] = [
  {
    id: "f3315747-fc04-429d-83cf-90da4f798779",
    booking_reference: "FSL-20260905-0001",
    slot: {
      date: "2026-09-05",
      start_time: "07:00:00",
      end_time: "08:00:00",
      price: "2000.00",
      status: "AVAILABLE",
    },
    futsal_name: "Futsal",
    full_name: "Nexus Being",
    email: "ghimires090@gmail.com",
    phone_number: "9843951167",
    amount: "2000.00",
    status: "CANCELLED",
    booking_source: "USER",
    payment_status: "PENDING",
    cancelled_at: "2026-09-04T21:36:50.339624+05:45",
    cancellation_reason: "Not enough players.",
    notes: "We are ready for some action.",
    created_at: "2026-09-04T21:35:09.076941+05:45",
    updated_at: "2026-09-04T21:36:50.339624+05:45",
  },
  {
    id: "c3a491fb-448b-4e9b-b584-9d19a90109bf",
    booking_reference: "FSL-20260905-0002",
    slot: {
      date: "2026-09-05",
      start_time: "07:00:00",
      end_time: "08:00:00",
      price: "2000.00",
      status: "AVAILABLE",
    },
    futsal_name: "Futsal",
    full_name: "Nexus Being",
    email: "ghimires090@gmail.com",
    phone_number: "9843951167",
    amount: "2000.00",
    status: "CANCELLED",
    booking_source: "USER",
    payment_status: "PENDING",
    cancelled_at: "2026-09-04T21:39:34.799213+05:45",
    cancellation_reason: "Not enough players....",
    notes: "We are ready for some action.",
    created_at: "2026-09-04T21:39:04.924473+05:45",
    updated_at: "2026-09-04T21:39:34.799213+05:45",
  },
  {
    id: "3cf897e2-67b8-4653-ac7f-e82fd10909be",
    booking_reference: "FSL-20260905-0003",
    slot: {
      date: "2026-09-05",
      start_time: "09:00:00",
      end_time: "10:00:00",
      price: "2092451.00",
      status: "BOOKED",
    },
    futsal_name: "Futsal",
    full_name: "string",
    email: "user@example.com",
    phone_number: "94165123",
    amount: "2092451.00",
    status: "CONFIRMED",
    booking_source: "USER",
    payment_status: "PENDING",
    cancelled_at: null,
    cancellation_reason: "",
    notes: "",
    created_at: "2026-09-04T21:52:20.928761+05:45",
    updated_at: "2026-09-04T21:52:20.928761+05:45",
  },
];

export function BookingsPage() {
  const location = useLocation();
  const { id: routeBookingId } = useParams();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [bookingReference, setBookingReference] = useState("");
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [futsal, setFutsal] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [bookingList, setBookingList] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    booking: Booking;
    action: "CANCELLED" | "COMPLETED";
  } | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    status: "PENDING",
    full_name: "",
    email: "",
    phone_number: "",
    notes: "",
    reason: "",
    advance_amount: "",
    payment_method: "CASH",
  });
  const [addBookingOpen, setAddBookingOpen] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(
    null,
  );
  const [reminderModal, setReminderModal] = useState<{
    booking: Booking;
    mode: "send" | "history";
  } | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [loadingReminderHistory, setLoadingReminderHistory] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("2026-09-05");
  const [newSlotId, setNewSlotId] = useState("");
  const [addForm, setAddForm] = useState({
    slot_id: "",
    full_name: "",
    email: "",
    phone_number: "",
    notes: "",
    payment_method: "CASH",
    status: "PENDING",
    advance_amount: "",
  });
  const [slotDate, setSlotDate] = useState("2026-09-05");
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [loadingAvailableSlots, setLoadingAvailableSlots] = useState(false);
  const [addingBooking, setAddingBooking] = useState(false);
  const addingBookingRef = useRef(false);
  const cancellingBookingRef = useRef(false);
  const reschedulingBookingRef = useRef(false);
  const updatingBookingRef = useRef(false);
  const sendingReminderRef = useRef(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  useEffect(() => {
    let active = true;
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    authFetchAll<Booking>(`${apiBase}/api/v1/admin/bookings/`)
      .then((result) => {
        if (active) setBookingList(result);
      })
      .catch((error: Error) => {
        if (active) showToast(error.message, "error");
      })
      .finally(() => {
        if (active) setLoadingBookings(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);
  useEffect(() => {
    const bookingId =
      routeBookingId || new URLSearchParams(location.search).get("booking");
    const booking = bookingList.find((item) => item.id === bookingId);
    if (booking) setSelectedBooking(booking);
  }, [bookingList, location.search, routeBookingId]);
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
        return body as CreateBookingResponse;
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
  useEffect(() => {
    if (!rescheduleBooking || !rescheduleDate) return;
    let active = true;
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    setLoadingAvailableSlots(true);
    authFetch(
      `${apiBase}/api/v1/admin/slots/?date=${encodeURIComponent(rescheduleDate)}`,
    )
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success)
          throw new Error(body?.message || "Unable to load available slots.");
        return body as SlotsResponse;
      })
      .then((result) => {
        if (!active) return;
        dateWiseSlots = result.data.results.filter(
          (slot) => slot.status === "AVAILABLE",
        );
        setAvailableSlots(dateWiseSlots);
      })
      .catch((error: Error) => {
        if (active) {
          dateWiseSlots = [];
          setAvailableSlots([]);
          showToast(error.message, "error");
        }
      })
      .finally(() => {
        if (active) setLoadingAvailableSlots(false);
      });
    return () => {
      active = false;
    };
  }, [rescheduleBooking?.id, rescheduleDate, showToast]);
  useEffect(() => {
    if (reminderModal?.mode !== "history") return;
    let active = true;
    setLoadingReminderHistory(true);
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    authFetch(
      `${apiBase}/api/v1/admin/bookings/${reminderModal.booking.id}/reminders/`,
    )
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success)
          throw new Error(body?.message || "Unable to load reminder history.");
        return body as { data: Reminder[] | { results?: Reminder[] } };
      })
      .then((result) => {
        if (!active) return;
        const items = Array.isArray(result.data)
          ? result.data
          : result.data.results || [];
        setReminders(items);
      })
      .catch((error: Error) => {
        if (active) showToast(error.message, "error");
      })
      .finally(() => {
        if (active) setLoadingReminderHistory(false);
      });
    return () => {
      active = false;
    };
  }, [reminderModal?.booking.id, reminderModal?.mode, showToast]);
  useEffect(() => {
    if (!addBookingOpen || !slotDate) return;
    let active = true;
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    setLoadingAvailableSlots(true);
    authFetch(
      `${apiBase}/api/v1/admin/slots/?date=${encodeURIComponent(slotDate)}`,
    )
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success)
          throw new Error(body?.message || "Unable to load available slots.");
        return body as SlotsResponse;
      })
      .then((result) => {
        if (active) {
          dateWiseSlots = result.data.results.filter(
            (slot) => slot.status === "AVAILABLE",
          );
          setAvailableSlots(dateWiseSlots);
        }
      })
      .catch((error: Error) => {
        if (active) {
          setAvailableSlots([]);
          showToast(error.message, "error");
        }
      })
      .finally(() => {
        if (active) setLoadingAvailableSlots(false);
      });
    return () => {
      active = false;
    };
  }, [addBookingOpen, showToast, slotDate]);
  const filtered = useMemo(
    () =>
      bookingList.filter(
        (item) =>
          `${item.booking_reference} ${item.full_name} ${item.email}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          item.booking_reference
            .toLowerCase()
            .includes(bookingReference.toLowerCase()) &&
          item.phone_number.includes(phone) &&
          (filter === "ALL" || item.status === filter) &&
          (futsal === "ALL" || item.futsal_name === futsal) &&
          (source === "ALL" || item.booking_source === source) &&
          (!startDate || item.slot.date >= startDate) &&
          (!endDate || item.slot.date <= endDate),
      ),
    [
      bookingList,
      query,
      bookingReference,
      phone,
      filter,
      futsal,
      source,
      startDate,
      endDate,
      ordering,
    ],
  );
  const visible = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const applyAction = async () => {
    if (!confirmAction || cancellingBookingRef.current) return;
    cancellingBookingRef.current = true;
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    const endpoint =
      confirmAction.action === "CANCELLED" ? "cancel" : "complete";
    try {
      const response = await authFetch(
        `${apiBase}/api/v1/admin/bookings/${confirmAction.booking.id}/${endpoint}/`,
        { method: "POST" },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success)
        throw new Error(body?.message || `Unable to ${endpoint} booking.`);
      const result = body as CreateBookingResponse;
      setBookingList((items) =>
        items.map((item) => (item.id === result.data.id ? result.data : item)),
      );
      setConfirmAction(null);
      showToast(
        result.message || `Booking ${endpoint}d successfully.`,
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : `Unable to ${endpoint} booking.`,
        "error",
      );
    } finally {
      cancellingBookingRef.current = false;
    }
  };
  const submitAddBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    if (addingBookingRef.current) return;
    addingBookingRef.current = true;
    setAddingBooking(true);
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    try {
      const payload = {
        ...addForm,
        advance_amount: addForm.advance_amount || "0",
      };
      const response = await authFetch(`${apiBase}/api/v1/admin/bookings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success)
        throw new Error(body?.message || "Unable to create booking.");
      const result = body as CreateBookingResponse;
      setBookingList((items) => [result.data, ...items]);
      setAddBookingOpen(false);
      setAddForm({
        slot_id: "",
        full_name: "",
        email: "",
        phone_number: "",
        notes: "",
        payment_method: "CASH",
        status: "PENDING",
        advance_amount: "",
      });
      showToast(result.message || "Booking created successfully.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to create booking.",
        "error",
      );
    } finally {
      addingBookingRef.current = false;
      setAddingBooking(false);
    }
  };
  const submitRescheduleBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rescheduleBooking || !newSlotId || reschedulingBookingRef.current)
      return;
    reschedulingBookingRef.current = true;
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    try {
      const response = await authFetch(
        `${apiBase}/api/v1/admin/bookings/${rescheduleBooking.id}/reschedule/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_slot_id: newSlotId }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success)
        throw new Error(body?.message || "Unable to reschedule booking.");
      const result = body as CreateBookingResponse;
      setBookingList((items) =>
        items.map((item) => (item.id === result.data.id ? result.data : item)),
      );
      setRescheduleBooking(null);
      showToast(
        result.message || "Booking rescheduled successfully.",
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to reschedule booking.",
        "error",
      );
    } finally {
      reschedulingBookingRef.current = false;
    }
  };
  const submitUpdateBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingBooking || updatingBookingRef.current) return;
    updatingBookingRef.current = true;
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    try {
      const response = await authFetch(
        `${apiBase}/api/v1/admin/bookings/${editingBooking.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editForm,
            advance_amount: editForm.advance_amount || "0",
          }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success)
        throw new Error(body?.message || "Unable to update booking.");
      const result = body as CreateBookingResponse;
      setBookingList((items) =>
        items.map((item) => (item.id === result.data.id ? result.data : item)),
      );
      setEditingBooking(null);
      showToast(result.message || "Booking updated successfully.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to update booking.",
        "error",
      );
    } finally {
      updatingBookingRef.current = false;
    }
  };
  const sendReminder = async () => {
    if (
      !reminderModal ||
      reminderModal.mode !== "send" ||
      sendingReminderRef.current
    )
      return;
    sendingReminderRef.current = true;
    const apiBase = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    try {
      const response = await authFetch(
        `${apiBase}/api/v1/admin/bookings/${reminderModal.booking.id}/send-reminder/`,
        { method: "POST" },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success)
        throw new Error(body?.message || "Unable to send reminder.");
      const result = body as ReminderResponse;
      setReminders((items) => [result.data, ...items]);
      setReminderModal(null);
      showToast(body.message || "Reminder sent successfully.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to send reminder.",
        "error",
      );
    } finally {
      sendingReminderRef.current = false;
    }
  };
  useEffect(() => {
    if (!addBookingOpen) return;
    const handleSubmit = (event: SubmitEvent) => {
      event.preventDefault();
      event.stopPropagation();
      void submitAddBooking(event as unknown as React.FormEvent);
    };
    document.addEventListener("submit", handleSubmit, true);
    return () => document.removeEventListener("submit", handleSubmit, true);
  }, [addBookingOpen, addForm]);
  useEffect(() => {
    if (!rescheduleBooking) return;
    const handleSubmit = (event: SubmitEvent) => {
      event.preventDefault();
      event.stopPropagation();
      void submitRescheduleBooking(event as unknown as React.FormEvent);
    };
    document.addEventListener("submit", handleSubmit, true);
    return () => document.removeEventListener("submit", handleSubmit, true);
  }, [rescheduleBooking, newSlotId]);
  useEffect(() => {
    if (!editingBooking) return;
    const handleSubmit = (event: SubmitEvent) => {
      event.preventDefault();
      event.stopPropagation();
      void submitUpdateBooking(event as unknown as React.FormEvent);
    };
    document.addEventListener("submit", handleSubmit, true);
    return () => document.removeEventListener("submit", handleSubmit, true);
  }, [editingBooking, editForm]);
  useEffect(() => {
    if (reminderModal?.mode !== "send") return;
    const button = document.querySelector<HTMLButtonElement>(
      ".reminder-modal .primary-button",
    );
    if (!button) return;
    const handleClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      void sendReminder();
    };
    button.addEventListener("click", handleClick);
    return () => button.removeEventListener("click", handleClick);
  }, [reminderModal]);
  return (
    <div className="bookings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace activity</p>
          <h1>Bookings</h1>
          <p className="muted">
            View and manage bookings made by your customers.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setAddBookingOpen(true)}
        >
          <Plus size={16} />
          Add booking
        </button>
      </div>
      <section className="table-card">
        <div className="table-toolbar booking-toolbar">
          <div>
            <h2>All bookings</h2>
            <p>{filtered.length} total bookings</p>
          </div>
          <div className="table-controls">
            <label className="table-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search bookings"
              />
            </label>
            <label className="booking-date-filter">
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setEndDate(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by booking date"
              />
            </label>
            <select
              className="booking-filter"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="RESCHEDULED">Rescheduled</option>
            </select>
            <select
              className="booking-filter"
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All sources</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
        <div className="table-scroll">
          <table className="bookings-table">
            <thead>
              <tr>
                <th className="sn-col">SN</th>
                <th>Booking reference</th>
                <th>Customer</th>
                <th>Slot</th>
                <th>Amount</th>
                <th>Advance</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Payment</th>
                <th className="booking-actions-heading">Action</th>
                <th>Reminders</th>
              </tr>
            </thead>
            <tbody>
              {visible.length ? visible.map((booking, index) => (
                <tr key={booking.id}>
                  <td className="sn-col">
                    {(page - 1) * rowsPerPage + index + 1}
                  </td>
                  <td>
                    <strong className="booking-ref">
                      {booking.booking_reference}
                    </strong>
                    <small className="source-label">
                      {booking.booking_source}
                    </small>
                  </td>
                  <td>
                    <strong className="table-name">{booking.full_name}</strong>
                    <span className="booking-contact">
                      <Mail size={12} />
                      {booking.email}
                    </span>
                    <span className="booking-contact">
                      <Phone size={12} />
                      {booking.phone_number}
                    </span>
                  </td>
                  <td>
                    <span className="slot-date">
                      <CalendarDays size={13} />
                      {booking.slot.date}
                    </span>
                    <span className="slot-time">
                      <Clock3 size={13} />
                      {formatTime(booking.slot.start_time)} –{" "}
                      {formatTime(booking.slot.end_time)}
                    </span>
                  </td>
                  <td>
                    <span className="amount-cell">
                      NPR {Number(booking.amount).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="amount-cell">
                      NPR {Number(booking.advance_amount || 0).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="amount-cell">
                      NPR {Number(booking.remaining_amount || 0).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`booking-status ${booking.status.toLowerCase()}`}
                    >
                      {labelStatus(booking.status)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`payment-status ${booking.payment_status.toLowerCase()}`}
                    >
                      {labelPayment(booking.payment_status)}
                    </span>
                  </td>
                  <td>
                    <div className="booking-actions">
                      <button
                        title="View booking"
                        aria-label="View booking"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        title="Update booking"
                        aria-label="Update booking"
                        onClick={() => {
                          setEditingBooking(booking);
                          setEditForm({
                            status: booking.status,
                            full_name: booking.full_name,
                            email: booking.email,
                            phone_number: booking.phone_number,
                            notes: booking.notes,
                            reason: booking.cancellation_reason,
                            advance_amount: booking.advance_amount || "",
                            payment_method: booking.payment_method || "CASH",
                          });
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="danger-action"
                        title="Cancel booking"
                        aria-label="Cancel booking"
                        onClick={() =>
                          setConfirmAction({ booking, action: "CANCELLED" })
                        }
                      >
                        <XCircle size={14} />
                      </button>
                      <button
                        className="success-action"
                        title="Mark as complete"
                        aria-label="Mark as complete"
                        onClick={() =>
                          setConfirmAction({ booking, action: "COMPLETED" })
                        }
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        className="reschedule-action"
                        title="Reschedule booking"
                        aria-label="Reschedule booking"
                        onClick={() => {
                          setRescheduleBooking(booking);
                          setRescheduleDate(booking.slot.date);
                          setNewSlotId("");
                        }}
                      >
                        <CalendarClock size={14} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="booking-actions reminder-actions">
                      <button
                        title="Send reminder"
                        aria-label="Send reminder"
                        onClick={() =>
                          setReminderModal({ booking, mode: "send" })
                        }
                      >
                        <BellRing size={14} />
                      </button>
                      <button
                        title="Reminder history"
                        aria-label="Reminder history"
                        onClick={() =>
                          setReminderModal({ booking, mode: "history" })
                        }
                      >
                        <History size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : !loadingBookings && <tr><td colSpan={11} className="table-empty">No bookings found.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <label className="booking-rows-select">
            Rows per page
            <select
              value={rowsPerPage}
              onChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          <span>
            {filtered.length ? (page - 1) * rowsPerPage + 1 : 0}–
            {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}
          </span>
          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {page} of{" "}
              {Math.max(1, Math.ceil(filtered.length / rowsPerPage))}
            </span>
            <button
              disabled={page >= Math.ceil(filtered.length / rowsPerPage)}
              onClick={() => setPage((current) => current + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
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
      {editingBooking && (
        <div className="modal-backdrop" onClick={() => setEditingBooking(null)}>
          <form
            className="contact-modal booking-modal"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              setEditingBooking(null);
            }}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Update booking</p>
                <h2>{editingBooking.booking_reference}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditingBooking(null)}
                aria-label="Close update form"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-content booking-edit-form">
              <label className="field">
                <span>Status</span>
                <select
                  value={editForm.status}
                  onChange={(event) =>
                    setEditForm({ ...editForm, status: event.target.value })
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                </select>
              </label>
              <div className="modal-data-grid">
                <label className="field">
                  <span>Full Name</span>
                  <input
                    value={editForm.full_name}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        full_name: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm({ ...editForm, email: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Phone Number</span>
                  <input
                    value={editForm.phone_number}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        phone_number: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Advance amount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.advance_amount}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        advance_amount: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Payment method</span>
                  <select
                    value={editForm.payment_method}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        payment_method: event.target.value,
                      })
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="ESEWA">eSewa</option>
                    <option value="KHALTI">Khalti</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(event) =>
                    setEditForm({ ...editForm, notes: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Reason</span>
                <textarea
                  rows={3}
                  value={editForm.reason}
                  onChange={(event) =>
                    setEditForm({ ...editForm, reason: event.target.value })
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingBooking(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Update booking
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      {confirmAction && (
        <div className="modal-backdrop" onClick={() => setConfirmAction(null)}>
          <div
            className="confirmation-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`confirmation-icon ${confirmAction.action === "CANCELLED" ? "confirm-danger" : "confirm-success"}`}
            >
              {confirmAction.action === "CANCELLED" ? (
                <XCircle size={22} />
              ) : (
                <CheckCircle2 size={22} />
              )}
            </div>
            <h2>
              {confirmAction.action === "CANCELLED"
                ? "Cancel this booking?"
                : "Mark as complete?"}
            </h2>
            <p>
              {confirmAction.action === "CANCELLED"
                ? "This booking will be marked as cancelled."
                : "This booking will be marked as completed."}
            </p>
            <div className="confirmation-actions">
              <button
                className="secondary-button"
                onClick={() => setConfirmAction(null)}
              >
                No, keep it
              </button>
              <button
                className={
                  confirmAction.action === "CANCELLED"
                    ? "danger-button"
                    : "success-button"
                }
                onClick={applyAction}
              >
                {confirmAction.action === "CANCELLED"
                  ? "Yes, cancel booking"
                  : "Yes, mark complete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {addBookingOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setAddBookingOpen(false)}
        >
          <form
            className="contact-modal booking-modal"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              setAddBookingOpen(false);
            }}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Booking management</p>
                <h2>Add booking</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setAddBookingOpen(false)}
                aria-label="Close add booking form"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-content booking-edit-form">
              <div className="slot-picker-grid">
                <label className="field">
                  <span>Booking date</span>
                  <input
                    type="date"
                    value={slotDate}
                    onChange={(event) => {
                      setSlotDate(event.target.value);
                      setAddForm({ ...addForm, slot_id: "" });
                    }}
                    required
                  />
                </label>
                <label className="field">
                  <span>Available slot</span>
                  <select
                    value={addForm.slot_id}
                    onChange={(event) =>
                      setAddForm({ ...addForm, slot_id: event.target.value })
                    }
                    required
                  >
                    <option value="">Select a slot</option>
                    {dateWiseSlots
                      .filter((slot) => slot.date === slotDate)
                      .map((slot) => (
                        <option
                          key={slot.id}
                          value={slot.id}
                          disabled={slot.status !== "AVAILABLE"}
                        >
                          {formatTime(slot.start_time)} –{" "}
                          {formatTime(slot.end_time)} · NPR{" "}
                          {Number(slot.price).toLocaleString()} ·{" "}
                          {labelSlotStatus(slot.status)}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <div className="modal-data-grid">
                <label className="field">
                  <span>Full Name</span>
                  <input
                    value={addForm.full_name}
                    onChange={(event) =>
                      setAddForm({ ...addForm, full_name: event.target.value })
                    }
                    placeholder="Enter full name"
                    required
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(event) =>
                      setAddForm({ ...addForm, email: event.target.value })
                    }
                    placeholder="user@example.com"
                    required
                  />
                </label>
                <label className="field">
                  <span>Phone Number</span>
                  <input
                    value={addForm.phone_number}
                    onChange={(event) =>
                      setAddForm({
                        ...addForm,
                        phone_number: event.target.value,
                      })
                    }
                    placeholder="Enter phone number"
                    required
                  />
                </label>
                <label className="field">
                  <span>Payment method</span>
                  <select
                    value={addForm.payment_method}
                    onChange={(event) =>
                      setAddForm({
                        ...addForm,
                        payment_method: event.target.value,
                      })
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="ESEWA">eSewa</option>
                    <option value="KHALTI">Khalti</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                  </select>
                </label>
                <label className="field">
                  <span>Advance amount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={addForm.advance_amount}
                    onChange={(event) =>
                      setAddForm({
                        ...addForm,
                        advance_amount: event.target.value,
                      })
                    }
                    placeholder="e.g. 500"
                  />
                </label>
                <label className="field">
                  <span>Status</span>
                  <select
                    value={addForm.status}
                    onChange={(event) =>
                      setAddForm({ ...addForm, status: event.target.value })
                    }
                  >
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={addForm.notes}
                  onChange={(event) =>
                    setAddForm({ ...addForm, notes: event.target.value })
                  }
                  placeholder="Add notes"
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setAddBookingOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Plus size={16} />
                  Add booking
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      {rescheduleBooking && (
        <div
          className="modal-backdrop"
          onClick={() => setRescheduleBooking(null)}
        >
          <form
            className="contact-modal booking-modal"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              setBookingList((items) =>
                items.map((item) =>
                  item.id === rescheduleBooking.id
                    ? {
                        ...item,
                        status: "RESCHEDULED",
                        updated_at: new Date().toISOString(),
                      }
                    : item,
                ),
              );
              setRescheduleBooking(null);
            }}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Booking management</p>
                <h2>Reschedule booking</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setRescheduleBooking(null)}
                aria-label="Close reschedule form"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-content booking-edit-form">
              <div className="reschedule-current">
                <span>Current booking</span>
                <strong>
                  {rescheduleBooking.booking_reference} ·{" "}
                  {formatTime(rescheduleBooking.slot.start_time)} –{" "}
                  {formatTime(rescheduleBooking.slot.end_time)}
                </strong>
              </div>
              <div className="slot-picker-grid">
                <label className="field">
                  <span>New date</span>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(event) => {
                      setRescheduleDate(event.target.value);
                      setNewSlotId("");
                    }}
                    required
                  />
                </label>
                <label className="field">
                  <span>New available slot</span>
                  <select
                    value={newSlotId}
                    onChange={(event) => setNewSlotId(event.target.value)}
                    required
                  >
                    <option value="">Select a slot</option>
                    {dateWiseSlots
                      .filter((slot) => slot.date === rescheduleDate)
                      .map((slot) => (
                        <option
                          key={slot.id}
                          value={slot.id}
                          disabled={slot.status !== "AVAILABLE"}
                        >
                          {formatTime(slot.start_time)} –{" "}
                          {formatTime(slot.end_time)} · NPR{" "}
                          {Number(slot.price).toLocaleString()} ·{" "}
                          {labelSlotStatus(slot.status)}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <p className="helper-text reschedule-helper">
                Only available slots can be selected. The request will send the
                new slot ID.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setRescheduleBooking(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Reschedule booking
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      {reminderModal && (
        <ReminderModal
          reminderModal={reminderModal}
          reminders={reminders}
          loadingHistory={loadingReminderHistory}
          setReminders={setReminders}
          onClose={() => setReminderModal(null)}
        />
      )}{" "}
    </div>
  );
}

function ReminderModal({
  reminderModal,
  reminders,
  loadingHistory,
  setReminders,
  onClose,
}: {
  reminderModal: { booking: Booking; mode: "send" | "history" };
  reminders: Reminder[];
  loadingHistory: boolean;
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  onClose: () => void;
}) {
  const bookingReminders = reminders.filter(
    (reminder) =>
      reminder.booking === reminderModal.booking.id ||
      reminder.booking_reference === reminderModal.booking.booking_reference,
  );
  const send = () => {
    const now = new Date().toISOString();
    setReminders((items) => [
      {
        id: crypto.randomUUID(),
        booking: reminderModal.booking.id,
        booking_reference: reminderModal.booking.booking_reference,
        reminder_type: "MANUAL",
        scheduled_at: now,
        sent_at: now,
        status: "SENT",
        error_message: "",
        created_at: now,
      },
      ...items,
    ]);
    onClose();
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="contact-modal booking-modal reminder-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Booking reminders</p>
            <h2>
              {reminderModal.mode === "send"
                ? "Send reminder"
                : "Reminder history"}
            </h2>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close reminder modal"
          >
            <X size={18} />
          </button>
        </div>
        {reminderModal.mode === "send" ? (
          <div className="modal-content">
            <p className="reminder-copy">
              Send a booking reminder to{" "}
              <strong>{reminderModal.booking.full_name}</strong> at{" "}
              {reminderModal.booking.email}?
            </p>
            <div className="reminder-preview">
              <span>Reminder preview</span>
              <p>
                Your booking {reminderModal.booking.booking_reference} is
                scheduled for {reminderModal.booking.slot.date},{" "}
                {formatTime(reminderModal.booking.slot.start_time)} –{" "}
                {formatTime(reminderModal.booking.slot.end_time)}.
              </p>
            </div>
            <div className="modal-actions">
              <button className="secondary-button" onClick={onClose}>
                Cancel
              </button>
              <button className="primary-button" onClick={send}>
                <BellRing size={16} />
                Send reminder
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-content">
            <div className="reminder-booking-label">
              <span>{reminderModal.booking.booking_reference}</span>
              <strong>{reminderModal.booking.full_name}</strong>
            </div>
            {loadingHistory ? <ReminderHistorySkeleton /> : bookingReminders.map((reminder) => (
              <div className="reminder-history-item" key={reminder.id}>
                <div
                  className={`reminder-history-dot ${reminder.status.toLowerCase()}`}
                >
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <strong>
                    {reminder.reminder_type === "MANUAL"
                      ? "Manual reminder"
                      : "Automatic one hour reminder"}
                  </strong>
                  <p>
                    {reminder.status === "SENT"
                      ? `Sent at ${formatDate(reminder.sent_at || reminder.scheduled_at)}`
                      : reminder.status === "FAILED"
                        ? reminder.error_message || "Failed to send"
                        : `Scheduled at ${formatDate(reminder.scheduled_at)}`}
                  </p>
                  <time>Created {formatDate(reminder.created_at)}</time>
                </div>
                <span
                  className={`reminder-delivered ${reminder.status.toLowerCase()}`}
                >
                  {reminder.status === "SENT"
                    ? "Sent"
                    : reminder.status === "FAILED"
                      ? "Failed"
                      : "Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReminderHistorySkeleton() {
  return <div className="reminder-history-skeleton" aria-busy="true" aria-label="Loading reminder history">{Array.from({ length: 3 }, (_, index) => <div className="reminder-history-item" key={index}><i className="reminder-skeleton-dot" /><div><i className="reminder-skeleton-title" /><i className="reminder-skeleton-copy" /><i className="reminder-skeleton-time" /></div><i className="reminder-skeleton-status" /></div>)}</div>
}

function ModalData({ label, value }: { label: string; value: string }) {
  return (
    <div className="modal-data">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
function labelSlotStatus(value: string) {
  return (
    (
      {
        AVAILABLE: "Available",
        BOOKED: "Booked",
        BLOCKED: "Blocked",
      } as Record<string, string>
    )[value] || value
  );
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
function labelSource(value: string) {
  return value === "ADMIN" ? "Admin" : "User";
}
function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}
