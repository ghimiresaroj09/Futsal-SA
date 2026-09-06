import { LockKeyhole, Mail, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setAuthTokens } from "../lib/auth";
import { useToast } from "../components/ui/Toast";

type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    access: string;
    refresh: string;
    user: {
      id: string;
      full_name: string;
      email: string;
      phone_number: string;
      profile_image: string | null;
      role: string;
      is_verified: boolean;
      created_at: string;
    };
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem("remember_me") !== "false",
  );
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() => ({
    email: localStorage.getItem("remembered_email") || "",
    password: "",
  }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post<LoginResponse>("/api/v1/auth/login/", {
        email: form.email,
        password: form.password,
      });
      const { access, refresh, user } = response.data.data;
      setAuthTokens(access, refresh, rememberMe);
      localStorage.setItem("current_user", JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem("remember_me", "true");
        localStorage.setItem("remembered_email", form.email);
      } else {
        localStorage.setItem("remember_me", "false");
        localStorage.removeItem("remembered_email");
      }
      showToast(response.data.message || "Login successful.", "success");
      navigate("/");
    } catch (requestError: any) {
      const responseData = requestError.response?.data;
      const detail = responseData?.errors?.detail;
      const message =
        responseData?.message ||
        (Array.isArray(detail) ? detail[0] : detail) ||
        "Unable to sign in. Please check your email and password.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-brand">
        <span className="brand-mark">N</span>
        <span>Nexus FMS</span>
      </div>
      <section className="login-card">
        <div className="login-heading">
          <h1>Welcome back</h1>
          <p>Sign in to continue to your workspace.</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-field">
            <span>Email Address</span>
            <div className="input-with-icon">
              <Mail size={17} />
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </label>
          <label className="login-field">
            <span>Password</span>
            <div className="input-with-icon">
              <LockKeyhole size={17} />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          <div className="login-options">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setRememberMe(checked);
                  if (!checked) {
                    localStorage.setItem("remember_me", "false");
                    localStorage.removeItem("remembered_email");
                  }
                }}
              />
              <span>Remember me</span>
            </label>
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <LoaderCircle size={16} className="spin" />
                Signing in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </section>
      <p className="login-footer">© 2026 Nexus FMS. All rights reserved.</p>
    </main>
  );
}
