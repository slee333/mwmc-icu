"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      router.push("/enroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">&#x2695;</div>
          <h1 className="text-2xl font-bold tracking-tight">
            ICU LLM Study Platform
          </h1>
          <p className="text-sm text-text-dim mt-2">
            Sign in to access the enrollment portal
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>
            <div className="mb-6">
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 bg-danger/5 border border-danger/20 rounded-lg mb-4">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={!username || !password}
              loading={loading}
              className="w-full justify-center"
            >
              Sign In
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-text-muted mt-6">
          Research Use Only &middot; Authorized Personnel
        </p>
      </div>
    </div>
  );
}
