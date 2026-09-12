import { useState, useEffect } from "react";
import { Save, Plus, X, Trash2 } from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { authFetch } from "../lib/api";

type TabType = "hero";

type InfoItem = {
  iconcode: string;
  title: string;
  description: string;
};

type BookingsHero = {
  title: string;
  description: string;
  image_url: string;
  info: InfoItem[];
  updated_at: string;
};

export function CMSBookingsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroData, setHeroData] = useState({
    title: "",
    description: "",
    image: null as File | null,
    imagePreview: "",
    info: [] as InfoItem[],
  });

  // Fetch hero section data
  useEffect(() => {
    if (activeTab === "hero") {
      const fetchHeroData = async () => {
        try {
          const apiBase = import.meta.env.DEV
            ? "/backend"
            : import.meta.env.VITE_API_BASE_URL || "";

          const response = await authFetch(
            `${apiBase}/api/v1/cms/bookings/hero-section/`
          );
          const body = await response.json().catch(() => ({}));

          if (response.ok && body.success && body.data) {
            setHeroData({
              title: body.data.title || "",
              description: body.data.description || "",
              image: null,
              imagePreview: body.data.image_url || "",
              info: body.data.info || [],
            });
          }
        } catch (error) {
          console.error("Failed to fetch hero data:", error);
        } finally {
          setLoading(false);
        }
      };

      void fetchHeroData();
    }
  }, [activeTab]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroData({
        ...heroData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleAddInfo = () => {
    setHeroData({
      ...heroData,
      info: [
        ...heroData.info,
        { iconcode: "", title: "", description: "" },
      ],
    });
  };

  const handleRemoveInfo = (index: number) => {
    setHeroData({
      ...heroData,
      info: heroData.info.filter((_, i) => i !== index),
    });
  };

  const handleInfoChange = (
    index: number,
    field: keyof InfoItem,
    value: string
  ) => {
    const newInfo = [...heroData.info];
    newInfo[index][field] = value;
    setHeroData({ ...heroData, info: newInfo });
  };

  const handleSave = async () => {
    if (!heroData.title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    if (!heroData.description.trim()) {
      showToast("Description is required", "error");
      return;
    }

    setSaving(true);
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const formData = new FormData();
      if (heroData.image) {
        formData.append("image", heroData.image);
      }
      formData.append("title", heroData.title);
      formData.append("description", heroData.description);
      formData.append("info", JSON.stringify(heroData.info));

      const response = await authFetch(
        `${apiBase}/api/v1/cms/bookings/hero-section/`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body?.message || "Failed to save hero section");
      }

      showToast(
        body.message || "Hero section updated successfully",
        "success"
      );

      // Update preview with new image URL if returned
      if (body.data?.image_url) {
        setHeroData((prev) => ({
          ...prev,
          image: null,
          imagePreview: body.data.image_url,
        }));
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save hero section",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="cms-page">
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  return (
    <div className="cms-page">
      <header className="page-header">
        <div>
          <h1>CMS - Bookings Page</h1>
          <p className="page-description">
            Manage the bookings page content
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="cms-tabs">
        <button
          className={`cms-tab ${activeTab === "hero" ? "active" : ""}`}
          onClick={() => setActiveTab("hero")}
        >
          Hero Section
        </button>
      </div>

      <div className="cms-content-card">
        {/* Hero Section Tab */}
        {activeTab === "hero" && (
          <div className="cms-section">
            <div className="section-header">
              <div>
                <h2>Hero Section</h2>
                <p className="section-description">
                  Main hero content for the bookings page
                </p>
              </div>
            </div>

            <div className="form-section">
              {heroData.imagePreview && (
                <div className="image-preview-container">
                  <img src={heroData.imagePreview} alt="Hero preview" />
                </div>
              )}

              <label className="field">
                <span>Hero Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </label>

              <label className="field">
                <span>
                  Title <span className="required">*</span>
                </span>
                <input
                  type="text"
                  value={heroData.title}
                  onChange={(e) =>
                    setHeroData({ ...heroData, title: e.target.value })
                  }
                  placeholder="e.g., Book Your Court Today"
                />
              </label>

              <label className="field">
                <span>
                  Description <span className="required">*</span>
                </span>
                <textarea
                  rows={3}
                  value={heroData.description}
                  onChange={(e) =>
                    setHeroData({ ...heroData, description: e.target.value })
                  }
                  placeholder="Describe the booking process..."
                />
              </label>
            </div>

            <div className="form-section">
              <div className="section-header">
                <div>
                  <h3>Information Items</h3>
                  <p className="section-description">
                    Add key features or benefits (max 3-4 recommended)
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleAddInfo}
                >
                  <Plus size={16} />
                  Add item
                </button>
              </div>

              {heroData.info.length > 0 ? (
                <div className="info-items-list">
                  {heroData.info.map((item, index) => (
                    <div key={index} className="info-item-card">
                      <div className="info-item-header">
                        <h4>Item {index + 1}</h4>
                        <button
                          type="button"
                          className="icon-button danger-action"
                          onClick={() => handleRemoveInfo(index)}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="info-item-fields">
                        <label className="field">
                          <span>Icon Code (FontAwesome)</span>
                          <input
                            type="text"
                            value={item.iconcode}
                            onChange={(e) =>
                              handleInfoChange(index, "iconcode", e.target.value)
                            }
                            placeholder="e.g., fa-solid fa-calendar-check"
                          />
                        </label>

                        <label className="field">
                          <span>Title</span>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) =>
                              handleInfoChange(index, "title", e.target.value)
                            }
                            placeholder="e.g., Flexible Scheduling"
                          />
                        </label>

                        <label className="field">
                          <span>Description</span>
                          <textarea
                            rows={2}
                            value={item.description}
                            onChange={(e) =>
                              handleInfoChange(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Brief description..."
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Plus size={48} />
                  <p>No information items added yet</p>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleAddInfo}
                  >
                    Add first item
                  </button>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="form-actions">
              <button
                className="primary-button"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
