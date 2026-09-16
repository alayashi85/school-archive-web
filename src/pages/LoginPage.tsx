import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../api/api";

import type {
  LoginResponse,
} from "../types/auth";

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result =
        await apiRequest<LoginResponse>(
          "/api/auth/login",
          {
            method: "POST",
            body: JSON.stringify({
              username,
              password,
            }),
          }
        );

      localStorage.setItem(
        "token",
        result.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(
          result.user
        )
      );

      navigate("/students");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تسجيل الدخول"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="login-page"
      dir="rtl"
    >
      <div className="login-wrapper">
        <div className="login-brand">
          <div className="login-logo">
            س
          </div>

          <h1>
            أرشيف المدرسة
          </h1>

          <p>
            نظام أرشفة سجلات الطلاب
          </p>
        </div>

        <form
          className="login-card"
          onSubmit={handleSubmit}
        >
          <div className="login-card-header">
            <h2>
              تسجيل الدخول
            </h2>

            <p>
              أدخل اسم المستخدم
              وكلمة المرور
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <label>
            اسم المستخدم

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
              autoComplete="username"
              placeholder="اسم المستخدم"
              required
            />
          </label>

          <label>
            كلمة المرور

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              autoComplete="current-password"
              placeholder="كلمة المرور"
              required
            />
          </label>

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading
              ? "جاري تسجيل الدخول..."
              : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
