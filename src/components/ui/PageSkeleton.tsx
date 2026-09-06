import { useEffect, useState } from "react";

type PageSkeletonProps = {
  variant?: "cards" | "table" | "form";
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageSkeleton({
  variant = "cards",
  eyebrow,
  title,
  description,
}: PageSkeletonProps) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setTimedOut(true), 12000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (timedOut)
    return (
      <div className="empty-page">
        <h1>{title} is unavailable</h1>
        <p>
          We couldn't load data from the server. Please check your connection
          and try again.
        </p>
        <button
          className="primary-button"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );

  const rows = variant === "table" ? 6 : 3;
  return (
    <div
      className="page-skeleton"
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="page-heading skeleton-page-heading">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {description && <p className="muted">{description}</p>}
        </div>
      </div>
      {variant === "cards" ? (
        <>
          <div className="skeleton-cards">
            {Array.from({ length: 4 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
          <div className="skeleton-panels">
            <i />
            <i />
          </div>
          <div className="skeleton-panels lower">
            <i />
            <i />
          </div>
        </>
      ) : (
        <section className={`skeleton-surface ${variant}`}>
          {Array.from({ length: rows }, (_, index) => (
            <div className="skeleton-row" key={index}>
              <i />
              <i />
              <i />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
