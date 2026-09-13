import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { authFetch } from "../lib/api";

type Tab = "faq" | "policy";

type FAQ = {
  id?: string;
  question: string;
  answer: string;
};

type PolicyContent = {
  terms: string;
  privacy: string;
};

const apiBase = () =>
  import.meta.env.DEV ? "/backend" : import.meta.env.VITE_API_BASE_URL || "";

export function CMSFAQsPolicyPage() {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab: Tab = location.pathname === "/cms/terms-policy" ? "policy" : "faq";
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [policy, setPolicy] = useState<PolicyContent>({
    terms: "",
    privacy: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState("");
  const [faqPage, setFaqPage] = useState(1);
  const [faqRowsPerPage, setFaqRowsPerPage] = useState(10);
  const [faqForm, setFaqForm] = useState<FAQ>({
    question: "",
    answer: "",
  });
  const filteredFaqs = faqs.filter((faq) =>
    `${faq.question} ${faq.answer}`.toLowerCase().includes(faqSearch.trim().toLowerCase()),
  );
  const faqTotalPages = Math.max(1, Math.ceil(filteredFaqs.length / faqRowsPerPage));
  const paginatedFaqs = filteredFaqs.slice(
    (faqPage - 1) * faqRowsPerPage,
    faqPage * faqRowsPerPage,
  );

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [faqResponse, policyResponse] = await Promise.all([
          authFetch(`${apiBase()}/api/v1/cms/faq/`),
          authFetch(`${apiBase()}/api/v1/cms/terms-and-privacy/`),
        ]);
        const [faqBody, policyBody] = await Promise.all([
          faqResponse.json().catch(() => ({})),
          policyResponse.json().catch(() => ({})),
        ]);

        if (faqResponse.ok && faqBody.success) {
          const data = faqBody.data?.results || faqBody.data || [];
          setFaqs(Array.isArray(data) ? data : []);
        }
        if (policyResponse.ok && policyBody.success && policyBody.data) {
          setPolicy({
            terms: policyBody.data.terms || "",
            privacy: policyBody.data.privacy || "",
          });
        }
      } catch (error) {
        console.error("Failed to load FAQs and policy content:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadContent();
  }, []);

  useEffect(() => {
    setFaqPage((page) => Math.min(page, faqTotalPages));
  }, [faqTotalPages]);

  const openAddFaq = () => {
    setEditingFaqIndex(null);
    setFaqForm({ question: "", answer: "" });
    setShowFaqDialog(true);
  };

  const openEditFaq = (index: number) => {
    setEditingFaqIndex(index);
    setFaqForm(faqs[index]);
    setShowFaqDialog(true);
  };

  const saveFaqForm = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      showToast("A question and answer are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const editingFaq = editingFaqIndex === null ? null : faqs[editingFaqIndex];
      const response = await authFetch(
        editingFaq?.id
          ? `${apiBase()}/api/v1/cms/faq/${editingFaq.id}/`
          : `${apiBase()}/api/v1/cms/faq/`,
        {
          method: editingFaq?.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: faqForm.question, answer: faqForm.answer }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Failed to save FAQ");
      }
      if (editingFaqIndex === null) {
        setFaqs((current) => [...current, body.data]);
      } else {
        setFaqs((current) => current.map((faq, index) => index === editingFaqIndex ? body.data : faq));
      }
      showToast(body.message || "FAQ saved successfully.", "success");
      setShowFaqDialog(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to save FAQ", "error");
    } finally {
      setSaving(false);
    }
  };

  const removeFaq = async (index: number) => {
    const faq = faqs[index];
    if (!faq.id) return;
    setSaving(true);
    try {
      const response = await authFetch(`${apiBase()}/api/v1/cms/faq/${faq.id}/`, {
        method: "DELETE",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Failed to delete FAQ");
      }
      setFaqs((current) => current.filter((_, itemIndex) => itemIndex !== index));
      showToast(body.message || "FAQ deleted successfully.", "success");
      setFaqToDelete(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to delete FAQ", "error");
    } finally {
      setSaving(false);
    }
  };

  const savePolicy = async () => {
    setSaving(true);
    try {
      const response = await authFetch(`${apiBase()}/api/v1/cms/terms-and-privacy/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policy),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Failed to save terms and policy");
      }
      showToast(body.message || "Terms & Policy updated successfully.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to save terms and policy", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cms-page">
      <header className="page-header">
        <div>
          <h1>CMS - FAQs &amp; Policy</h1>
          <p className="page-description">Manage frequently asked questions, terms, and privacy policy content</p>
        </div>
      </header>

      <div className="cms-tabs" role="tablist" aria-label="FAQs and policy sections">
        <button className={`cms-tab ${activeTab === "faq" ? "active" : ""}`} onClick={() => navigate("/cms/faqs-policy")} role="tab" aria-selected={activeTab === "faq"}>FAQ</button>
        <button className={`cms-tab ${activeTab === "policy" ? "active" : ""}`} onClick={() => navigate("/cms/terms-policy")} role="tab" aria-selected={activeTab === "policy"}>Terms &amp; Policy</button>
      </div>

      <div className="cms-content-card">
        {loading ? <div className="loading-state">Loading...</div> : activeTab === "faq" ? (
          <div className="cms-section">
              <div className="section-header">
              <div><h2>Frequently Asked Questions</h2><p className="section-description">Add and maintain the answers shown to customers.</p></div>
              <button type="button" className="secondary-button" onClick={openAddFaq}><Plus size={16} />Add FAQ</button>
            </div>
            <div className="filters-bar"><div className="search-box"><input type="search" placeholder="Search FAQs..." value={faqSearch} onChange={(event) => { setFaqSearch(event.target.value); setFaqPage(1); }} /></div></div>
            {filteredFaqs.length > 0 ? <><div className="table-scroll"><table className="bookings-table faq-table"><thead><tr><th>SN</th><th>Question</th><th>Answer</th><th className="booking-actions-heading">Action</th></tr></thead><tbody>{paginatedFaqs.map((faq, index) => { const faqIndex = faqs.indexOf(faq); return <tr key={faq.id || faqIndex}><td>{(faqPage - 1) * faqRowsPerPage + index + 1}</td><td><span className="table-name">{faq.question}</span></td><td className="faq-answer-cell">{faq.answer}</td><td><div className="booking-actions"><button type="button" title="Edit FAQ" aria-label="Edit FAQ" onClick={() => openEditFaq(faqIndex)}><Pencil size={14} /></button><button type="button" title="Remove FAQ" aria-label="Remove FAQ" className="danger-action" onClick={() => setFaqToDelete(faqIndex)} disabled={saving}><Trash2 size={14} /></button></div></td></tr>; })}</tbody></table></div><div className="pagination"><div className="pagination-left"><div className="booking-rows-select"><label>Rows per page</label><select value={faqRowsPerPage} onChange={(event) => { setFaqRowsPerPage(Number(event.target.value)); setFaqPage(1); }}><option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></div><div className="pagination-info">{(faqPage - 1) * faqRowsPerPage + 1}–{Math.min(faqPage * faqRowsPerPage, filteredFaqs.length)} of {filteredFaqs.length}</div></div><div className="pagination-controls"><button onClick={() => setFaqPage((page) => page - 1)} disabled={faqPage === 1} aria-label="Previous page"><ChevronLeft size={16} /></button><span className="page-number">Page {faqPage} of {faqTotalPages}</span><button onClick={() => setFaqPage((page) => page + 1)} disabled={faqPage === faqTotalPages} aria-label="Next page"><ChevronRight size={16} /></button></div></div></> : <div className="empty-state"><p>{faqSearch ? "No FAQs match your search." : "No FAQs added yet."}</p></div>}
            {showFaqDialog && <div className="dialog-overlay" onClick={() => setShowFaqDialog(false)}><div className="dialog-content" onClick={(event) => event.stopPropagation()}><div className="dialog-header"><h3>{editingFaqIndex === null ? "Add FAQ" : "Edit FAQ"}</h3><button className="icon-button" onClick={() => setShowFaqDialog(false)} aria-label="Close"><X size={20} /></button></div><div className="dialog-body"><label className="field"><span>Question <span className="required">*</span></span><input value={faqForm.question} onChange={(event) => setFaqForm((current) => ({ ...current, question: event.target.value }))} placeholder="Enter a question" autoFocus /></label><label className="field"><span>Answer <span className="required">*</span></span><textarea rows={5} value={faqForm.answer} onChange={(event) => setFaqForm((current) => ({ ...current, answer: event.target.value }))} placeholder="Enter the answer" /></label></div><div className="dialog-footer"><button className="secondary-button" onClick={() => setShowFaqDialog(false)}>Cancel</button><button className="primary-button" onClick={() => void saveFaqForm()} disabled={saving}><Save size={16} />{saving ? "Saving..." : "Save FAQ"}</button></div></div></div>}
            {faqToDelete !== null && <div className="dialog-overlay" onClick={() => setFaqToDelete(null)}><div className="dialog-content delete-dialog" onClick={(event) => event.stopPropagation()}><div className="dialog-body"><div className="delete-confirmation"><div className="delete-icon"><Trash2 size={32} /></div><h4>Delete this FAQ?</h4><p>This action cannot be undone.</p></div></div><div className="dialog-footer"><button className="secondary-button" onClick={() => setFaqToDelete(null)} disabled={saving}>Cancel</button><button className="danger-button" onClick={() => void removeFaq(faqToDelete)} disabled={saving}>{saving ? "Deleting..." : "Delete FAQ"}</button></div></div></div>}
          </div>
        ) : (
          <div className="cms-section">
            <h2>Terms &amp; Policy</h2>
            <p className="section-description">Manage the legal content displayed to customers.</p>
            <div className="cms-form">
              <label className="field"><span>Terms &amp; Conditions</span><textarea rows={12} value={policy.terms} onChange={(event) => setPolicy((current) => ({ ...current, terms: event.target.value }))} placeholder="Enter your terms and conditions" /></label>
              <label className="field"><span>Privacy Policy</span><textarea rows={12} value={policy.privacy} onChange={(event) => setPolicy((current) => ({ ...current, privacy: event.target.value }))} placeholder="Enter your privacy policy" /></label>
            </div>
            <div className="cms-actions"><button className="primary-button" onClick={savePolicy} disabled={saving}><Save size={16} />{saving ? "Saving..." : "Save Terms & Policy"}</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
