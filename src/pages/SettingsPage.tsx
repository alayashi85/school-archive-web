import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import { useNavigate } from "react-router-dom";

import { apiRequest } from "../api/api";

import "./SettingsPage.css";

interface SettingsResponse {
  ok: boolean;

  settings: {
    edit_window_minutes: number;
    updated_at: string | null;
    updated_by: number | null;
  };
}

interface SettingsSaveResponse {
  ok: boolean;
  editWindowMinutes: number;
}

const quickOptions = [
  {
    label: "30 دقيقة",
    value: 30,
  },
  {
    label: "ساعة واحدة",
    value: 60,
  },
  {
    label: "6 ساعات",
    value: 360,
  },
  {
    label: "12 ساعة",
    value: 720,
  },
  {
    label: "24 ساعة",
    value: 1440,
  },
  {
    label: "48 ساعة",
    value: 2880,
  },
  {
    label: "7 أيام",
    value: 10080,
  },
];

function formatDuration(
  minutes: number
) {
  if (minutes === 0) {
    return "التعديل غير مسموح للمستخدمين";
  }

  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }

  if (
    minutes % 1440 === 0
  ) {
    const days =
      minutes / 1440;

    return days === 1
      ? "يوم واحد"
      : `${days} أيام`;
  }

  if (
    minutes % 60 === 0
  ) {
    const hours =
      minutes / 60;

    return hours === 1
      ? "ساعة واحدة"
      : `${hours} ساعات`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const remainingMinutes =
    minutes % 60;

  return `${hours} ساعة و ${remainingMinutes} دقيقة`;
}

export default function SettingsPage() {
  const navigate =
    useNavigate();

  const [
    editWindowMinutes,
    setEditWindowMinutes,
  ] = useState(1440);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [updatedAt, setUpdatedAt] =
    useState<string | null>(
      null
    );

  const durationText =
    useMemo(
      () =>
        formatDuration(
          editWindowMinutes
        ),
      [editWindowMinutes]
    );

  async function loadSettings() {
    setLoading(true);
    setError("");

    try {
      const result =
        await apiRequest<SettingsResponse>(
          "/api/settings"
        );

      setEditWindowMinutes(
        result.settings
          .edit_window_minutes
      );

      setUpdatedAt(
        result.settings.updated_at
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل الإعدادات"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer =
      window.setTimeout(
        () => setError(""),
        5000
      );

    return () =>
      window.clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer =
      window.setTimeout(
        () => setSuccess(""),
        4000
      );

    return () =>
      window.clearTimeout(timer);
  }, [success]);

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !Number.isInteger(
        editWindowMinutes
      ) ||
      editWindowMinutes < 0
    ) {
      setError(
        "مدة التعديل يجب أن تكون رقمًا صحيحًا أكبر من أو يساوي صفر"
      );

      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result =
        await apiRequest<SettingsSaveResponse>(
          "/api/settings",
          {
            method: "PUT",

            body: JSON.stringify({
              editWindowMinutes,
            }),
          }
        );

      setEditWindowMinutes(
        result.editWindowMinutes
      );

      setSuccess(
        "تم حفظ الإعدادات بنجاح"
      );

      await loadSettings();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حفظ الإعدادات"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        className="settings-page"
        dir="rtl"
      >
        <div className="settings-loading">
          جاري تحميل الإعدادات...
        </div>
      </div>
    );
  }

  return (
    <div
      className="settings-page"
      dir="rtl"
    >
      <div className="settings-container">
        <header className="settings-header">
          <div>
            <h1>
              إعدادات النظام
            </h1>

            <p>
              التحكم بمدة السماح
              للمستخدمين بتعديل
              سجلات الطلاب
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(
                "/students"
              )
            }
          >
            العودة
          </button>
        </header>

                {(error || success) && (
          <div
            className="settings-toast-stack"
            aria-live="polite"
            aria-atomic="true"
          >
            {error && (
              <div
                className="settings-toast settings-toast-error"
                role="alert"
              >
                <div className="settings-toast-icon">
                  !
                </div>

                <div className="settings-toast-content">
                  <strong>
                    تعذر إكمال العملية
                  </strong>
                  <span>{error}</span>
                </div>

                <button
                  type="button"
                  className="settings-toast-close"
                  onClick={() =>
                    setError("")
                  }
                  aria-label="إغلاق الإشعار"
                >
                  ×
                </button>
              </div>
            )}

            {success && (
              <div
                className="settings-toast settings-toast-success"
                role="status"
              >
                <div className="settings-toast-icon">
                  ✓
                </div>

                <div className="settings-toast-content">
                  <strong>
                    تمت العملية بنجاح
                  </strong>
                  <span>{success}</span>
                </div>

                <button
                  type="button"
                  className="settings-toast-close"
                  onClick={() =>
                    setSuccess("")
                  }
                  aria-label="إغلاق الإشعار"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        <form
          className="settings-card"
          onSubmit={
            handleSave
          }
        >
          <div className="settings-section">
            <h2>
              مدة السماح بالتعديل
            </h2>

            <p className="settings-description">
              هذه المدة تطبق على
              المستخدمين العاديين فقط.
              المدير يستطيع التعديل دائمًا.
            </p>

            <div className="current-setting">
              <span>
                المدة الحالية
              </span>

              <strong>
                {durationText}
              </strong>
            </div>

            <div className="quick-options">
              {quickOptions.map(
                (option) => (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    className={
                      editWindowMinutes ===
                      option.value
                        ? "quick-option active"
                        : "quick-option"
                    }
                    onClick={() =>
                      setEditWindowMinutes(
                        option.value
                      )
                    }
                  >
                    {option.label}
                  </button>
                )
              )}
            </div>

            <div className="manual-setting">
              <label>
                المدة بالدقائق

                <input
                  type="number"
                  min="0"
                  max="525600"
                  step="1"
                  value={
                    editWindowMinutes
                  }
                  onChange={(e) =>
                    setEditWindowMinutes(
                      Number(
                        e.target.value
                      )
                    )
                  }
                />
              </label>

              <div className="setting-help">
                <strong>
                  ملاحظة:
                </strong>

                <span>
                  القيمة 0 تعني أن
                  المستخدم العادي لا
                  يستطيع تعديل السجل
                  بعد إضافته.
                </span>
              </div>
            </div>
          </div>

          <div className="settings-info">
            <div>
              <span>
                القيمة المخزنة
              </span>

              <strong>
                {
                  editWindowMinutes
                }{" "}
                دقيقة
              </strong>
            </div>

            <div>
              <span>
                آخر تحديث
              </span>

              <strong>
                {updatedAt ||
                  "-"}
              </strong>
            </div>
          </div>

          <div className="settings-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "جاري الحفظ..."
                : "حفظ الإعدادات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}