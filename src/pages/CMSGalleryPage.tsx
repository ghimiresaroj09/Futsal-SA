import { useState, useEffect } from "react";
import { Plus, Save, X, Pencil, Eye, ChevronLeft, ChevronRight, Image as ImageIcon, Video, Trash2 } from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { authFetch } from "../lib/api";

type TabType = "category" | "images" | "videos";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type GalleryImage = {
  id: string;
  title: string;
  image_url: string;
  alt_text: string;
  category: string;
  category_name: string;
  category_slug: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type Highlight = {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  tags: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function CMSGalleryPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("category");

  // Category State
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]); // For dropdown in Images tab
  const [categoryPagination, setCategoryPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    rowsPerPage: 10,
  });
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    sort_order: 1,
    is_active: true,
  });

  // Images State
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [imagePagination, setImagePagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    rowsPerPage: 10,
  });
  const [imageSearch, setImageSearch] = useState("");
  const [imageStatusFilter, setImageStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [imageCategoryFilter, setImageCategoryFilter] = useState<string>("all");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showImageViewDialog, setShowImageViewDialog] = useState(false);
  const [showImageDeleteDialog, setShowImageDeleteDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [imageForm, setImageForm] = useState({
    title: "",
    image: null as File | null,
    imagePreview: "",
    alt_text: "",
    category: "",
    sort_order: 1,
    is_active: true,
  });

  // Videos/Highlights State
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightPagination, setHighlightPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    rowsPerPage: 10,
  });
  const [highlightSearch, setHighlightSearch] = useState("");
  const [highlightStatusFilter, setHighlightStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showHighlightDialog, setShowHighlightDialog] = useState(false);
  const [showHighlightViewDialog, setShowHighlightViewDialog] = useState(false);
  const [showHighlightDeleteDialog, setShowHighlightDeleteDialog] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [editingHighlight, setEditingHighlight] = useState<string | null>(null);
  const [highlightForm, setHighlightForm] = useState({
    title: "",
    video: null as File | null,
    videoPreview: "",
    thumbnail: null as File | null,
    thumbnailPreview: "",
    tags: "",
    sort_order: 1,
    is_active: true,
  });

  // Fetch all categories for dropdowns (only once on mount)
  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const apiBase = import.meta.env.DEV
          ? "/backend"
          : import.meta.env.VITE_API_BASE_URL || "";

        const response = await authFetch(
          `${apiBase}/api/v1/cms/gallery/category/?page_size=100`
        );
        const body = await response.json().catch(() => ({}));

        if (response.ok && body.success && body.data) {
          setAllCategories(body.data.results || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    void fetchAllCategories();
  }, []);

  // Fetch category table data
  useEffect(() => {
    if (activeTab === "category") {
      const fetchCategories = async () => {
        try {
          const apiBase = import.meta.env.DEV
            ? "/backend"
            : import.meta.env.VITE_API_BASE_URL || "";

          const params = new URLSearchParams();
          params.append("page", categoryPagination.currentPage.toString());
          params.append("page_size", categoryPagination.rowsPerPage.toString());
          
          if (categorySearch) {
            params.append("search", categorySearch);
          }
          
          if (categoryStatusFilter !== "all") {
            params.append("is_active", categoryStatusFilter === "active" ? "true" : "false");
          }

          const response = await authFetch(
            `${apiBase}/api/v1/cms/gallery/category/?${params.toString()}`
          );
          const body = await response.json().catch(() => ({}));

          if (response.ok && body.success && body.data) {
            setCategories(body.data.results || []);
            setCategoryPagination((prev) => ({
              ...prev,
              count: body.data.count || 0,
              next: body.data.next,
              previous: body.data.previous,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch categories:", error);
        }
      };

      void fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, categoryPagination.currentPage, categoryPagination.rowsPerPage, categorySearch, categoryStatusFilter]);

  // Fetch images
  useEffect(() => {
    if (activeTab === "images") {
      const fetchImages = async () => {
        try {
          const apiBase = import.meta.env.DEV
            ? "/backend"
            : import.meta.env.VITE_API_BASE_URL || "";

          const params = new URLSearchParams();
          params.append("page", imagePagination.currentPage.toString());
          params.append("page_size", imagePagination.rowsPerPage.toString());
          
          if (imageSearch) {
            params.append("search", imageSearch);
          }
          
          if (imageStatusFilter !== "all") {
            params.append("is_active", imageStatusFilter === "active" ? "true" : "false");
          }

          if (imageCategoryFilter !== "all") {
            params.append("category", imageCategoryFilter);
          }

          const response = await authFetch(
            `${apiBase}/api/v1/cms/gallery/images/?${params.toString()}`
          );
          const body = await response.json().catch(() => ({}));

          if (response.ok && body.success && body.data) {
            setImages(body.data.results || []);
            setImagePagination((prev) => ({
              ...prev,
              count: body.data.count || 0,
              next: body.data.next,
              previous: body.data.previous,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch images:", error);
        }
      };

      void fetchImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, imagePagination.currentPage, imagePagination.rowsPerPage, imageSearch, imageStatusFilter, imageCategoryFilter]);

  // Fetch highlights/videos
  useEffect(() => {
    if (activeTab === "videos") {
      const fetchHighlights = async () => {
        try {
          const apiBase = import.meta.env.DEV
            ? "/backend"
            : import.meta.env.VITE_API_BASE_URL || "";

          const params = new URLSearchParams();
          params.append("page", highlightPagination.currentPage.toString());
          params.append("page_size", highlightPagination.rowsPerPage.toString());
          
          if (highlightSearch) {
            params.append("search", highlightSearch);
          }
          
          if (highlightStatusFilter !== "all") {
            params.append("is_active", highlightStatusFilter === "active" ? "true" : "false");
          }

          const response = await authFetch(
            `${apiBase}/api/v1/cms/gallery/highlights/?${params.toString()}`
          );
          const body = await response.json().catch(() => ({}));

          if (response.ok && body.success && body.data) {
            setHighlights(body.data.results || []);
            setHighlightPagination((prev) => ({
              ...prev,
              count: body.data.count || 0,
              next: body.data.next,
              previous: body.data.previous,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch highlights:", error);
        }
      };

      void fetchHighlights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, highlightPagination.currentPage, highlightPagination.rowsPerPage, highlightSearch, highlightStatusFilter]);

  const refreshCategoryData = async () => {
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const params = new URLSearchParams();
      params.append("page", categoryPagination.currentPage.toString());
      params.append("page_size", categoryPagination.rowsPerPage.toString());
      
      if (categorySearch) {
        params.append("search", categorySearch);
      }
      
      if (categoryStatusFilter !== "all") {
        params.append("is_active", categoryStatusFilter === "active" ? "true" : "false");
      }

      const response = await authFetch(
        `${apiBase}/api/v1/cms/gallery/category/?${params.toString()}`
      );
      const body = await response.json().catch(() => ({}));

      if (response.ok && body.success && body.data) {
        setCategories(body.data.results || []);
        setCategoryPagination((prev) => ({
          ...prev,
          count: body.data.count || 0,
          next: body.data.next,
          previous: body.data.previous,
        }));
      }
    } catch (error) {
      console.error("Failed to refresh categories:", error);
    }
  };

  const handleCategoryAdd = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      description: "",
      sort_order: categories.length + 1,
      is_active: true,
    });
    setShowCategoryDialog(true);
  };

  const handleCategoryEdit = (category: Category) => {
    setEditingCategory(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description,
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setShowCategoryDialog(true);
  };

  const handleCategorySave = async () => {
    if (!categoryForm.name.trim()) {
      showToast("Category name is required", "error");
      return;
    }

    setSaving(true);
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const url = editingCategory
        ? `${apiBase}/api/v1/cms/gallery/category/${editingCategory}/`
        : `${apiBase}/api/v1/cms/gallery/category/`;
      
      const method = editingCategory ? "PATCH" : "POST";

      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body?.message || "Failed to save category");
      }

      showToast(
        body.message || `Category ${editingCategory ? "updated" : "added"} successfully`,
        "success",
      );

      setShowCategoryDialog(false);
      await refreshCategoryData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save category",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const response = await authFetch(
        `${apiBase}/api/v1/cms/gallery/category/${id}/`,
        { method: "DELETE" },
      );

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body?.message || "Failed to delete category");
      }

      showToast(body.message || "Category deleted successfully", "success");
      setShowDeleteDialog(false);
      setSelectedCategory(null);
      await refreshCategoryData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete category",
        "error",
      );
    }
  };

  const handleViewCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowViewDialog(true);
  };

  const handleDeleteCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteDialog(true);
  };

  // Image handlers
  const refreshImageData = async () => {
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const params = new URLSearchParams();
      params.append("page", imagePagination.currentPage.toString());
      params.append("page_size", imagePagination.rowsPerPage.toString());
      
      if (imageSearch) {
        params.append("search", imageSearch);
      }
      
      if (imageStatusFilter !== "all") {
        params.append("is_active", imageStatusFilter === "active" ? "true" : "false");
      }

      if (imageCategoryFilter !== "all") {
        params.append("category", imageCategoryFilter);
      }

      const response = await authFetch(
        `${apiBase}/api/v1/cms/gallery/images/?${params.toString()}`
      );
      const body = await response.json().catch(() => ({}));

      if (response.ok && body.success && body.data) {
        setImages(body.data.results || []);
        setImagePagination((prev) => ({
          ...prev,
          count: body.data.count || 0,
          next: body.data.next,
          previous: body.data.previous,
        }));
      }
    } catch (error) {
      console.error("Failed to refresh images:", error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageForm({
        ...imageForm,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleImageAdd = () => {
    setEditingImage(null);
    setImageForm({
      title: "",
      image: null,
      imagePreview: "",
      alt_text: "",
      category: categories[0]?.id || "",
      sort_order: images.length + 1,
      is_active: true,
    });
    setShowImageDialog(true);
  };

  const handleImageEdit = (image: GalleryImage) => {
    setEditingImage(image.id);
    setImageForm({
      title: image.title,
      image: null,
      imagePreview: image.image_url,
      alt_text: image.alt_text,
      category: image.category,
      sort_order: image.sort_order,
      is_active: image.is_active,
    });
    setShowImageDialog(true);
  };

  const handleImageSave = async () => {
    if (!imageForm.title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    if (!imageForm.alt_text.trim()) {
      showToast("Alt text is required", "error");
      return;
    }

    if (!imageForm.category) {
      showToast("Category is required", "error");
      return;
    }

    if (!editingImage && !imageForm.image) {
      showToast("Please select an image", "error");
      return;
    }

    setSaving(true);
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const formData = new FormData();
      if (imageForm.image) {
        formData.append("image", imageForm.image);
      }
      formData.append("title", imageForm.title);
      formData.append("alt_text", imageForm.alt_text);
      formData.append("category", imageForm.category);
      formData.append("sort_order", imageForm.sort_order.toString());
      formData.append("is_active", imageForm.is_active.toString());

      const url = editingImage
        ? `${apiBase}/api/v1/cms/gallery/images/${editingImage}/`
        : `${apiBase}/api/v1/cms/gallery/images/`;
      
      const method = editingImage ? "PATCH" : "POST";

      const response = await authFetch(url, {
        method,
        body: formData,
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body?.message || "Failed to save image");
      }

      showToast(
        body.message || `Image ${editingImage ? "updated" : "added"} successfully`,
        "success",
      );

      setShowImageDialog(false);
      await refreshImageData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save image",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImageDelete = async (id: string) => {
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const response = await authFetch(
        `${apiBase}/api/v1/cms/gallery/images/${id}/`,
        { method: "DELETE" },
      );

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body?.message || "Failed to delete image");
      }

      showToast(body.message || "Image deleted successfully", "success");
      setShowImageDeleteDialog(false);
      setSelectedImage(null);
      await refreshImageData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete image",
        "error",
      );
    }
  };

  const handleViewImage = (image: GalleryImage) => {
    setSelectedImage(image);
    setShowImageViewDialog(true);
  };

  const handleDeleteImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
    setShowImageDeleteDialog(true);
  };

  // Highlight/Video handlers
  const refreshHighlightData = async () => {
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const params = new URLSearchParams();
      params.append("page", highlightPagination.currentPage.toString());
      params.append("page_size", highlightPagination.rowsPerPage.toString());
      
      if (highlightSearch) {
        params.append("search", highlightSearch);
      }
      
      if (highlightStatusFilter !== "all") {
        params.append("is_active", highlightStatusFilter === "active" ? "true" : "false");
      }

      const response = await authFetch(
        `${apiBase}/api/v1/cms/gallery/highlights/?${params.toString()}`
      );
      const body = await response.json().catch(() => ({}));

      if (response.ok && body.success && body.data) {
        setHighlights(body.data.results || []);
        setHighlightPagination((prev) => ({
          ...prev,
          count: body.data.count || 0,
          next: body.data.next,
          previous: body.data.previous,
        }));
      }
    } catch (error) {
      console.error("Failed to refresh highlights:", error);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHighlightForm({
        ...highlightForm,
        video: file,
        videoPreview: URL.createObjectURL(file),
      });
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHighlightForm({
        ...highlightForm,
        thumbnail: file,
        thumbnailPreview: URL.createObjectURL(file),
      });
    }
  };

  const handleHighlightAdd = () => {
    setEditingHighlight(null);
    setHighlightForm({
      title: "",
      video: null,
      videoPreview: "",
      thumbnail: null,
      thumbnailPreview: "",
      tags: "",
      sort_order: highlights.length + 1,
      is_active: true,
    });
    setShowHighlightDialog(true);
  };

  const handleHighlightEdit = (highlight: Highlight) => {
    setEditingHighlight(highlight.id);
    setHighlightForm({
      title: highlight.title,
      video: null,
      videoPreview: highlight.video_url,
      thumbnail: null,
      thumbnailPreview: highlight.thumbnail_url || "",
      tags: highlight.tags,
      sort_order: highlight.sort_order,
      is_active: highlight.is_active,
    });
    setShowHighlightDialog(true);
  };

  const handleHighlightSave = async () => {
    if (!highlightForm.title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    if (!editingHighlight && !highlightForm.video) {
      showToast("Please select a video", "error");
      return;
    }

    setSaving(true);
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const formData = new FormData();
      if (highlightForm.video) {
        formData.append("video", highlightForm.video);
      }
      if (highlightForm.thumbnail) {
        formData.append("thumbnail", highlightForm.thumbnail);
      }
      formData.append("title", highlightForm.title);
      formData.append("tags", highlightForm.tags);
      formData.append("sort_order", highlightForm.sort_order.toString());
      formData.append("is_active", highlightForm.is_active.toString());

      const url = editingHighlight
        ? `${apiBase}/api/v1/cms/gallery/highlights/${editingHighlight}/`
        : `${apiBase}/api/v1/cms/gallery/highlights/`;
      
      const method = editingHighlight ? "PATCH" : "POST";

      const response = await authFetch(url, {
        method,
        body: formData,
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body?.message || "Failed to save video");
      }

      showToast(
        body.message || `Video ${editingHighlight ? "updated" : "added"} successfully`,
        "success",
      );

      setShowHighlightDialog(false);
      await refreshHighlightData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save video",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleHighlightDelete = async (id: string) => {
    try {
      const apiBase = import.meta.env.DEV
        ? "/backend"
        : import.meta.env.VITE_API_BASE_URL || "";

      const response = await authFetch(
        `${apiBase}/api/v1/cms/gallery/highlights/${id}/`,
        { method: "DELETE" },
      );

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body?.message || "Failed to delete video");
      }

      showToast(body.message || "Video deleted successfully", "success");
      setShowHighlightDeleteDialog(false);
      setSelectedHighlight(null);
      await refreshHighlightData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete video",
        "error",
      );
    }
  };

  const handleViewHighlight = (highlight: Highlight) => {
    setSelectedHighlight(highlight);
    setShowHighlightViewDialog(true);
  };

  const handleDeleteHighlightClick = (highlight: Highlight) => {
    setSelectedHighlight(highlight);
    setShowHighlightDeleteDialog(true);
  };

  return (
    <div className="cms-page">
      <header className="page-header">
        <div>
          <h1>Gallery Management</h1>
          <p className="page-description">
            Manage gallery categories, images, and videos
          </p>
        </div>
      </header>

      <div className="cms-content-card">
        <div className="cms-tabs">
          <button
            className={activeTab === "category" ? "active" : ""}
            onClick={() => setActiveTab("category")}
          >
            Categories
          </button>
          <button
            className={activeTab === "images" ? "active" : ""}
            onClick={() => setActiveTab("images")}
          >
            <ImageIcon size={16} />
            <span>Images</span>
          </button>
          <button
            className={activeTab === "videos" ? "active" : ""}
            onClick={() => setActiveTab("videos")}
          >
            <Video size={16} />
            <span>Videos</span>
          </button>
        </div>

        {activeTab === "category" && (
          <div className="cms-section">
            <div className="section-header">
              <div>
                <h2>Gallery Categories</h2>
                <p className="section-description">
                  Organize your gallery content into categories
                </p>
              </div>
              <button className="primary-button" onClick={handleCategoryAdd}>
                <Plus size={16} />
                Add Category
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="filters-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={categorySearch}
                  onChange={(e) => {
                    setCategorySearch(e.target.value);
                    setCategoryPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                />
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select
                  value={categoryStatusFilter}
                  onChange={(e) => {
                    setCategoryStatusFilter(e.target.value as "all" | "active" | "inactive");
                    setCategoryPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {categories.length > 0 ? (
              <>
                <div className="table-scroll">
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th className="sn-col">SN</th>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Description</th>
                        <th>Order</th>
                        <th>Status</th>
                        <th className="booking-actions-heading">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category, index) => (
                        <tr key={category.id}>
                          <td className="sn-col">
                            {(categoryPagination.currentPage - 1) *
                              categoryPagination.rowsPerPage +
                              index +
                              1}
                          </td>
                          <td>
                            {category.name}
                          </td>
                          <td>
                            {category.slug}
                          </td>
                          <td>
                            {category.description}
                          </td>
                          <td>
                            {category.sort_order}
                          </td>
                          <td>
                            <span
                              className={`booking-status ${category.is_active ? "confirmed" : "cancelled"}`}
                            >
                              {category.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <div className="booking-actions">
                              <button
                                title="View category"
                                aria-label="View category"
                                onClick={() => handleViewCategory(category)}
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                title="Edit category"
                                aria-label="Edit category"
                                onClick={() => handleCategoryEdit(category)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                title="Delete category"
                                aria-label="Delete category"
                                className="danger-action"
                                onClick={() => handleDeleteCategoryClick(category)}
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
                        value={categoryPagination.rowsPerPage}
                        onChange={(e) => {
                          setCategoryPagination((prev) => ({
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
                      {(categoryPagination.currentPage - 1) *
                        categoryPagination.rowsPerPage +
                        1}
                      –
                      {Math.min(
                        categoryPagination.currentPage * categoryPagination.rowsPerPage,
                        categoryPagination.count,
                      )}{" "}
                      of {categoryPagination.count}
                    </div>
                  </div>
                  <div className="pagination-controls">
                    <button
                      onClick={() =>
                        setCategoryPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage - 1,
                        }))
                      }
                      disabled={!categoryPagination.previous}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="page-number">
                      Page {categoryPagination.currentPage} of{" "}
                      {Math.ceil(
                        categoryPagination.count / categoryPagination.rowsPerPage,
                      )}
                    </span>
                    <button
                      onClick={() =>
                        setCategoryPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage + 1,
                        }))
                      }
                      disabled={!categoryPagination.next}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <ImageIcon size={48} />
                <p>No categories found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "images" && (
          <div className="cms-section">
            <div className="section-header">
              <div>
                <h2>Gallery Images</h2>
                <p className="section-description">
                  Manage images for your gallery
                </p>
              </div>
              <button className="primary-button" onClick={handleImageAdd}>
                <Plus size={16} />
                Add Image
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="filters-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={imageSearch}
                  onChange={(e) => {
                    setImageSearch(e.target.value);
                    setImagePagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                />
              </div>

              <div className="filter-group">
                <label>Category:</label>
                <select
                  value={imageCategoryFilter}
                  onChange={(e) => {
                    setImageCategoryFilter(e.target.value);
                    setImagePagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                >
                  <option value="all">All</option>
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select
                  value={imageStatusFilter}
                  onChange={(e) => {
                    setImageStatusFilter(e.target.value as "all" | "active" | "inactive");
                    setImagePagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {images.length > 0 ? (
              <>
                <div className="table-scroll">
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th className="sn-col">SN</th>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Alt Text</th>
                        <th>Order</th>
                        <th>Status</th>
                        <th className="booking-actions-heading">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {images.map((image, index) => (
                        <tr key={image.id}>
                          <td className="sn-col">
                            {(imagePagination.currentPage - 1) *
                              imagePagination.rowsPerPage +
                              index +
                              1}
                          </td>
                          <td>
                            <img
                              src={image.image_url}
                              alt={image.alt_text}
                              className="carousel-table-thumbnail"
                            />
                          </td>
                          <td>
                            {image.title}
                          </td>
                          <td>
                            {image.category_name}
                          </td>
                          <td>
                            {image.alt_text}
                          </td>
                          <td>
                            {image.sort_order}
                          </td>
                          <td>
                            <span
                              className={`booking-status ${image.is_active ? "confirmed" : "cancelled"}`}
                            >
                              {image.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <div className="booking-actions">
                              <button
                                title="View image"
                                aria-label="View image"
                                onClick={() => handleViewImage(image)}
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                title="Edit image"
                                aria-label="Edit image"
                                onClick={() => handleImageEdit(image)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                title="Delete image"
                                aria-label="Delete image"
                                className="danger-action"
                                onClick={() => handleDeleteImageClick(image)}
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
                        value={imagePagination.rowsPerPage}
                        onChange={(e) => {
                          setImagePagination((prev) => ({
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
                      {(imagePagination.currentPage - 1) *
                        imagePagination.rowsPerPage +
                        1}
                      –
                      {Math.min(
                        imagePagination.currentPage * imagePagination.rowsPerPage,
                        imagePagination.count,
                      )}{" "}
                      of {imagePagination.count}
                    </div>
                  </div>
                  <div className="pagination-controls">
                    <button
                      onClick={() =>
                        setImagePagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage - 1,
                        }))
                      }
                      disabled={!imagePagination.previous}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="page-number">
                      Page {imagePagination.currentPage} of{" "}
                      {Math.ceil(
                        imagePagination.count / imagePagination.rowsPerPage,
                      )}
                    </span>
                    <button
                      onClick={() =>
                        setImagePagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage + 1,
                        }))
                      }
                      disabled={!imagePagination.next}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <ImageIcon size={48} />
                <p>No images found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "videos" && (
          <div className="cms-section">
            <div className="section-header">
              <div>
                <h2>Gallery Videos</h2>
                <p className="section-description">
                  Manage highlight videos for your gallery
                </p>
              </div>
              <button className="primary-button" onClick={handleHighlightAdd}>
                <Plus size={16} />
                Add Video
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="filters-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by title or tags..."
                  value={highlightSearch}
                  onChange={(e) => {
                    setHighlightSearch(e.target.value);
                    setHighlightPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                />
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select
                  value={highlightStatusFilter}
                  onChange={(e) => {
                    setHighlightStatusFilter(e.target.value as "all" | "active" | "inactive");
                    setHighlightPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {highlights.length > 0 ? (
              <>
                <div className="table-scroll">
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th className="sn-col">SN</th>
                        <th>Thumbnail</th>
                        <th>Title</th>
                        <th>Tags</th>
                        <th>Order</th>
                        <th>Status</th>
                        <th className="booking-actions-heading">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highlights.map((highlight, index) => (
                        <tr key={highlight.id}>
                          <td className="sn-col">
                            {(highlightPagination.currentPage - 1) *
                              highlightPagination.rowsPerPage +
                              index +
                              1}
                          </td>
                          <td>
                            {highlight.thumbnail_url ? (
                              <img
                                src={highlight.thumbnail_url}
                                alt={highlight.title}
                                className="carousel-table-thumbnail"
                              />
                            ) : (
                              <div className="video-placeholder">
                                <Video size={24} />
                              </div>
                            )}
                          </td>
                          <td>
                            {highlight.title}
                          </td>
                          <td>
                            {highlight.tags}
                          </td>
                          <td>
                            {highlight.sort_order}
                          </td>
                          <td>
                            <span
                              className={`booking-status ${highlight.is_active ? "confirmed" : "cancelled"}`}
                            >
                              {highlight.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <div className="booking-actions">
                              <button
                                title="View video"
                                aria-label="View video"
                                onClick={() => handleViewHighlight(highlight)}
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                title="Edit video"
                                aria-label="Edit video"
                                onClick={() => handleHighlightEdit(highlight)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                title="Delete video"
                                aria-label="Delete video"
                                className="danger-action"
                                onClick={() => handleDeleteHighlightClick(highlight)}
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
                        value={highlightPagination.rowsPerPage}
                        onChange={(e) => {
                          setHighlightPagination((prev) => ({
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
                      {(highlightPagination.currentPage - 1) *
                        highlightPagination.rowsPerPage +
                        1}
                      –
                      {Math.min(
                        highlightPagination.currentPage * highlightPagination.rowsPerPage,
                        highlightPagination.count,
                      )}{" "}
                      of {highlightPagination.count}
                    </div>
                  </div>
                  <div className="pagination-controls">
                    <button
                      onClick={() =>
                        setHighlightPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage - 1,
                        }))
                      }
                      disabled={!highlightPagination.previous}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="page-number">
                      Page {highlightPagination.currentPage} of{" "}
                      {Math.ceil(
                        highlightPagination.count / highlightPagination.rowsPerPage,
                      )}
                    </span>
                    <button
                      onClick={() =>
                        setHighlightPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage + 1,
                        }))
                      }
                      disabled={!highlightPagination.next}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <Video size={48} />
                <p>No videos found</p>
              </div>
            )}
          </div>
        )}

        {/* Category Add/Edit Dialog */}
        {showCategoryDialog && (
          <div className="dialog-overlay" onClick={() => setShowCategoryDialog(false)}>
            <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>{editingCategory ? "Edit" : "Add"} Category</h3>
                <button
                  className="icon-button"
                  onClick={() => setShowCategoryDialog(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="dialog-body">
                <label className="field">
                  <span>
                    Name <span className="required">*</span>
                  </span>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    placeholder="e.g., Venue"
                  />
                </label>

                <label className="field">
                  <span>Description</span>
                  <textarea
                    rows={3}
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, description: e.target.value })
                    }
                    placeholder="Brief description of this category"
                  />
                </label>

                <div className="field-row">
                  <label className="field">
                    <span>Sort Order</span>
                    <input
                      type="number"
                      value={categoryForm.sort_order}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          sort_order: parseInt(e.target.value) || 1,
                        })
                      }
                      min="1"
                    />
                  </label>

                  <label className="field checkbox-field">
                    <input
                      type="checkbox"
                      checked={categoryForm.is_active}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, is_active: e.target.checked })
                      }
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              <div className="dialog-footer">
                <button
                  className="secondary-button"
                  onClick={() => setShowCategoryDialog(false)}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={handleCategorySave}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Category Dialog */}
        {showViewDialog && selectedCategory && (
          <div className="dialog-overlay" onClick={() => setShowViewDialog(false)}>
            <div className="dialog-content view-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>View Category</h3>
                <button
                  className="icon-button"
                  onClick={() => setShowViewDialog(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="dialog-body">
                <div className="view-details">
                  <div className="view-detail-item">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{selectedCategory.name}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Slug</span>
                    <span className="detail-value">{selectedCategory.slug}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Description</span>
                    <span className="detail-value">{selectedCategory.description}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Sort Order</span>
                    <span className="detail-value">{selectedCategory.sort_order}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Status</span>
                    <span className={`booking-status ${selectedCategory.is_active ? "confirmed" : "cancelled"}`}>
                      {selectedCategory.is_active ? "Active" : "Inactive"}
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
        {showDeleteDialog && selectedCategory && (
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
                  <h4>Delete this category?</h4>
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
                  onClick={() => handleCategoryDelete(selectedCategory.id)}
                >
                  Delete category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Add/Edit Dialog */}
        {showImageDialog && (
          <div className="dialog-overlay" onClick={() => setShowImageDialog(false)}>
            <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>{editingImage ? "Edit" : "Add"} Gallery Image</h3>
                <button
                  className="icon-button"
                  onClick={() => setShowImageDialog(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="dialog-body">
                {imageForm.imagePreview && (
                  <div className="image-preview-container">
                    <img src={imageForm.imagePreview} alt="Preview" />
                  </div>
                )}

                <label className="field">
                  <span>
                    Image {!editingImage && <span className="required">*</span>}
                  </span>
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
                    value={imageForm.title}
                    onChange={(e) =>
                      setImageForm({ ...imageForm, title: e.target.value })
                    }
                    placeholder="e.g., Arena Main View"
                  />
                </label>

                <label className="field">
                  <span>
                    Alt Text <span className="required">*</span>
                  </span>
                  <input
                    type="text"
                    value={imageForm.alt_text}
                    onChange={(e) =>
                      setImageForm({ ...imageForm, alt_text: e.target.value })
                    }
                    placeholder="e.g., Main arena view from entrance"
                  />
                </label>

                <label className="field">
                  <span>
                    Category <span className="required">*</span>
                  </span>
                  <select
                    value={imageForm.category}
                    onChange={(e) =>
                      setImageForm({ ...imageForm, category: e.target.value })
                    }
                  >
                    <option value="">Select Category</option>
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="field-row">
                  <label className="field">
                    <span>Sort Order</span>
                    <input
                      type="number"
                      value={imageForm.sort_order}
                      onChange={(e) =>
                        setImageForm({
                          ...imageForm,
                          sort_order: parseInt(e.target.value) || 1,
                        })
                      }
                      min="1"
                    />
                  </label>

                  <label className="field checkbox-field">
                    <input
                      type="checkbox"
                      checked={imageForm.is_active}
                      onChange={(e) =>
                        setImageForm({ ...imageForm, is_active: e.target.checked })
                      }
                    />
                    <span>Show on website</span>
                  </label>
                </div>
              </div>

              <div className="dialog-footer">
                <button
                  className="secondary-button"
                  onClick={() => setShowImageDialog(false)}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={handleImageSave}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Image Dialog */}
        {showImageViewDialog && selectedImage && (
          <div className="dialog-overlay" onClick={() => setShowImageViewDialog(false)}>
            <div className="dialog-content view-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>View Gallery Image</h3>
                <button
                  className="icon-button"
                  onClick={() => setShowImageViewDialog(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="dialog-body">
                <div className="image-preview-container view-image-large">
                  <img src={selectedImage.image_url} alt={selectedImage.alt_text} />
                </div>

                <div className="view-details">
                  <div className="view-detail-item">
                    <span className="detail-label">Title</span>
                    <span className="detail-value">{selectedImage.title}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Alt Text</span>
                    <span className="detail-value">{selectedImage.alt_text}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">{selectedImage.category_name}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Sort Order</span>
                    <span className="detail-value">{selectedImage.sort_order}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Status</span>
                    <span className={`booking-status ${selectedImage.is_active ? "confirmed" : "cancelled"}`}>
                      {selectedImage.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="dialog-footer">
                <button
                  className="secondary-button"
                  onClick={() => setShowImageViewDialog(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Image Confirmation Dialog */}
        {showImageDeleteDialog && selectedImage && (
          <div className="dialog-overlay" onClick={() => setShowImageDeleteDialog(false)}>
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
                  <h4>Delete this image?</h4>
                  <p>This action cannot be undone.</p>
                </div>
              </div>

              <div className="dialog-footer">
                <button
                  className="secondary-button"
                  onClick={() => setShowImageDeleteDialog(false)}
                >
                  Cancel
                </button>
                <button
                  className="danger-button"
                  onClick={() => handleImageDelete(selectedImage.id)}
                >
                  Delete image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Highlight/Video Add/Edit Dialog */}
        {showHighlightDialog && (
          <div className="dialog-overlay" onClick={() => setShowHighlightDialog(false)}>
            <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>{editingHighlight ? "Edit" : "Add"} Gallery Video</h3>
                <button
                  className="icon-button"
                  onClick={() => setShowHighlightDialog(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="dialog-body">
                {highlightForm.thumbnailPreview && (
                  <div className="image-preview-container">
                    <img src={highlightForm.thumbnailPreview} alt="Thumbnail" />
                  </div>
                )}

                <label className="field">
                  <span>
                    Video {!editingHighlight && <span className="required">*</span>}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                  />
                </label>

                <label className="field">
                  <span>Thumbnail (Optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                  />
                </label>

                <label className="field">
                  <span>
                    Title <span className="required">*</span>
                  </span>
                  <input
                    type="text"
                    value={highlightForm.title}
                    onChange={(e) =>
                      setHighlightForm({ ...highlightForm, title: e.target.value })
                    }
                    placeholder="e.g., Amazing Goal"
                  />
                </label>

                <label className="field">
                  <span>Tags</span>
                  <input
                    type="text"
                    value={highlightForm.tags}
                    onChange={(e) =>
                      setHighlightForm({ ...highlightForm, tags: e.target.value })
                    }
                    placeholder="e.g., goal, save, skills"
                  />
                </label>

                <div className="field-row">
                  <label className="field">
                    <span>Sort Order</span>
                    <input
                      type="number"
                      value={highlightForm.sort_order}
                      onChange={(e) =>
                        setHighlightForm({
                          ...highlightForm,
                          sort_order: parseInt(e.target.value) || 1,
                        })
                      }
                      min="1"
                    />
                  </label>

                  <label className="field checkbox-field">
                    <input
                      type="checkbox"
                      checked={highlightForm.is_active}
                      onChange={(e) =>
                        setHighlightForm({ ...highlightForm, is_active: e.target.checked })
                      }
                    />
                    <span>Show on website</span>
                  </label>
                </div>
              </div>

              <div className="dialog-footer">
                <button
                  className="secondary-button"
                  onClick={() => setShowHighlightDialog(false)}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={handleHighlightSave}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Video Dialog */}
        {showHighlightViewDialog && selectedHighlight && (
          <div className="dialog-overlay" onClick={() => setShowHighlightViewDialog(false)}>
            <div className="dialog-content view-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>View Gallery Video</h3>
                <button
                  className="icon-button"
                  onClick={() => setShowHighlightViewDialog(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="dialog-body">
                <div className="video-preview-container">
                  <video controls src={selectedHighlight.video_url} />
                </div>

                <div className="view-details">
                  <div className="view-detail-item">
                    <span className="detail-label">Title</span>
                    <span className="detail-value">{selectedHighlight.title}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Tags</span>
                    <span className="detail-value">{selectedHighlight.tags}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Sort Order</span>
                    <span className="detail-value">{selectedHighlight.sort_order}</span>
                  </div>

                  <div className="view-detail-item">
                    <span className="detail-label">Status</span>
                    <span className={`booking-status ${selectedHighlight.is_active ? "confirmed" : "cancelled"}`}>
                      {selectedHighlight.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="dialog-footer">
                <button
                  className="secondary-button"
                  onClick={() => setShowHighlightViewDialog(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Video Confirmation Dialog */}
        {showHighlightDeleteDialog && selectedHighlight && (
          <div className="dialog-overlay" onClick={() => setShowHighlightDeleteDialog(false)}>
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
                  <h4>Delete this video?</h4>
                  <p>This action cannot be undone.</p>
                </div>
              </div>

              <div className="dialog-footer">
                <button
                  className="secondary-button"
                  onClick={() => setShowHighlightDeleteDialog(false)}
                >
                  Cancel
                </button>
                <button
                  className="danger-button"
                  onClick={() => handleHighlightDelete(selectedHighlight.id)}
                >
                  Delete video
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
