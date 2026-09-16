import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiRequest } from "../api/api";

import type {
  StudentResponse,
  StudentSaveResponse,
} from "../types/student";

interface StudentFormData {
  studentName: string;
  fatherName: string;
  grandfatherName: string;
  greatGrandfatherName: string;

  motherName: string;
  motherFatherName: string;

  birthDate: string;

  registerNo: string;
  pageNo: string;
}

const initialForm: StudentFormData = {
  studentName: "",
  fatherName: "",
  grandfatherName: "",
  greatGrandfatherName: "",

  motherName: "",
  motherFatherName: "",

  birthDate: "",

  registerNo: "",
  pageNo: "",
};

export default function StudentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);

  const [form, setForm] =
    useState<StudentFormData>(initialForm);

  const [loading, setLoading] =
    useState(isEdit);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    async function loadStudent() {
      try {
        setLoading(true);
        setError("");

        const result =
          await apiRequest<StudentResponse>(
            `/api/students/${id}`
          );

        const student = result.student;

        setForm({
          studentName:
            student.student_name ?? "",

          fatherName:
            student.father_name ?? "",

          grandfatherName:
            student.grandfather_name ?? "",

          greatGrandfatherName:
            student.great_grandfather_name ?? "",

          motherName:
            student.mother_name ?? "",

          motherFatherName:
            student.mother_father_name ?? "",

          birthDate:
            student.birth_date ?? "",

          registerNo:
            student.register_no ?? "",

          pageNo:
            student.page_no ?? "",
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء تحميل الطالب"
        );
      } finally {
        setLoading(false);
      }
    }

    loadStudent();
  }, [id, isEdit]);

  function updateField(
    field: keyof StudentFormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      if (isEdit) {
        await apiRequest<StudentSaveResponse>(
          `/api/students/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(form),
          }
        );
      } else {
        await apiRequest<StudentSaveResponse>(
          "/api/students",
          {
            method: "POST",
            body: JSON.stringify(form),
          }
        );
      }

      navigate("/students");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حفظ البيانات"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        className="student-form-page"
        dir="rtl"
      >
        جاري تحميل بيانات الطالب...
      </div>
    );
  }

  return (
    <div
      className="student-form-page"
      dir="rtl"
    >
      <div className="student-form-header">
        <div>
          <h1>
            {isEdit
              ? "تعديل بيانات الطالب"
              : "إضافة طالب جديد"}
          </h1>

          <p>
            أدخل بيانات السجل المدرسي
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate("/students")
          }
        >
          رجوع
        </button>
      </div>

      <form
        className="student-form-card"
        onSubmit={handleSubmit}
      >
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-section">
          <h2>بيانات الطالب</h2>

          <div className="form-grid">
            <label>
              اسم الطالب *
              <input
                required
                value={form.studentName}
                onChange={(e) =>
                  updateField(
                    "studentName",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              اسم الأب *
              <input
                required
                value={form.fatherName}
                onChange={(e) =>
                  updateField(
                    "fatherName",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              اسم الجد
              <input
                value={form.grandfatherName}
                onChange={(e) =>
                  updateField(
                    "grandfatherName",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              اسم أب الجد
              <input
                value={
                  form.greatGrandfatherName
                }
                onChange={(e) =>
                  updateField(
                    "greatGrandfatherName",
                    e.target.value
                  )
                }
              />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>بيانات الأم</h2>

          <div className="form-grid">
            <label>
              اسم الأم
              <input
                value={form.motherName}
                onChange={(e) =>
                  updateField(
                    "motherName",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              اسم أب الأم
              <input
                value={
                  form.motherFatherName
                }
                onChange={(e) =>
                  updateField(
                    "motherFatherName",
                    e.target.value
                  )
                }
              />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>بيانات السجل</h2>

          <div className="form-grid">
            <label>
              تاريخ الميلاد
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) =>
                  updateField(
                    "birthDate",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              رقم السجل *
              <input
                required
                value={form.registerNo}
                onChange={(e) =>
                  updateField(
                    "registerNo",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              رقم الصفحة *
              <input
                required
                value={form.pageNo}
                onChange={(e) =>
                  updateField(
                    "pageNo",
                    e.target.value
                  )
                }
              />
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate("/students")
            }
          >
            إلغاء
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving
              ? "جاري الحفظ..."
              : isEdit
                ? "حفظ التعديلات"
                : "حفظ الطالب"}
          </button>
        </div>
      </form>
    </div>
  );
}
