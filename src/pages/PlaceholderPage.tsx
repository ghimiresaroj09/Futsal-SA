import { Construction } from "lucide-react";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="empty-page">
      <div className="empty-icon">
        <Construction size={24} />
      </div>
      <h1>{title}</h1>
      <p>
        This page is ready for the next design pass. The route and shared
        dashboard shell are already wired up.
      </p>
    </div>
  );
}
