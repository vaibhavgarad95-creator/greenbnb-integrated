
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please check your details.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f1] flex items-center justify-center p-5">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid md:grid-cols-2">
        {/* Left side */}
        <section className="relative flex min-h-[260px] flex-col justify-between overflow-hidden bg-[#244b35] p-8 text-white sm:p-12 md:min-h-[650px]">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/20" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full border border-white/20" />

          <Link href="/" className="relative z-10 text-2xl font-bold">
            🌿 GreenBnB
          </Link>

          <div className="relative z-10 my-8">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-green-200">
              Travel responsibly
            </p>

            <h1 className="max-w-md text-4xl font-bold leading-tight sm:text-5xl">
              Stay closer to nature.
            </h1>

            <p className="mt-5 max-w-md leading-7 text-green-100">
              Discover peaceful stays, explore beautiful destinations, and
              make your next journey a little greener.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-white/25 px-4 py-2">
                🌳 Nature stays
              </span>
              <span className="rounded-full border border-white/25 px-4 py-2">
                ♻️ Sustainable travel
              </span>
            </div>
          </div>

          <p className="relative z-10 text-sm text-green-200">
            Make memories. Leave a lighter footprint.
          </p>
        </section>

        {/* Right side */}
        <section className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-8 inline-flex text-sm text-gray-500 transition hover:text-[#244b35]"
            >
              ← Back to home
            </Link>

            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back!
            </h2>

            <p className="mt-2 text-gray-500">
              Sign in to continue your GreenBnB journey.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition placeholder:text-gray-400 focus:border-[#326847] focus:ring-4 focus:ring-green-100"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-20 outline-none transition placeholder:text-gray-400 focus:border-[#326847] focus:ring-4 focus:ring-green-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 text-sm font-semibold text-[#326847] hover:text-[#193d28]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#244b35] px-4 py-3.5 font-semibold text-white shadow-md transition hover:bg-[#193d28] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-gray-400">New to GreenBnB?</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <Link
              href="/register"
              className="block w-full rounded-xl border border-[#326847] px-4 py-3 text-center font-semibold text-[#244b35] transition hover:bg-green-50"
            >
              Create an account
            </Link>

            <p className="mt-8 text-center text-xs leading-5 text-gray-400">
              By signing in, you agree to use GreenBnB responsibly and respect
              the privacy of other users.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
