import { Bell, Check, CheckCheck, CircleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import { authFetch } from "../lib/api";

type Notification = {
  id: string;
  booking: string;
  booking_reference: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  time_ago: string;
  redirect_url: string;
};
type Response = {
  success: boolean;
  message: string;
  data: { unread_count: number; results: Notification[] };
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const base = import.meta.env.DEV
      ? "/backend"
      : import.meta.env.VITE_API_BASE_URL || "";
    authFetch(`${base}/api/v1/admin/notifications/`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success)
          throw Error(body.message || "Unable to load notifications.");
        return body as Response;
      })
      .then((response) => {
        if (active) setItems(response.data.results);
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

  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          filter === "ALL" ||
          (filter === "UNREAD" ? !item.is_read : item.is_read),
      ),
    [items, filter],
  );
  const unread = items.filter((item) => !item.is_read).length;
  const markRead = async (id: string) => {
    setMarking(id);
    try {
      const base = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";
      const response = await authFetch(
        `${base}/api/v1/admin/notifications/${id}/mark-read/`,
        { method: "POST" },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success)
        throw new Error(
          body?.message || "Unable to mark notification as read.",
        );
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, is_read: true, read_at: new Date().toISOString() }
            : item,
        ),
      );
      window.dispatchEvent(
        new CustomEvent("notifications:unread-count", {
          detail: Math.max(unread - 1, 0),
        }),
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to mark notification as read.",
        "error",
      );
    } finally {
      setMarking(null);
    }
  };

  const markAllRead = async () => {
    const unreadItems = items.filter((item) => !item.is_read);
    if (!unreadItems.length) return;
    setMarking("all");
    try {
      const base = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";
      const response = await authFetch(
        `${base}/api/v1/admin/notifications/mark-all-read/`,
        { method: "POST" },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success)
        throw new Error(
          body?.message || "Unable to mark all notifications as read.",
        );
      setItems((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        })),
      );
      window.dispatchEvent(
        new CustomEvent("notifications:unread-count", { detail: 0 }),
      );
      showToast(
        body?.message || "All notifications marked as read.",
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to mark all notifications as read.",
        "error",
      );
    } finally {
      setMarking(null);
    }
  };

  return (
    <div className="notifications-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Notification center</p>
          <h1>Notifications</h1>
        </div>
        <button
          className="secondary-button"
          disabled={!unread || loading || Boolean(marking)}
          onClick={() => void markAllRead()}
        >
          <CheckCheck size={16} />
          {marking === "all" ? "Marking as read..." : "Mark all as read"}
        </button>
      </div>
      <section className="notifications-card">
        <div className="notification-toolbar">
          <div className="notification-tabs">
            {(["ALL", "UNREAD", "READ"] as const).map((value) => (
              <button
                key={value}
                className={filter === value ? "selected" : ""}
                onClick={() => setFilter(value)}
                disabled={loading}
              >
                {value === "ALL"
                  ? `All ${items.length}`
                  : value === "UNREAD"
                    ? `Unread ${unread}`
                    : "Read"}
              </button>
            ))}
          </div>
          <span className="notification-total">
            {loading
              ? "Loading notifications"
              : `${visible.length} notifications`}
          </span>
        </div>
        <div className="notification-list">
          {loading ? (
            <NotificationsSkeleton />
          ) : (
            <>
              {visible.map((item) => (
                <article
                  className={`notification-row ${item.is_read ? "is-read" : "is-unread"}`}
                  key={item.id}
                >
                  <div
                    className={`notification-icon ${item.title.toLowerCase().includes("cancel") ? "warning" : "booking"}`}
                  >
                    {item.title.toLowerCase().includes("cancel") ? (
                      <CircleAlert size={17} />
                    ) : (
                      <Bell size={17} />
                    )}
                  </div>
                  <div className="notification-body">
                    <h3>{item.title}</h3>
                    <p>{item.message}</p>
                    <time>{item.time_ago}</time>
                    <button
                      className="view-booking-link"
                      onClick={() =>
                        navigate(item.redirect_url.replace("/admin", ""))
                      }
                    >
                      View booking →
                    </button>
                  </div>
                  {!item.is_read ? (
                    <button
                      className="mark-read"
                      disabled={Boolean(marking)}
                      onClick={() => void markRead(item.id)}
                    >
                      <Check size={16} />
                      <span>
                        {marking === item.id ? "Marking..." : "Mark read"}
                      </span>
                    </button>
                  ) : (
                    <span className="read-label">Read</span>
                  )}
                </article>
              ))}
              {!visible.length && (
                <div className="empty-notifications">
                  <Bell size={24} />
                  <p>No notifications in this filter.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div
      className="notification-skeleton-list"
      aria-label="Loading notifications"
      aria-busy="true"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <article className="notification-row notification-skeleton" key={index}>
          <i className="notification-skeleton-icon" />
          <div className="notification-body">
            <i className="notification-skeleton-title" />
            <i className="notification-skeleton-copy" />
            <i className="notification-skeleton-time" />
          </div>
          <i className="notification-skeleton-action" />
        </article>
      ))}
    </div>
  );
}
