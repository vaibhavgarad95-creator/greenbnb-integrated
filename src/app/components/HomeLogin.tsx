
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomeLogin() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to sign in. Check your credentials.");
        return;
      }

      setOpen(false);
      setEmail("");
      setPassword("");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        style={{
          border: "1px solid #238052",
          borderRadius: 24,
          padding: "10px 18px",
          background: "#fff",
          color: "#238052",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Log in
      </button>

      {open && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(0,0,0,0.45)",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-login-title"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 420,
              padding: 28,
              borderRadius: 20,
              background: "#fff",
              color: "#20352b",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close login"
              style={{
                position: "absolute",
                top: 14,
                right: 16,
                border: 0,
                background: "transparent",
                fontSize: 26,
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <h2
              id="home-login-title"
              style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}
            >
              Welcome back
            </h2>

            <p style={{ color: "#647469", marginBottom: 22 }}>
              Sign in to continue to GreenBnB.
            </p>

            <form onSubmit={handleLogin}>
              <label
                htmlFor="home-login-email"
                style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
              >
                Email
              </label>

              <input
                id="home-login-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />

              <label
                htmlFor="home-login-password"
                style={{
                  display: "block",
                  fontWeight: 600,
                  margin: "16px 0 6px",
                }}
              >
                Password
              </label>

              <div style={{ position: "relative" }}>
                <input
                  id="home-login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  style={{ ...inputStyle, paddingRight: 65 }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 13,
                    border: 0,
                    background: "transparent",
                    color: "#238052",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {error && (
                <p
                  role="alert"
                  style={{
                    marginTop: 14,
                    padding: 10,
                    borderRadius: 8,
                    background: "#fff0f0",
                    color: "#b42318",
                    fontSize: 14,
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: 22,
                  padding: 13,
                  border: 0,
                  borderRadius: 10,
                  background: "#238052",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p
              style={{
                marginTop: 20,
                textAlign: "center",
                fontSize: 14,
                color: "#647469",
              }}
            >
              New here?{" "}
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                style={{ color: "#238052", fontWeight: 700 }}
              >
                Create account
              </Link>
            </p>
          </section>
        </div>
      )}
    </>
  );
}

const inputStyle = {
  boxSizing: "border-box" as const,
  width: "100%",
  padding: 12,
  border: "1px solid #d5dfd5",
  borderRadius: 9,
  background: "#fff",
  color: "#20352b",
  fontSize: 15,
};
