import { useState, useEffect } from "react";
import { Save, Plus, Trash2, X, Image } from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { ImageUpload } from "../components/ui/ImageUpload";
import { authFetch } from "../lib/api";

type TabType = "hero" | "story" | "community";

export function CMSAboutUsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("hero");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hero Section State
  const [heroData, setHeroData] = useState({
    title: "",
    description: "",
    image: null as File | null,
    imagePreview: "",
    years_in_game: "",
    matches_hosted: "",
    tournaments_run: "",
    players_in_community: "",
  });

  // Our Story State
  const [storyData, setStoryData] = useState({
    title: "",
    description: "",
    image: null as File | null,
    imagePreview: "",
    journey: [] as Array<{
      year: string;
      title: string;
      description: string;
      image: File | null;
      imagePreview: string;
    }>,
  });

  // Community State
  const [communityData, setCommunityData] = useState({
    title: "",
    description: "",
    image: null as File | null,
    imagePreview: "",
    features: [] as string[],
    team: [] as Array<{ 
      name: string; 
      role: string; 
      image: File | null;
      imagePreview: string;
    }>,
    rules: [] as Array<{ iconcode: string; title: string; description: string }>,
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
            `${apiBase}/api/v1/cms/about/hero-section/`
          );
          const body = await response.json().catch(() => ({}));

          if (response.ok && body.success && body.data) {
            setHeroData({
              title: body.data.title || "",
              description: body.data.description || "",
              image: null,
              imagePreview: body.data.image_url || "",
              years_in_game: String(body.data.years_in_game || ""),
              matches_hosted: String(body.data.matches_hosted || ""),
              tournaments_run: String(body.data.tournaments_run || ""),
              players_in_community: String(body.data.players_in_community || ""),
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

  // Fetch community data
  useEffect(() => {
    if (activeTab === "community") {
      const fetchCommunityData = async () => {
        try {
          const apiBase = import.meta.env.DEV
            ? "/backend"
            : import.meta.env.VITE_API_BASE_URL || "";

          const response = await authFetch(
            `${apiBase}/api/v1/cms/about/community/`
          );
          const body = await response.json().catch(() => ({}));

          if (response.ok && body.success && body.data) {
            setCommunityData({
              title: body.data.title || "",
              description: body.data.description || "",
              image: null,
              imagePreview: body.data.image_url || "",
              features: body.data.features || [],
              team: (body.data.team || []).map((member: any) => ({
                name: member.name || "",
                role: member.role || "",
                image: null,
                imagePreview: member.image || "",
              })),
              rules: body.data.rules || [],
            });
          }
        } catch (error) {
          console.error("Failed to fetch community data:", error);
        } finally {
          setLoading(false);
        }
      };

      void fetchCommunityData();
    }
  }, [activeTab]);

  // Fetch story data
  useEffect(() => {
    if (activeTab === "story") {
      const fetchStoryData = async () => {
        try {
          const apiBase = import.meta.env.DEV
            ? "/backend"
            : import.meta.env.VITE_API_BASE_URL || "";

          const response = await authFetch(
            `${apiBase}/api/v1/cms/about/story/`
          );
          const body = await response.json().catch(() => ({}));

          if (response.ok && body.success && body.data) {
            setStoryData({
              title: body.data.title || "",
              description: body.data.description || "",
              image: null,
              imagePreview: body.data.image_url || "",
              journey: (body.data.journey || []).map((item: any) => ({
                year: item.year || "",
                title: item.title || "",
                description: item.description || "",
                image: null,
                imagePreview: item.image || "",
              })),
            });
          }
        } catch (error) {
          console.error("Failed to fetch story data:", error);
        } finally {
          setLoading(false);
        }
      };

      void fetchStoryData();
    }
  }, [activeTab]);

  const handleHeroImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroData({
        ...heroData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleStoryImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStoryData({
        ...storyData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleCommunityImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCommunityData({
        ...communityData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  // Community handlers
  const handleAddFeature = () => {
    setCommunityData({
      ...communityData,
      features: [...communityData.features, ""],
    });
  };

  const handleRemoveFeature = (index: number) => {
    setCommunityData({
      ...communityData,
      features: communityData.features.filter((_, i) => i !== index),
    });
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...communityData.features];
    newFeatures[index] = value;
    setCommunityData({ ...communityData, features: newFeatures });
  };

  const handleAddTeamMember = () => {
    setCommunityData({
      ...communityData,
      team: [...communityData.team, { name: "", role: "", image: null, imagePreview: "" }],
    });
  };

  const handleRemoveTeamMember = (index: number) => {
    setCommunityData({
      ...communityData,
      team: communityData.team.filter((_, i) => i !== index),
    });
  };

  const handleTeamMemberChange = (
    index: number,
    field: "name" | "role",
    value: string
  ) => {
    const newTeam = [...communityData.team];
    newTeam[index][field] = value;
    setCommunityData({ ...communityData, team: newTeam });
  };

  const handleTeamMemberImageSelect = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const newTeam = [...communityData.team];
      newTeam[index].image = file;
      newTeam[index].imagePreview = URL.createObjectURL(file);
      setCommunityData({ ...communityData, team: newTeam });
    }
  };

  // Journey handlers
  const handleAddJourney = () => {
    setStoryData({
      ...storyData,
      journey: [
        ...storyData.journey,
        { year: "", title: "", description: "", image: null, imagePreview: "" },
      ],
    });
  };

  const handleRemoveJourney = (index: number) => {
    setStoryData({
      ...storyData,
      journey: storyData.journey.filter((_, i) => i !== index),
    });
  };

  const handleJourneyChange = (
    index: number,
    field: "year" | "title" | "description",
    value: string
  ) => {
    const newJourney = [...storyData.journey];
    newJourney[index][field] = value;
    setStoryData({ ...storyData, journey: newJourney });
  };

  const handleJourneyImageSelect = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const newJourney = [...storyData.journey];
      newJourney[index].image = file;
      newJourney[index].imagePreview = URL.createObjectURL(file);
      setStoryData({ ...storyData, journey: newJourney });
    }
  };

  const handleAddRule = () => {
    setCommunityData({
      ...communityData,
      rules: [
        ...communityData.rules,
        { iconcode: "", title: "", description: "" },
      ],
    });
  };

  const handleRemoveRule = (index: number) => {
    setCommunityData({
      ...communityData,
      rules: communityData.rules.filter((_, i) => i !== index),
    });
  };

  const handleRuleChange = (
    index: number,
    field: "iconcode" | "title" | "description",
    value: string
  ) => {
    const newRules = [...communityData.rules];
    newRules[index][field] = value;
    setCommunityData({ ...communityData, rules: newRules });
  };

  const handleSave = async () => {
    if (activeTab === "hero") {
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
        formData.append("years_in_game", heroData.years_in_game);
        formData.append("matches_hosted", heroData.matches_hosted);
        formData.append("tournaments_run", heroData.tournaments_run);
        formData.append("players_in_community", heroData.players_in_community);

        const response = await authFetch(
          `${apiBase}/api/v1/cms/about/hero-section/`,
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
    } else if (activeTab === "story") {
      if (!storyData.title.trim()) {
        showToast("Title is required", "error");
        return;
      }

      if (!storyData.description.trim()) {
        showToast("Description is required", "error");
        return;
      }

      setSaving(true);
      try {
        const apiBase = import.meta.env.DEV
          ? "/backend"
          : import.meta.env.VITE_API_BASE_URL || "";

        const formData = new FormData();
        if (storyData.image) {
          formData.append("image", storyData.image);
        }
        formData.append("title", storyData.title);
        formData.append("description", storyData.description);
        
        // Add journey items with images
        storyData.journey.forEach((item, index) => {
          if (item.image) {
            // New file upload
            formData.append(`journey[${index}][image]`, item.image);
          } else if (item.imagePreview && !item.imagePreview.startsWith('blob:')) {
            // Existing URL - send as string to preserve it
            formData.append(`journey[${index}][image]`, item.imagePreview);
          }
          formData.append(`journey[${index}][year]`, item.year);
          formData.append(`journey[${index}][title]`, item.title);
          formData.append(`journey[${index}][description]`, item.description);
        });

        const response = await authFetch(
          `${apiBase}/api/v1/cms/about/story/`,
          {
            method: "PATCH",
            body: formData,
          }
        );

        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) {
          throw new Error(body?.message || "Failed to save story section");
        }

        showToast(
          body.message || "Story section updated successfully",
          "success"
        );

        // Update preview with new image URL if returned
        if (body.data?.image_url) {
          setStoryData((prev) => ({
            ...prev,
            image: null,
            imagePreview: body.data.image_url,
          }));
        }

        // Update journey images if returned
        if (body.data?.journey) {
          setStoryData((prev) => ({
            ...prev,
            journey: prev.journey.map((item, index) => ({
              ...item,
              image: null,
              imagePreview: body.data.journey[index]?.image || item.imagePreview,
            })),
          }));
        }
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Failed to save story section",
          "error"
        );
      } finally {
        setSaving(false);
      }
    } else if (activeTab === "community") {
      if (!communityData.title.trim()) {
        showToast("Title is required", "error");
        return;
      }

      if (!communityData.description.trim()) {
        showToast("Description is required", "error");
        return;
      }

      setSaving(true);
      try {
        const apiBase = import.meta.env.DEV
          ? "/backend"
          : import.meta.env.VITE_API_BASE_URL || "";

        const formData = new FormData();
        if (communityData.image) {
          formData.append("image", communityData.image);
        }
        formData.append("title", communityData.title);
        formData.append("description", communityData.description);
        
        // Features as JSON array
        formData.append("features", JSON.stringify(communityData.features));
        
        // Team members as indexed form fields with images
        communityData.team.forEach((member, index) => {
          formData.append(`team[${index}][name]`, member.name);
          formData.append(`team[${index}][role]`, member.role);
          if (member.image) {
            // New file upload
            formData.append(`team[${index}][image]`, member.image);
          } else if (member.imagePreview && !member.imagePreview.startsWith('blob:')) {
            // Existing URL - send as string to preserve it
            formData.append(`team[${index}][image]`, member.imagePreview);
          }
        });
        
        // Rules as JSON array
        formData.append("rules", JSON.stringify(communityData.rules));

        const response = await authFetch(
          `${apiBase}/api/v1/cms/about/community/`,
          {
            method: "PATCH",
            body: formData,
          }
        );

        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) {
          throw new Error(body?.message || "Failed to save community section");
        }

        showToast(
          body.message || "Community section updated successfully",
          "success"
        );

        // Update preview with new image URL if returned
        if (body.data?.image_url) {
          setCommunityData((prev) => ({
            ...prev,
            image: null,
            imagePreview: body.data.image_url,
          }));
        }

        // Update team member images if returned
        if (body.data?.team) {
          setCommunityData((prev) => ({
            ...prev,
            team: prev.team.map((member, index) => ({
              ...member,
              image: null,
              imagePreview: body.data.team[index]?.image || member.imagePreview,
            })),
          }));
        }
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to save community section",
          "error"
        );
      } finally {
        setSaving(false);
      }
    } else {
      // TODO: Implement API calls for other sections
      setSaving(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        showToast("Changes saved successfully", "success");
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Failed to save changes",
          "error"
        );
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading && (activeTab === "hero" || activeTab === "story" || activeTab === "community")) {
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
          <h1>CMS - About Us</h1>
          <p className="page-description">
            Manage the about us page content
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
        <button
          className={`cms-tab ${activeTab === "story" ? "active" : ""}`}
          onClick={() => setActiveTab("story")}
        >
          Our Story
        </button>
        <button
          className={`cms-tab ${activeTab === "community" ? "active" : ""}`}
          onClick={() => setActiveTab("community")}
        >
          Community
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
                  Main hero content for the about us page
                </p>
              </div>
            </div>

            <div className="form-section">
              <ImageUpload
                label="Hero Background Image"
                value={heroData.imagePreview}
                onChange={(file) =>
                  setHeroData({
                    ...heroData,
                    image: file,
                    imagePreview: URL.createObjectURL(file),
                  })
                }
                onRemove={() =>
                  setHeroData({
                    ...heroData,
                    image: null,
                    imagePreview: "",
                  })
                }
              />

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
                  placeholder="e.g., About Nexus FMS Futsal"
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
                  placeholder="Brief introduction..."
                />
              </label>

              <div className="field-row">
                <label className="field">
                  <span>Years in Game</span>
                  <input
                    type="text"
                    value={heroData.years_in_game}
                    onChange={(e) =>
                      setHeroData({
                        ...heroData,
                        years_in_game: e.target.value,
                      })
                    }
                    placeholder="e.g., 5"
                  />
                </label>

                <label className="field">
                  <span>Matches Hosted</span>
                  <input
                    type="text"
                    value={heroData.matches_hosted}
                    onChange={(e) =>
                      setHeroData({
                        ...heroData,
                        matches_hosted: e.target.value,
                      })
                    }
                    placeholder="e.g., 1200"
                  />
                </label>
              </div>

              <div className="field-row">
                <label className="field">
                  <span>Tournaments Run</span>
                  <input
                    type="text"
                    value={heroData.tournaments_run}
                    onChange={(e) =>
                      setHeroData({
                        ...heroData,
                        tournaments_run: e.target.value,
                      })
                    }
                    placeholder="e.g., 50"
                  />
                </label>

                <label className="field">
                  <span>Players in Community</span>
                  <input
                    type="text"
                    value={heroData.players_in_community}
                    onChange={(e) =>
                      setHeroData({
                        ...heroData,
                        players_in_community: e.target.value,
                      })
                    }
                    placeholder="e.g., 3000"
                  />
                </label>
              </div>
            </div>

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

        {/* Our Story Tab */}
        {activeTab === "story" && (
          <div className="cms-section">
            <div className="section-header">
              <div>
                <h2>Our Story</h2>
                <p className="section-description">
                  Tell your brand story and history
                </p>
              </div>
            </div>

            <div className="form-section">
              <ImageUpload
                label="Story Background Image"
                value={storyData.imagePreview}
                onChange={(file) =>
                  setStoryData({
                    ...storyData,
                    image: file,
                    imagePreview: URL.createObjectURL(file),
                  })
                }
                onRemove={() =>
                  setStoryData({
                    ...storyData,
                    image: null,
                    imagePreview: "",
                  })
                }
              />

              <label className="field">
                <span>
                  Title <span className="required">*</span>
                </span>
                <input
                  type="text"
                  value={storyData.title}
                  onChange={(e) =>
                    setStoryData({ ...storyData, title: e.target.value })
                  }
                  placeholder="e.g., Our Journey"
                />
              </label>

              <label className="field">
                <span>
                  Description <span className="required">*</span>
                </span>
                <textarea
                  rows={2}
                  value={storyData.description}
                  onChange={(e) =>
                    setStoryData({ ...storyData, description: e.target.value })
                  }
                  placeholder="Brief summary..."
                />
              </label>
            </div>

            {/* Journey Timeline */}
            <div className="form-section">
              <div className="section-header">
                <div>
                  <h3>Journey Timeline</h3>
                  <p className="section-description">
                    Add milestones in your journey
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleAddJourney}
                >
                  <Plus size={16} />
                  Add milestone
                </button>
              </div>

              {storyData.journey.length > 0 ? (
                <div className="info-items-list">
                  {storyData.journey.map((item, index) => (
                    <div key={index} className="info-item-card">
                      <div className="info-item-header">
                        <h4>Milestone {index + 1}</h4>
                        <button
                          type="button"
                          className="icon-button danger-action"
                          onClick={() => handleRemoveJourney(index)}
                          title="Remove milestone"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="info-item-fields journey-two-column">
                        {/* Left Column - Image */}
                        <div className="journey-image-column">
                          <ImageUpload
                            label="Milestone Image"
                            value={item.imagePreview}
                            onChange={(file) => {
                              const newJourney = [...storyData.journey];
                              newJourney[index].image = file;
                              newJourney[index].imagePreview = URL.createObjectURL(file);
                              setStoryData({ ...storyData, journey: newJourney });
                            }}
                            onRemove={() => {
                              const newJourney = [...storyData.journey];
                              newJourney[index].image = null;
                              newJourney[index].imagePreview = "";
                              setStoryData({ ...storyData, journey: newJourney });
                            }}
                          />
                        </div>

                        {/* Right Column - Details */}
                        <div className="journey-details-column">
                          <label className="field">
                            <span>Year</span>
                            <input
                              type="text"
                              value={item.year}
                              onChange={(e) =>
                                handleJourneyChange(index, "year", e.target.value)
                              }
                              placeholder="e.g., 2019"
                            />
                          </label>

                          <label className="field">
                            <span>Title</span>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) =>
                                handleJourneyChange(index, "title", e.target.value)
                              }
                              placeholder="e.g., Foundation"
                            />
                          </label>

                          <label className="field">
                            <span>Description</span>
                            <textarea
                              rows={3}
                              value={item.description}
                              onChange={(e) =>
                                handleJourneyChange(
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Plus size={48} />
                  <p>No journey milestones added yet</p>
                </div>
              )}
            </div>

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

        {/* Community Tab */}
        {activeTab === "community" && (
          <div className="cms-section">
            <div className="section-header">
              <div>
                <h2>Community</h2>
                <p className="section-description">
                  Showcase your community and values
                </p>
              </div>
            </div>

            <div className="form-section">
              <ImageUpload
                label="Community Background Image"
                value={communityData.imagePreview}
                onChange={(file) =>
                  setCommunityData({
                    ...communityData,
                    image: file,
                    imagePreview: URL.createObjectURL(file),
                  })
                }
                onRemove={() =>
                  setCommunityData({
                    ...communityData,
                    image: null,
                    imagePreview: "",
                  })
                }
              />

              <label className="field">
                <span>
                  Title <span className="required">*</span>
                </span>
                <input
                  type="text"
                  value={communityData.title}
                  onChange={(e) =>
                    setCommunityData({ ...communityData, title: e.target.value })
                  }
                  placeholder="e.g., Our Community"
                />
              </label>

              <label className="field">
                <span>
                  Description <span className="required">*</span>
                </span>
                <textarea
                  rows={3}
                  value={communityData.description}
                  onChange={(e) =>
                    setCommunityData({
                      ...communityData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief summary..."
                />
              </label>
            </div>

            {/* Features Section */}
            <div className="form-section">
              <div className="section-header">
                <div>
                  <h3>Features</h3>
                  <p className="section-description">
                    List of community features or benefits
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleAddFeature}
                >
                  <Plus size={16} />
                  Add feature
                </button>
              </div>

              {communityData.features.length > 0 ? (
                <div className="features-list">
                  {communityData.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) =>
                          handleFeatureChange(index, e.target.value)
                        }
                        placeholder="e.g., Weekly tournaments"
                      />
                      <button
                        type="button"
                        className="icon-button danger-action"
                        onClick={() => handleRemoveFeature(index)}
                        title="Remove feature"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Plus size={48} />
                  <p>No features added yet</p>
                </div>
              )}
            </div>

            {/* Team Section */}
            <div className="form-section">
              <div className="section-header">
                <div>
                  <h3>Team Members</h3>
                  <p className="section-description">
                    Add staff or key team members
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleAddTeamMember}
                >
                  <Plus size={16} />
                  Add member
                </button>
              </div>

              {communityData.team.length > 0 ? (
                <div className="info-items-list">
                  {communityData.team.map((member, index) => (
                    <div key={index} className="info-item-card">
                      <div className="info-item-header">
                        <h4>Team Member {index + 1}</h4>
                        <button
                          type="button"
                          className="icon-button danger-action"
                          onClick={() => handleRemoveTeamMember(index)}
                          title="Remove member"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="info-item-fields team-two-column">
                        {/* Left Column - Image */}
                        <div className="team-image-column">
                          <ImageUpload
                            label="Member Image"
                            value={member.imagePreview}
                            onChange={(file) => {
                              const newTeam = [...communityData.team];
                              newTeam[index].image = file;
                              newTeam[index].imagePreview = URL.createObjectURL(file);
                              setCommunityData({ ...communityData, team: newTeam });
                            }}
                            onRemove={() => {
                              const newTeam = [...communityData.team];
                              newTeam[index].image = null;
                              newTeam[index].imagePreview = "";
                              setCommunityData({ ...communityData, team: newTeam });
                            }}
                          />
                        </div>

                        {/* Right Column - Details */}
                        <div className="team-details-column">
                          <label className="field">
                            <span>Name</span>
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) =>
                                handleTeamMemberChange(index, "name", e.target.value)
                              }
                              placeholder="e.g., John Doe"
                            />
                          </label>

                          <label className="field">
                            <span>Role</span>
                            <input
                              type="text"
                              value={member.role}
                              onChange={(e) =>
                                handleTeamMemberChange(index, "role", e.target.value)
                              }
                              placeholder="e.g., Facility Manager"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Plus size={48} />
                  <p>No team members added yet</p>
                </div>
              )}
            </div>

            {/* Rules Section */}
            <div className="form-section">
              <div className="section-header">
                <div>
                  <h3>Community Rules</h3>
                  <p className="section-description">
                    Add community guidelines or rules
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleAddRule}
                >
                  <Plus size={16} />
                  Add rule
                </button>
              </div>

              {communityData.rules.length > 0 ? (
                <div className="info-items-list">
                  {communityData.rules.map((rule, index) => (
                    <div key={index} className="info-item-card">
                      <div className="info-item-header">
                        <h4>Rule {index + 1}</h4>
                        <button
                          type="button"
                          className="icon-button danger-action"
                          onClick={() => handleRemoveRule(index)}
                          title="Remove rule"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="info-item-fields">
                        <label className="field">
                          <span>Icon Code (FontAwesome)</span>
                          <input
                            type="text"
                            value={rule.iconcode}
                            onChange={(e) =>
                              handleRuleChange(index, "iconcode", e.target.value)
                            }
                            placeholder="e.g., fa-solid fa-handshake"
                          />
                        </label>

                        <label className="field">
                          <span>Title</span>
                          <input
                            type="text"
                            value={rule.title}
                            onChange={(e) =>
                              handleRuleChange(index, "title", e.target.value)
                            }
                            placeholder="e.g., Respect Everyone"
                          />
                        </label>

                        <label className="field">
                          <span>Description</span>
                          <textarea
                            rows={2}
                            value={rule.description}
                            onChange={(e) =>
                              handleRuleChange(
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
                  <p>No rules added yet</p>
                </div>
              )}
            </div>

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
