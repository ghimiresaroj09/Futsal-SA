import { useState, useEffect } from "react";
import { Plus, Save, X, Pencil, Eye, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { authFetch } from "../lib/api";

type Testimonial = {
  id: string;
  full_name: string;
  title: string;
  image_url: string;
  content: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function CMSTestimonialsPage() {
  const { showToast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    rowsPerPage: 10,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    title: "",
    image: null as File | null,
    imagePreview: "",
    content: "",
    sort_order: 1,
    is_active: true,
  });

  // Fetch testimonials
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const apiBase = import.meta.env.DEV
          ? "/backend"
          : import.meta.env.VITE_API_BASE_URL || "";

        const params = new URLSearchParams();
        params.append("page", pagination.currentPage.toString());
        params.append("page_size", pagination.rowsPerPage.toString());
        
        if (search) {
          params.append("search", search);
        }
        
        if (statusFilter !== "all") {
          params.append("is_active", statusFilter === "active" ? "true" : "false");
        }

        const response = await authFetch(
          `${apiBase}/api/v1/cms/testimonials/?${params.toString()}`
        );
        const body = await response.json().catch(() => ({}));

        if (response.ok && body.success && body.data) {
          setTestimonials(body.data.results || []);
          setPagination((prev) => ({
            ...prev,
            count: body.data.count || 0,
            next: body.data.next,
            previous: body.data.previous,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
      }
    };

    void fetchTestimonials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, pagination.rowsPerPage, search, statusFilter]);

  const refreshData = async () => {
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const params = new URLSearchParams();
      params.append("page", pagination.currentPage.toString());
      params.append("page_size", pagination.rowsPerPage.toString());
      
      if (search) {
        params.append("search", search);
      }
      
      if (statusFilter !== "all") {
        params.append("is_active", statusFilter === "active" ? "true" : "false");
      }

      const response = await authFetch(
        `${apiBase}/api/v1/cms/testimonials/?${params.toString()}`
      );
      const body = await response.json().catch(() => ({}));

      if (response.ok && body.success && body.data) {
        setTestimonials(body.data.results || []);
        setPagination((prev) => ({
          ...prev,
          count: body.data.count || 0,
          next: body.data.next,
          previous: body.data.previous,
        }));
      }
    } catch (error) {
      console.error("Failed to refresh testimonials:", error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({
        ...form,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setForm({
      full_name: "",
      title: "",
      image: null,
      imagePreview: "",
      content: "",
      sort_order: testimonials.length + 1,
      is_active: true,
    });
    setShowDialog(true);
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditing(testimonial.id);
    setForm({
      full_name: testimonial.full_name,
      title: testimonial.title,
      image: null,
      imagePreview: testimonial.image_url,
      content: testimonial.content,
      sort_order: testimonial.sort_order,
      is_active: testimonial.is_active,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      showToast("Full name is required", "error");
      return;
    }

    if (!form.title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    if (!form.content.trim()) {
      showToast("Content is required", "error");
      return;
    }

    setSaving(true);
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const formData = new FormData();
      if (form.image) {
        formData.append("image", form.image);
      }
      formData.append("full_name", form.full_name);
      formData.append("title", form.title);
      formData.append("content", form.content);
      formData.append("sort_order", form.sort_order.toString());
      formData.append("is_active", form.is_active.toString());

      const url = editing
        ? `${apiBase}/api/v1/cms/testimonials/${editing}/`
        : `${apiBase}/api/v1/cms/testimonials/`;
      
      const method = editing ? "PATCH" : "POST";

      const response = await authFetch(url, {
        method,
        body: formData,
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body?.message || "Failed to save testimonial");
      }

      showToast(
        body.message || `Testimonial ${editing ? "updated" : "added"} successfully`,
        "success",
      );

      setShowDialog(false);
      await refreshData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save testimonial",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const response = await authFetch(
        `${apiBase}/api/v1/cms/testimonials/${id}/`,
        { method: "DELETE" },
      );

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body?.message || "Failed to delete testimonial");
      }

      showToast(body.message || "Testimonial deleted successfully", "success");
      setShowDeleteDialog(false);
      setSelectedTestimonial(null);
      await refreshData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete testimonial",
        "error",
      );
    }
  };

  const handleView = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setShowViewDialog(true);
  };

  const handleDeleteClick = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setShowDeleteDialog(true);
  };

  return (
    <div className="cms-page">
      <header className="page-header">
        <div>
          <h1>Testimonials Management</h1>
          <p className="page-description">
            Manage customer testimonials and reviews
          </p>
        </div>
      </header>

      <div className="cms-content-card">
        <div className="cms-section">
          <div className="section-header">
            <div>
              <h2>Testimonials</h2>
              <p className="section-description">
                Showcase customer reviews and feedback
              </p>
            </div>
            <button className="primary-button" onClick={handleAdd}>
              <Plus size={16} />
              Add Testimonial
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="filters-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
              />
            </div>

            <div className="filter-group">
              <label>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "all" | "active" | "inactive");
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {testimonials.length > 0 ? (
            <>
              <div className="table-scroll">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th className="sn-col">SN</th>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Content</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th className="booking-actions-heading">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testimonials.map((testimonial, index) => (
                      <tr key={testimonial.id}>
                        <td className="sn-col">
                          {(pagination.currentPage - 1) *
                            pagination.rowsPerPage +
                            index +
                            1}
                        </td>
                        <td>
                          {testimonial.image_url ? (
                            <img
                              src={testimonial.image_url}
                              alt={testimonial.full_name}
                              className="testimonial-table-thumbnail"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {testimonial.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td>
                          {testimonial.full_name}
                        </td>
                        <td>
                          {testimonial.title}
                        </td>
                        <td>
                          {testimonial.content.substring(0, 50)}
                          {testimonial.content.length > 50 && "..."}
                        </td>
                        <td>
                          {testimonial.sort_order}
                        </td>
                        <td>
                          <span
                            className={`booking-status ${testimonial.is_active ? "confirmed" : "cancelled"}`}
                          >
                            {testimonial.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="booking-actions">
                            <button
                              title="View testimonial"
                              aria-label="View testimonial"
                              onClick={() => handleView(testimonial)}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              title="Edit testimonial"
                              aria-label="Edit testimonial"
                              onClick={() => handleEdit(testimonial)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              title="Delete testimonial"
                              aria-label="Delete testimonial"
                              className="danger-action"
                              onClick={() => handleDeleteClick(testimonial)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <div className="pagination-left">
                  <div className="booking-rows-select">
                    <label>Rows per page</label>
                    <select
                      value={pagination.rowsPerPage}
                      onChange={(e) => {
                        setPagination((prev) => ({
                          ...prev,
                          rowsPerPage: parseInt(e.target.value),
                          currentPage: 1,
                        }));
                      }}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                  <div className="pagination-info">
                    {(pagination.currentPage - 1) * pagination.rowsPerPage + 1}–
                    {Math.min(
                      pagination.currentPage * pagination.rowsPerPage,
                      pagination.count,
                    )}{" "}
                    of {pagination.count}
                  </div>
                </div>
                <div className="pagination-controls">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        currentPage: prev.currentPage - 1,
                      }))
                    }
                    disabled={!pagination.previous}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="page-number">
                    Page {pagination.currentPage} of{" "}
                    {Math.ceil(pagination.count / pagination.rowsPerPage)}
                  </span>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        currentPage: prev.currentPage + 1,
                      }))
                    }
                    disabled={!pagination.next}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Plus size={48} />
              <p>No testimonials found</p>
            </div>
          )}
        </div>

        {/* Add/Edit Dialog */}
        {showDialog && (
          <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
            <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>{editing ? "Edit" : "Add"} Testimonial</h3>
                <button
                  className="icon-button"
                  onClick={() => setShowDialog(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="dialog-body">
                {form.imagePreview && (
                  <div className="testimonial-image-preview">
                    <img src={form.imagePreview} alt="Preview" />
                  </div>
                )}

                <label className="field">
                  <span>Photo (Optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </label>

                <label className="field">
                  <span>
                    Full Name <span className="required">*</span>
                  </span>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    placeholder="e.g., John Doe"
                  />
                </label>

                <label className="field">
                  <span>
                    Title <span className="required">*</span>
                  </span>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g., Regular Player"
                  />
                </label>

                <label className="field">
                  <span>
                    Content <span className="required">*</span>
                  </span>
                  <textarea
                    rows={5}
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                    placeholder="Testimonial content/review"
                  />
                </label>

                <div className="field-row">
                  <label className="field">
                    <span>Sort Order</span>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          sort_order: parseInt(e.target.value) || 1,
                        })
                      }
                      min="1"
                    />
                  </label>

                  <label className="field checkbox-field">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm({ ...form, is_active: e.target.checked })
                      }
                    />
                    <span>Show on website</span>
                  </label>
                </div>
              </div>

              <div className="dialog-footer">
                <button
                  className="secondary-button"
                  onClick={() => setShowDialog(false)}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Dialog */}
        {showViewDialog && selectedTestimonial && (
          <div className="dialog-overlay" onClick={() => setShowViewDialog(false)}>
            <div className="dialog-content view-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>View Testimonial</h3>
                <button
                  className="icon-button"
                  onClick={() => setShowViewDialog(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="dialog-body">
                {selectedTestimonial.image_url && (
                  <div className="testimonial-image-preview">
                    <img src={selectedTestimonial.image_url} alt={selectedTestimonial.full_name} />
                  </div>
                )}

                <div className="view-details">
                  <div className="view-detail-item">
                    <span className="detail-label">Full Name</span>
                    <span className="detail-value">{selectedTestimonial.full_name}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Title</span>
                    <span className="detail-value">{selectedTestimonial.title}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Content</span>
                    <span className="detail-value">{selectedTestimonial.content}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Sort Order</span>
                    <span className="detail-value">{selectedTestimonial.sort_order}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Status</span>
                    <span className={`booking-status ${selectedTestimonial.is_active ? "confirmed" : "cancelled"}`}>
                      {selectedTestimonial.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="dialog-footer">
                <button
                  className="secondary-button"
                  onClick={() => setShowViewDialog(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && selectedTestimonial && (
          <div className="dialog-overlay" onClick={() => setShowDeleteDialog(false)}>
            <div className="dialog-content delete-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-body">
                <div className="delete-confirmation">
                  <div className="delete-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </div>
                  <h4>Delete this testimonial?</h4>
                  <p>This action cannot be undone.</p>
                </div>
              </div>

              <div className="dialog-footer">
                <button
                  className="secondary-button"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </button>
                <button
                  className="danger-button"
                  onClick={() => handleDelete(selectedTestimonial.id)}
                >
                  Delete testimonial
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
