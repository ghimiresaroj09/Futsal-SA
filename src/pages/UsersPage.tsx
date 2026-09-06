import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
  LoaderCircle,
  Mail,
  Phone,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../components/ui/Toast";
import { authFetch, authFetchAll } from "../lib/api";
import { PageSkeleton } from "../components/ui/PageSkeleton";

type User = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  profile_image: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
};
type Booking = {
  id: string;
  booking_reference: string;
  slot: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    price: string;
    status: string;
  };
  amount: string;
  status: string;
  payment_status: string;
};
type UsersResponse = {
  success: boolean;
  message: string;
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: User[];
  };
};
type HistoryResponse = {
  success: boolean;
  message: string;
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: Booking[];
  };
};

const apiBase = import.meta.env.DEV
  ? "/backend"
  : import.meta.env.VITE_API_BASE_URL || "";
const formatTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`2000-01-01T${value}`));
const label = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

export function UsersPage() {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [history, setHistory] = useState<Booking[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRows, setHistoryRows] = useState(10);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    let active = true;
    authFetchAll<User>(`${apiBase}/api/v1/admin/users/`)
      .then((users) => {
        if (active) setUserList(users);
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

  useEffect(() => {
    if (!historyUser) return;
    let active = true;
    setHistoryLoading(true);
    const params = new URLSearchParams({
      page: String(historyPage),
      page_size: String(historyRows),
    });
    authFetch(
      `${apiBase}/api/v1/admin/users/${historyUser.id}/booking-history/?${params}`,
    )
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success)
          throw new Error(body?.message || "Unable to load booking history.");
        return body as HistoryResponse;
      })
      .then((response) => {
        if (active) {
          setHistory(response.data.results);
          setHistoryCount(response.data.count);
        }
      })
      .catch((error: Error) => {
        if (active) {
          setHistory([]);
          showToast(error.message, "error");
        }
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [historyPage, historyRows, historyUser, showToast]);

  const filtered = useMemo(
    () =>
      userList.filter((user) =>
        `${user.full_name} ${user.email} ${user.phone_number}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [userList, query],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const visible = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const historyPages = Math.max(1, Math.ceil(historyCount / historyRows));
  const openHistory = (user: User) => {
    setHistoryUser(user);
    setHistoryPage(1);
    setHistoryRows(10);
    setHistory([]);
  };

  if (loading)
    return (
      <PageSkeleton
        variant="table"
        eyebrow="Workspace directory"
        title="Users"
        description="Manage the users registered in your workspace."
      />
    );
  return (
    <div className="users-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace directory</p>
          <h1>Users</h1>
          <p className="muted">
            Manage the users registered in your workspace.
          </p>
        </div>
      </div>
      <section className="table-card">
        <div className="table-toolbar">
          <div>
            <h2>All users</h2>
            <p>{filtered.length} total users</p>
          </div>
          <label className="table-search users-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search users"
            />
          </label>
        </div>
        <div className="table-scroll">
          <table className="users-table">
            <thead>
              <tr>
                <th className="sn-col">SN</th>
                <th>Profile</th>
                <th>Full name</th>
                <th>Email</th>
                <th>Phone number</th>
                <th className="actions-col">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((user, index) => (
                <tr key={user.id}>
                  <td className="sn-col">
                    {(page - 1) * rowsPerPage + index + 1}
                  </td>
                  <td>
                    <div className="user-table-avatar">
                      {user.profile_image ? (
                        <img src={user.profile_image} alt={user.full_name} />
                      ) : (
                        <span>
                          {user.full_name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <strong className="table-name">{user.full_name}</strong>
                  </td>
                  <td>
                    <span className="email-cell">
                      <Mail size={13} />
                      {user.email}
                    </span>
                  </td>
                  <td>
                    <span className="phone-cell">
                      <Phone size={13} />
                      {user.phone_number}
                    </span>
                  </td>
                  <td className="actions-col">
                    <button
                      className="row-action"
                      title="View booking history"
                      aria-label={`View ${user.full_name}'s booking history`}
                      onClick={() => openHistory(user)}
                    >
                      <History size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <label className="rows-select">
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
          <span className="page-count">
            {filtered.length ? (page - 1) * rowsPerPage + 1 : 0}–
            {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}
          </span>
          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((current) => current + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
      {historyUser && (
        <div className="modal-backdrop" onClick={() => setHistoryUser(null)}>
          <section
            className="contact-modal user-history-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Booking history</p>
                <h2>{historyUser.full_name}</h2>
                <p className="user-history-contact">
                  {historyUser.email} · {historyUser.phone_number}
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setHistoryUser(null)}
                aria-label="Close booking history"
              >
                <X size={18} />
              </button>
            </div>
            <div className="user-history-toolbar">
              <span>{historyCount} bookings</span>
            </div>
            <div className="table-scroll user-history-table">
              <table>
                <thead>
                  <tr>
                    <th className="sn-col">SN</th>
                    <th>Reference</th>
                    <th>Slot</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading ? (
                    Array.from({ length: 4 }, (_, index) => (
                      <tr className="history-skeleton-row" key={index}>
                        <td colSpan={6}>
                          <i />
                        </td>
                      </tr>
                    ))
                  ) : history.length ? (
                    history.map((booking, index) => (
                      <tr key={booking.id}>
                        <td className="sn-col">
                          {(historyPage - 1) * historyRows + index + 1}
                        </td>
                        <td>
                          <strong className="booking-ref">
                            {booking.booking_reference}
                          </strong>
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
                          <strong>
                            NPR {Number(booking.amount).toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          <span
                            className={`booking-status ${booking.status.toLowerCase()}`}
                          >
                            {label(booking.status)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`payment-status ${booking.payment_status.toLowerCase()}`}
                          >
                            {label(booking.payment_status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="table-empty">
                        No booking history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="table-footer user-history-footer">
              <label className="rows-select">
                Rows per page
                <select
                  value={historyRows}
                  onChange={(event) => {
                    setHistoryRows(Number(event.target.value));
                    setHistoryPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <span className="page-count">
                {historyCount ? (historyPage - 1) * historyRows + 1 : 0}–
                {Math.min(historyPage * historyRows, historyCount)} of{" "}
                {historyCount}
              </span>
              <div className="pagination">
                <button
                  disabled={historyPage === 1 || historyLoading}
                  onClick={() => setHistoryPage((current) => current - 1)}
                  aria-label="Previous history page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>
                  Page {historyPage} of {historyPages}
                </span>
                <button
                  disabled={historyPage >= historyPages || historyLoading}
                  onClick={() => setHistoryPage((current) => current + 1)}
                  aria-label="Next history page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
