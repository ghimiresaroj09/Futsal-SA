import { useState, useEffect } from "react";
import { Image, Plus, Save, X, Pencil, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { authFetch } from "../lib/api";

type TabType = "hero" | "arena" | "carousel" | "why-us";

export function CMSHomePage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("hero");
  const [saving, setSaving] = useState(false);

  // Hero Section State
  const [heroData, setHeroData] = useState({
    title_one: "Play Hard.",
    title_two: "Play Together.",
    description:
      "Book your futsal court, choose your preferred time slot, and get your team ready for the next match at Nexus FMS Futsal.",
    image: null as File | null,
    imagePreview: "",
    stats: [
      { label: "Opening Hours", value: "6 AM - 10 PM" },
      { label: "Matches Played", value: "500+" },
      { label: "Courts Available", value: "3" },
    ],
  });

  // Arena State
  const [arenaData, setArenaData] = useState({
    title: "Arena",
    description: "Experience our world-class futsal arena",
    features: [] as string[],
  });

  // Carousel State
  const [carouselImages, setCarouselImages] = useState<
    Array<{
      id: string;
      image_url: string;
      alt_text: string;
      sort_order: number;
      is_active: boolean;
    }>
  >([]);
  const [carouselPagination, setCarouselPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    rowsPerPage: 10,
  });
  const [carouselSearch, setCarouselSearch] = useState("");
  const [carouselStatusFilter, setCarouselStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showCarouselDialog, setShowCarouselDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCarouselImage, setSelectedCarouselImage] = useState<any>(null);
  const [editingCarousel, setEditingCarousel] = useState<string | null>(null);
  const [carouselForm, setCarouselForm] = useState({
    image: null as File | null,
    imagePreview: "",
    alt_text: "",
    sort_order: 1,
    is_active: true,
  });

  // Why Us State
  const [whyUsData, setWhyUsData] = useState({
    title: "Why Choose Us",
    description: "Discover what makes our futsal arena the best choice",
    features: [
      { icon_code: "fa-solid fa-trophy", title: "Professional Courts", description: "High-quality turf" },
      { icon_code: "fa-solid fa-mobile-screen", title: "Easy Booking", description: "Book online anytime" },
      { icon_code: "fa-solid fa-dollar-sign", title: "Affordable Rates", description: "Best prices in town" },
    ],
  });
  const [loading, setLoading] = useState(true);

  // Fetch existing data on component mount
  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const apiBase = import.meta.env.DEV
          ? "/backend"
          : import.meta.env.VITE_API_BASE_URL || "";

        const response = await authFetch(
          `${apiBase}/api/v1/cms/homepage/hero-section/`,
        );
        const body = await response.json().catch(() => ({}));

        if (response.ok && body.success && body.data) {
          setHeroData({
            title_one: body.data.title_one || "",
            title_two: body.data.title_two || "",
            description: body.data.description || "",
            image: null,
            imagePreview: body.data.image_url || "",
            stats: body.data.stats || [
              { label: "", value: "" },
              { label: "", value: "" },
              { label: "", value: "" },
            ],
          });
        }
      } catch (error) {
        console.error("Failed to fetch hero data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchArenaData = async () => {
      try {
        const apiBase = import.meta.env.DEV
          ? "/backend"
          : import.meta.env.VITE_API_BASE_URL || "";

        const response = await authFetch(`${apiBase}/api/v1/cms/homepage/arena/`);
        const body = await response.json().catch(() => ({}));

        if (response.ok && body.success && body.data) {
          setArenaData({
            title: body.data.title || "",
            description: body.data.description || "",
            features: body.data.features || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch arena data:", error);
      }
    };

    const fetchWhyUsData = async () => {
      try {
        const apiBase = import.meta.env.DEV
          ? "/backend"
          : import.meta.env.VITE_API_BASE_URL || "";

        const response = await authFetch(`${apiBase}/api/v1/cms/homepage/why-us/`);
        const body = await response.json().catch(() => ({}));

        if (response.ok && body.success && body.data) {
          setWhyUsData({
            title: body.data.title || "",
            description: body.data.description || "",
            features: (body.data.features || []).map((f: any) => ({
              icon_code: f.iconcode || f.icon_code || "",
              title: f.title || "",
              description: f.description || "",
            })),
          });
        }
      } catch (error) {
        console.error("Failed to fetch why us data:", error);
      }
    };

    void fetchHeroData();
    void fetchArenaData();
    void fetchWhyUsData();
  }, []);

  // Separate effect for carousel data with dependencies
  useEffect(() => {
    if (activeTab === "carousel") {
      const fetchCarouselData = async () => {
        try {
          const apiBase = import.meta.env.DEV
            ? "/backend"
            : import.meta.env.VITE_API_BASE_URL || "";

          const params = new URLSearchParams();
          params.append("page", carouselPagination.currentPage.toString());
          params.append("page_size", carouselPagination.rowsPerPage.toString());
          
          if (carouselSearch) {
            params.append("search", carouselSearch);
          }
          
          if (carouselStatusFilter !== "all") {
            params.append("is_active", carouselStatusFilter === "active" ? "true" : "false");
          }

          const response = await authFetch(
            `${apiBase}/api/v1/cms/homepage/carousel/?${params.toString()}`
          );
          const body = await response.json().catch(() => ({}));

          if (response.ok && body.success && body.data) {
            setCarouselImages(body.data.results || []);
            setCarouselPagination((prev) => ({
              ...prev,
              count: body.data.count || 0,
              next: body.data.next,
              previous: body.data.previous,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch carousel data:", error);
        }
      };

      void fetchCarouselData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, carouselPagination.currentPage, carouselPagination.rowsPerPage, carouselSearch, carouselStatusFilter]);

  const handleArenaFeatureAdd = () => {
    setArenaData({
      ...arenaData,
      features: [...arenaData.features, ""],
    });
  };

  const handleArenaFeatureRemove = (index: number) => {
    setArenaData({
      ...arenaData,
      features: arenaData.features.filter((_, i) => i !== index),
    });
  };

  const handleArenaFeatureChange = (index: number, value: string) => {
    const newFeatures = [...arenaData.features];
    newFeatures[index] = value;
    setArenaData({
      ...arenaData,
      features: newFeatures,
    });
  };

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroData({
        ...heroData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleCarouselImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCarouselForm({
        ...carouselForm,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const refreshCarouselData = async () => {
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const params = new URLSearchParams();
      params.append("page", carouselPagination.currentPage.toString());
      params.append("page_size", carouselPagination.rowsPerPage.toString());
      
      if (carouselSearch) {
        params.append("search", carouselSearch);
      }
      
      if (carouselStatusFilter !== "all") {
        params.append("is_active", carouselStatusFilter === "active" ? "true" : "false");
      }

      const response = await authFetch(
        `${apiBase}/api/v1/cms/homepage/carousel/?${params.toString()}`
      );
      const body = await response.json().catch(() => ({}));

      if (response.ok && body.success && body.data) {
        setCarouselImages(body.data.results || []);
        setCarouselPagination((prev) => ({
          ...prev,
          count: body.data.count || 0,
          next: body.data.next,
          previous: body.data.previous,
        }));
      }
    } catch (error) {
      console.error("Failed to refresh carousel data:", error);
    }
  };

  const handleCarouselAdd = () => {
    setEditingCarousel(null);
    setCarouselForm({
      image: null,
      imagePreview: "",
      alt_text: "",
      sort_order: carouselImages.length + 1,
      is_active: true,
    });
    setShowCarouselDialog(true);
  };

  const handleCarouselEdit = (item: any) => {
    setEditingCarousel(item.id);
    setCarouselForm({
      image: null,
      imagePreview: item.image_url,
      alt_text: item.alt_text,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setShowCarouselDialog(true);
  };

  const handleCarouselSave = async () => {
    if (!carouselForm.alt_text.trim()) {
      showToast("Alt text is required", "error");
      return;
    }

    if (!editingCarousel && !carouselForm.image) {
      showToast("Please select an image", "error");
      return;
    }

    setSaving(true);
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const formData = new FormData();
      if (carouselForm.image) {
        formData.append("image", carouselForm.image);
      }
      formData.append("alt_text", carouselForm.alt_text);
      formData.append("sort_order", carouselForm.sort_order.toString());
      formData.append("is_active", carouselForm.is_active.toString());

      const url = editingCarousel
        ? `${apiBase}/api/v1/cms/homepage/carousel/${editingCarousel}/`
        : `${apiBase}/api/v1/cms/homepage/carousel/`;
      
      const method = editingCarousel ? "PATCH" : "POST";

      const response = await authFetch(url, {
        method,
        body: formData,
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body?.message || "Failed to save carousel image");
      }

      showToast(
        body.message || `Carousel image ${editingCarousel ? "updated" : "added"} successfully`,
        "success",
      );

      setShowCarouselDialog(false);
      // Refresh carousel data immediately
      await refreshCarouselData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save carousel image",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCarouselDelete = async (id: string) => {
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const response = await authFetch(
        `${apiBase}/api/v1/cms/homepage/carousel/${id}/`,
        { method: "DELETE" },
      );

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body?.message || "Failed to delete carousel image");
      }

      showToast(body.message || "Carousel image deleted successfully", "success");
      setShowDeleteDialog(false);
      setSelectedCarouselImage(null);
      // Refresh data immediately
      await refreshCarouselData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete carousel image",
        "error",
      );
    }
  };

  const handleViewCarousel = (item: any) => {
    setSelectedCarouselImage(item);
    setShowViewDialog(true);
  };

  const handleDeleteCarouselClick = (item: any) => {
    setSelectedCarouselImage(item);
    setShowDeleteDialog(true);
  };

  const handleWhyUsAdd = () => {
    setWhyUsData({
      ...whyUsData,
      features: [
        ...whyUsData.features,
        { icon_code: "fa-solid fa-star", title: "", description: "" },
      ],
    });
  };

  const handleWhyUsRemove = (index: number) => {
    setWhyUsData({
      ...whyUsData,
      features: whyUsData.features.filter((_, i) => i !== index),
    });
  };

  const handleWhyUsChange = (
    index: number,
    field: "icon_code" | "title" | "description",
    value: string,
  ) => {
    const newFeatures = [...whyUsData.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setWhyUsData({
      ...whyUsData,
      features: newFeatures,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      // Save based on active tab
      if (activeTab === "hero") {
        const formData = new FormData();
        formData.append("title_one", heroData.title_one);
        formData.append("title_two", heroData.title_two);
        formData.append("description", heroData.description);
        formData.append("stats", JSON.stringify(heroData.stats));
        if (heroData.image) {
          formData.append("image", heroData.image);
        }

        const response = await authFetch(
          `${apiBase}/api/v1/cms/homepage/hero-section/`,
          {
            method: "PATCH",
            body: formData,
          },
        );

        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) {
          throw new Error(body?.message || "Failed to save hero section");
        }

        showToast(body.message || "Hero section saved successfully", "success");
      } else if (activeTab === "arena") {
        const response = await authFetch(`${apiBase}/api/v1/cms/homepage/arena/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: arenaData.title,
            description: arenaData.description,
            features: arenaData.features.filter((f) => f.trim() !== ""),
          }),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) {
          throw new Error(body?.message || "Failed to save arena section");
        }

        showToast(body.message || "Arena section saved successfully", "success");
      } else if (activeTab === "why-us") {
        const response = await authFetch(
          `${apiBase}/api/v1/cms/homepage/why-us/`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: whyUsData.title,
              description: whyUsData.description,
              features: whyUsData.features
                .filter(
                  (f) => f.title.trim() !== "" || f.description.trim() !== "",
                )
                .map((f) => ({
                  iconcode: f.icon_code,
                  title: f.title,
                  description: f.description,
                })),
            }),
          },
        );

        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) {
          throw new Error(body?.message || "Failed to save why us section");
        }

        showToast(
          body.message || "Why Us section saved successfully",
          "success",
        );
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save changes",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cms-home-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Content Management</p>
          <h1>Home Page</h1>
          <p className="muted">Manage your home page content and sections.</p>
        </div>
      </div>

      <div className="cms-tabs">
        <button
          className={activeTab === "hero" ? "active" : ""}
          onClick={() => setActiveTab("hero")}
        >
          Hero Section
        </button>
        <button
          className={activeTab === "arena" ? "active" : ""}
          onClick={() => setActiveTab("arena")}
        >
          Arena
        </button>
        <button
          className={activeTab === "carousel" ? "active" : ""}
          onClick={() => setActiveTab("carousel")}
        >
          Carousel
        </button>
        <button
          className={activeTab === "why-us" ? "active" : ""}
          onClick={() => setActiveTab("why-us")}
        >
          Why Us
        </button>
      </div>

      <section className="cms-content-card">
        {loading && activeTab === "hero" ? (
          <div className="cms-loading">
            <p>Loading hero section data...</p>
          </div>
        ) : (
          <>
            {activeTab === "hero" && (
          <div className="cms-section">
            <h2>Hero Section</h2>
            <p className="section-description">
              Manage the main hero section of your home page
            </p>

            <div className="cms-form">
              <label className="field">
                <span>Title (First Line)</span>
                <input
                  type="text"
                  value={heroData.title_one}
                  onChange={(e) =>
                    setHeroData({ ...heroData, title_one: e.target.value })
                  }
                  placeholder="e.g., Play Hard."
                />
              </label>

              <label className="field">
                <span>Title (Second Line)</span>
                <input
                  type="text"
                  value={heroData.title_two}
                  onChange={(e) =>
                    setHeroData({ ...heroData, title_two: e.target.value })
                  }
                  placeholder="e.g., Play Together."
                />
              </label>

              <label className="field">
                <span>Description</span>
                <textarea
                  rows={4}
                  value={heroData.description}
                  onChange={(e) =>
                    setHeroData({ ...heroData, description: e.target.value })
                  }
                  placeholder="Enter hero section description"
                />
              </label>

              <label className="field">
                <span>Hero Background Image</span>
                <div className="image-upload">
                  {heroData.imagePreview ? (
                    <div className="image-preview">
                      <img src={heroData.imagePreview} alt="Hero preview" />
                      <button
                        className="remove-image"
                        onClick={() =>
                          setHeroData({
                            ...heroData,
                            image: null,
                            imagePreview: "",
                          })
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="upload-placeholder">
                      <Image size={32} />
                      <span>Click to upload image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHeroImageChange}
                        hidden
                      />
                    </label>
                  )}
                </div>
              </label>

              <div className="stats-section">
                <h3>Statistics Section</h3>
                <div className="stats-grid">
                  {heroData.stats.map((stat, index) => (
                    <div key={index} className="stat-group">
                      <label className="field">
                        <span>Stat {index + 1} Label</span>
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => {
                            const newStats = [...heroData.stats];
                            newStats[index] = {
                              ...newStats[index],
                              label: e.target.value,
                            };
                            setHeroData({ ...heroData, stats: newStats });
                          }}
                          placeholder="e.g., Opening Hours"
                        />
                      </label>
                      <label className="field">
                        <span>Stat {index + 1} Value</span>
                        <input
                          type="text"
                          value={stat.value}
                          onChange={(e) => {
                            const newStats = [...heroData.stats];
                            newStats[index] = {
                              ...newStats[index],
                              value: e.target.value,
                            };
                            setHeroData({ ...heroData, stats: newStats });
                          }}
                          placeholder="e.g., 6 AM - 10 PM"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cms-actions">
                <button
                  className="primary-button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "arena" && (
          <div className="cms-section">
            <h2>Arena Section</h2>
            <p className="section-description">
              Showcase your futsal arena with title, description, and features
            </p>

            <div className="cms-form">
              <label className="field">
                <span>Title</span>
                <input
                  type="text"
                  value={arenaData.title}
                  onChange={(e) =>
                    setArenaData({ ...arenaData, title: e.target.value })
                  }
                  placeholder="e.g., Arena"
                />
              </label>

              <label className="field">
                <span>Description</span>
                <textarea
                  rows={4}
                  value={arenaData.description}
                  onChange={(e) =>
                    setArenaData({ ...arenaData, description: e.target.value })
                  }
                  placeholder="Describe your arena"
                />
              </label>

              <div className="features-section">
                <div className="features-header">
                  <h3>Features</h3>
                  <button
                    className="secondary-button"
                    onClick={handleArenaFeatureAdd}
                  >
                    <Plus size={16} />
                    Add Feature
                  </button>
                </div>

                <div className="features-list">
                  {arenaData.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) =>
                          handleArenaFeatureChange(index, e.target.value)
                        }
                        placeholder="e.g., High-quality turf"
                      />
                      <button
                        className="icon-button danger"
                        onClick={() => handleArenaFeatureRemove(index)}
                        title="Remove feature"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {arenaData.features.length === 0 && (
                  <div className="empty-state">
                    <p>No features added yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="cms-actions">
              <button
                className="primary-button"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "carousel" && (
          <div className="cms-section">
            <div className="section-header">
              <div>
                <h2>Carousel Images</h2>
                <p className="section-description">
                  Manage carousel images for the home page
                </p>
              </div>
              <button className="primary-button" onClick={handleCarouselAdd}>
                <Plus size={16} />
                Add Image
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="filters-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by alt text..."
                  value={carouselSearch}
                  onChange={(e) => {
                    setCarouselSearch(e.target.value);
                    setCarouselPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                />
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select
                  value={carouselStatusFilter}
                  onChange={(e) => {
                    setCarouselStatusFilter(e.target.value as "all" | "active" | "inactive");
                    setCarouselPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {carouselImages.length > 0 ? (
              <>
                <div className="table-scroll">
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th className="sn-col">SN</th>
                        <th>Image</th>
                        <th>Alt Text</th>
                        <th>Order</th>
                        <th>Status</th>
                        <th className="booking-actions-heading">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carouselImages.map((item, index) => (
                        <tr key={item.id}>
                          <td className="sn-col">
                            {(carouselPagination.currentPage - 1) *
                              carouselPagination.rowsPerPage +
                              index +
                              1}
                          </td>
                          <td>
                            <img
                              src={item.image_url}
                              alt={item.alt_text}
                              className="carousel-table-thumbnail"
                            />
                          </td>
                          <td>
                            <span className="table-name">{item.alt_text}</span>
                          </td>
                          <td>
                            <span className="amount-cell">{item.sort_order}</span>
                          </td>
                          <td>
                            <span
                              className={`booking-status ${item.is_active ? "confirmed" : "cancelled"}`}
                            >
                              {item.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <div className="booking-actions">
                              <button
                                title="View image"
                                aria-label="View image"
                                onClick={() => handleViewCarousel(item)}
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                title="Edit image"
                                aria-label="Edit image"
                                onClick={() => handleCarouselEdit(item)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                title="Delete image"
                                aria-label="Delete image"
                                className="danger-action"
                                onClick={() => handleDeleteCarouselClick(item)}
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
                        value={carouselPagination.rowsPerPage}
                        onChange={(e) => {
                          setCarouselPagination((prev) => ({
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
                      {(carouselPagination.currentPage - 1) *
                        carouselPagination.rowsPerPage +
                        1}
                      –
                      {Math.min(
                        carouselPagination.currentPage * carouselPagination.rowsPerPage,
                        carouselPagination.count,
                      )}{" "}
                      of {carouselPagination.count}
                    </div>
                  </div>
                  <div className="pagination-controls">
                    <button
                      onClick={() =>
                        setCarouselPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage - 1,
                        }))
                      }
                      disabled={!carouselPagination.previous}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="page-number">
                      Page {carouselPagination.currentPage} of{" "}
                      {Math.ceil(
                        carouselPagination.count / carouselPagination.rowsPerPage,
                      )}
                    </span>
                    <button
                      onClick={() =>
                        setCarouselPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage + 1,
                        }))
                      }
                      disabled={!carouselPagination.next}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <Image size={48} />
                <p>No carousel images found</p>
              </div>
            )}
          </div>
        )}

        {/* Carousel Dialog */}
        {showCarouselDialog && (
          <div className="dialog-overlay" onClick={() => setShowCarouselDialog(false)}>
            <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>{editingCarousel ? "Edit" : "Add"} Carousel Image</h3>
                <button
                  className="icon-button"
                  onClick={() => setShowCarouselDialog(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="dialog-body">
                {carouselForm.imagePreview && (
                  <div className="image-preview-container">
                    <img src={carouselForm.imagePreview} alt="Preview" />
                  </div>
                )}

                <label className="field">
                  <span>
                    Image {!editingCarousel && <span className="required">*</span>}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCarouselImageSelect}
                  />
                </label>

                <label className="field">
                  <span>
                    Alt Text <span className="required">*</span>
                  </span>
                  <input
                    type="text"
                    value={carouselForm.alt_text}
                    onChange={(e) =>
                      setCarouselForm({ ...carouselForm, alt_text: e.target.value })
                    }
                    placeholder="e.g., Arena view from entrance"
                  />
                </label>

                <div className="field-row">
                  <label className="field">
                    <span>Sort Order</span>
                    <input
                      type="number"
                      value={carouselForm.sort_order}
                      onChange={(e) =>
                        setCarouselForm({
                          ...carouselForm,
                          sort_order: parseInt(e.target.value) || 1,
                        })
                      }
                      min="1"
                    />
                  </label>

                  <label className="field checkbox-field">
                    <input
                      type="checkbox"
                      checked={carouselForm.is_active}
                      onChange={(e) =>
                        setCarouselForm({ ...carouselForm, is_active: e.target.checked })
                      }
                    />
                    <span>Show in carousel</span>
                  </label>
                </div>
              </div>

              <div className="dialog-footer">
                <button
                  className="secondary-button"
                  onClick={() => setShowCarouselDialog(false)}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={handleCarouselSave}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Carousel Dialog */}
        {showViewDialog && selectedCarouselImage && (
          <div className="dialog-overlay" onClick={() => setShowViewDialog(false)}>
            <div className="dialog-content view-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>View Carousel Image</h3>
                <button
                  className="icon-button"
                  onClick={() => setShowViewDialog(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="dialog-body">
                <div className="image-preview-container view-image-large">
                  <img src={selectedCarouselImage.image_url} alt={selectedCarouselImage.alt_text} />
                </div>

                <div className="view-details">
                  <div className="view-detail-item">
                    <span className="detail-label">Alt Text</span>
                    <span className="detail-value">{selectedCarouselImage.alt_text}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Sort Order</span>
                    <span className="detail-value">{selectedCarouselImage.sort_order}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Status</span>
                    <span className={`booking-status ${selectedCarouselImage.is_active ? "confirmed" : "cancelled"}`}>
                      {selectedCarouselImage.is_active ? "Active" : "Inactive"}
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
        {showDeleteDialog && selectedCarouselImage && (
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
                  <h4>Delete this carousel image?</h4>
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
                  onClick={() => handleCarouselDelete(selectedCarouselImage.id)}
                >
                  Delete image
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "why-us" && (
          <div className="cms-section">
            <h2>Why Us Section</h2>
            <p className="section-description">
              Highlight the key features and benefits of your futsal arena
            </p>

            <div className="cms-form">
              <label className="field">
                <span>Section Title</span>
                <input
                  type="text"
                  value={whyUsData.title}
                  onChange={(e) =>
                    setWhyUsData({ ...whyUsData, title: e.target.value })
                  }
                  placeholder="e.g., Why Choose Us"
                />
              </label>

              <label className="field">
                <span>Section Description</span>
                <textarea
                  rows={3}
                  value={whyUsData.description}
                  onChange={(e) =>
                    setWhyUsData({ ...whyUsData, description: e.target.value })
                  }
                  placeholder="Brief description of this section"
                />
              </label>
            </div>

            <div className="features-section">
              <div className="features-header">
                <h3>Features</h3>
                <button className="secondary-button" onClick={handleWhyUsAdd}>
                  <Plus size={16} />
                  Add Feature
                </button>
              </div>

              <div className="why-us-items">
                {whyUsData.features.map((item, index) => (
                  <div key={index} className="why-us-item">
                    <div className="why-us-fields">
                      <label className="field">
                        <span>Icon Class</span>
                        <div className="icon-input-wrapper">
                          <input
                            type="text"
                            value={item.icon_code}
                            onChange={(e) =>
                              handleWhyUsChange(index, "icon_code", e.target.value)
                            }
                            placeholder="fa-solid fa-trophy"
                          />
                          {item.icon_code && (
                            <div className="icon-preview" title={item.icon_code}>
                              <i className={item.icon_code} aria-hidden="true"></i>
                            </div>
                          )}
                        </div>
                      </label>

                      <label className="field">
                        <span>Title</span>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            handleWhyUsChange(index, "title", e.target.value)
                          }
                          placeholder="e.g., Professional Courts"
                        />
                      </label>

                      <label className="field">
                        <span>Description</span>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleWhyUsChange(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="e.g., High-quality turf and facilities"
                        />
                      </label>
                    </div>

                    <button
                      className="icon-button danger"
                      onClick={() => handleWhyUsRemove(index)}
                      title="Remove item"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {whyUsData.features.length === 0 && (
                <div className="empty-state">
                  <p>No features added yet</p>
                </div>
              )}
            </div>

            <div className="cms-actions">
              <button
                className="primary-button"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </section>
    </div>
  );
}
