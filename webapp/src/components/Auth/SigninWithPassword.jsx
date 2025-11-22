"use client";
import { EmailIcon } from "@/assets/icons";
import Link from "next/link";
import React, { useState } from "react";
import InputGroup from "../FormElements/InputGroup";
import { toast } from "react-toastify";

async function loginUser({ email, password }) {
  const res = await fetch(`/api/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Invalid email or password");
  }

  return res.json();
}

export default function SigninWithPassword() {
  const [data, setData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { email, password } = data;
    if (!email || !password) {
      toast.error("Email and password required");
      setLoading(false);
      return;
    }

    try {
      // 1) Login and get JWT token
      const { token } = await loginUser({ email, password });

      // 2) Set session cookie with the token
      const s = await fetch("/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        credentials: "include",
        cache: "no-store",
        redirect: "manual", // ensure we don't silently follow any redirects
      });

      if (!s.ok) {
        const err = await s.json().catch(() => ({}));
        throw new Error(err.error || "Failed to set session");
      }

      // 3) Hard navigation so middleware/SSR sees the cookie instantly
      window.location.assign("/");
    } catch (err) {
      toast.error(
        "Error logging in user" + (err?.message ? `: ${err.message}` : ""),
      );
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <InputGroup
          type="email"
          label="Email"
          className="mb-4 [&_input]:py-[15px]"
          placeholder="Enter your email"
          name="email"
          handleChange={handleChange}
          value={data.email}
          icon={<EmailIcon />}
        />

        <InputGroup
          type="password"
          label="Password"
          className="mb-5 [&_input]:py-[15px]"
          placeholder="Enter your password"
          name="password"
          handleChange={handleChange}
          value={data.password}
          showPasswordToggle={true}
        />

        <div className="mb-6 grid justify-items-end py-2 font-medium">
          <Link
            href="/forgot-password"
            className="hover:text-primary dark:text-white dark:hover:text-primary"
          >
            Forgot Password?
          </Link>
        </div>

        <div className="mb-4.5">
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
          >
            Sign In
            {loading && (
              <span className="inline-block size-3 h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
            )}
          </button>
        </div>
      </form>
    </>
  );
}
