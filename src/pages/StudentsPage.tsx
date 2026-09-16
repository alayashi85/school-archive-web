import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  FormEvent,
  KeyboardEvent,
} from "react";

import { useNavigate } from "react-router-dom";

import { apiRequest } from "../api/api";

import type {
  Student,
  StudentsResponse,
  StudentSaveResponse,
} from "../types/student";

import "./StudentsPage.css";

interface CurrentUser {
  id: number;
  username: string;
  fullName: string;
  role: "ADMIN" | "USER";
}

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

const emptyForm: StudentFormData = {
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

function getFullName(
  student: Student
) {
  return [
    student.student_name,
    student.father_name,
    student.grandfather_name,
    student.great_grandfather_name,
  ]
    .filter(Boolean)
    .join(" ");
}

function getMotherFullName(
  student: Student
) {
  return [
    student.mother_name,
    student.mother_father_name,
  ]
    .filter(Boolean)
    .join(" ");
}

function getStudentRecord(
  student: Student
) {
  return `${student.register_no}\\${student.page_no}`;
}

export default function StudentsPage() {
  const navigate = useNavigate();

  const [students, setStudents] =
    useState<Student[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [deleteTarget, setDeleteTarget] =
    useState<Student | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  const [newStudent, setNewStudent] =
    useState<StudentFormData>(
      emptyForm
    );

  const [editingId, setEditingId] =
    useState<number | null>(
      null
    );

  const [editForm, setEditForm] =
    useState<StudentFormData>(
      emptyForm
    );

  const firstLoad =
    useRef(true);

  const studentNameInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const storedUser =
    localStorage.getItem(
      "user"
    );

  let currentUser:
    CurrentUser | null = null;

  try {
    currentUser =
      storedUser
        ? JSON.parse(
            storedUser
          )
        : null;
  } catch {
    currentUser = null;
  }

  async function loadStudents(
    q = ""
  ) {
    setLoading(true);
    setError("");

    try {
      const cleanSearch =
        q.trim();

      const query =
        cleanSearch
          ? `?q=${encodeURIComponent(
              cleanSearch
            )}`
          : "";

      const result =
        await apiRequest<StudentsResponse>(
          `/api/students${query}`
        );

      setStudents(
        result.students
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل الطلاب"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setError("");
        },
        5000
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [error]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setSuccess("");
        },
        4000
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  useEffect(() => {
    if (!deleteTarget) {
      return;
    }

    function handleEscape(
      event: globalThis.KeyboardEvent
    ) {
      if (
        event.key === "Escape" &&
        !deleting
      ) {
        setDeleteTarget(null);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [deleteTarget, deleting]);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          loadStudents(search);
        },
        300
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [search]);

  function updateNewStudent(
    field: keyof StudentFormData,
    value: string
  ) {
    setNewStudent(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function updateEditForm(
    field: keyof StudentFormData,
    value: string
  ) {
    setEditForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  async function handleAddStudent(
    event?: FormEvent
  ) {
    event?.preventDefault();

    if (
      !newStudent.studentName.trim() ||
      !newStudent.fatherName.trim() ||
      !newStudent.registerNo.trim() ||
      !newStudent.pageNo.trim()
    ) {
      setError(
        "اسم الطالب واسم الأب ورقم السجل ورقم الصفحة مطلوبة"
      );

      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest<StudentSaveResponse>(
        "/api/students",
        {
          method: "POST",
          body: JSON.stringify(
            newStudent
          ),
        }
      );

      setNewStudent(
        emptyForm
      );

      setSuccess(
        "تمت إضافة الطالب بنجاح"
      );

      await loadStudents(
        search
      );

      window.setTimeout(
        () => {
          studentNameInputRef.current?.focus();
        },
        50
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء إضافة الطالب"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleAddRowKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "Enter" &&
      event.currentTarget.name ===
        "pageNo"
    ) {
      event.preventDefault();

      handleAddStudent();
    }
  }

  function startEdit(
    student: Student
  ) {
    setError("");
    setSuccess("");

    setEditingId(
      student.id
    );

    setEditForm({
      studentName:
        student.student_name || "",

      fatherName:
        student.father_name || "",

      grandfatherName:
        student.grandfather_name || "",

      greatGrandfatherName:
        student.great_grandfather_name ||
        "",

      motherName:
        student.mother_name || "",

      motherFatherName:
        student.mother_father_name ||
        "",

      birthDate:
        student.birth_date || "",

      registerNo:
        student.register_no || "",

      pageNo:
        student.page_no || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);

    setEditForm(
      emptyForm
    );
  }

  async function saveEdit(
    studentId: number
  ) {
    if (
      !editForm.studentName.trim() ||
      !editForm.fatherName.trim() ||
      !editForm.registerNo.trim() ||
      !editForm.pageNo.trim()
    ) {
      setError(
        "اسم الطالب واسم الأب ورقم السجل ورقم الصفحة مطلوبة"
      );

      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest<StudentSaveResponse>(
        `/api/students/${studentId}`,
        {
          method: "PUT",

          body: JSON.stringify(
            editForm
          ),
        }
      );

      setEditingId(null);

      setEditForm(
        emptyForm
      );

      setSuccess(
        "تم تعديل بيانات الطالب بنجاح"
      );

      await loadStudents(
        search
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تعديل الطالب"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(
    student: Student
  ) {
    setError("");
    setSuccess("");
    setDeleteTarget(student);
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/api/students/${deleteTarget.id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "تم حذف الطالب نهائيًا"
      );

      setDeleteTarget(null);

      await loadStudents(
        search
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حذف الطالب"
      );
    } finally {
      setDeleting(false);
    }
  }

  function cancelDelete() {
    if (deleting) {
      return;
    }

    setDeleteTarget(null);
  }

  function handleLogout() {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login");
  }

  return (
    <div
      className="students-page"
      dir="rtl"
    >
      <header className="students-header">
        <div>
          <h1>
            أرشيف سجلات الطلاب
          </h1>

          <p>
            المستخدم الحالي:{" "}
            <strong>
              {currentUser?.fullName ||
                ""}
            </strong>

            {currentUser?.role && (
              <>
                {" "}
                -{" "}
                {currentUser.role ===
                "ADMIN"
                  ? "مدير"
                  : "مستخدم"}
              </>
            )}
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(
                "/students/export"
              )
            }
          >
            تصدير PDF
          </button>

          {currentUser?.role ===
            "ADMIN" && (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  navigate(
                    "/users"
                  )
                }
              >
                إدارة المستخدمين
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  navigate(
                    "/settings"
                  )
                }
              >
                الإعدادات
              </button>
            </>
          )}

          <button
            type="button"
            className="secondary-button"
            onClick={
              handleLogout
            }
          >
            تسجيل الخروج
          </button>
        </div>
      </header>

      <section className="students-toolbar">
        <div className="students-search">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="بحث بالاسم الرباعي أو السجل أو الصفحة..."
            autoComplete="off"
          />

          {search && (
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setSearch("")
              }
            >
              مسح
            </button>
          )}
        </div>

        <div className="students-count">
          عدد النتائج:{" "}
          <strong>
            {students.length}
          </strong>
        </div>
      </section>

      {(error || success) && (
        <div
          className="students-toast-stack"
          aria-live="polite"
          aria-atomic="true"
        >
          {error && (
            <div
              className="students-toast students-toast-error"
              role="alert"
            >
              <div className="students-toast-icon">
                !
              </div>

              <div className="students-toast-content">
                <strong>تعذر إكمال العملية</strong>
                <span>{error}</span>
              </div>

              <button
                type="button"
                className="students-toast-close"
                onClick={() => setError("")}
                aria-label="إغلاق الإشعار"
              >
                ×
              </button>
            </div>
          )}

          {success && (
            <div
              className="students-toast students-toast-success"
              role="status"
            >
              <div className="students-toast-icon">
                ✓
              </div>

              <div className="students-toast-content">
                <strong>تمت العملية بنجاح</strong>
                <span>{success}</span>
              </div>

              <button
                type="button"
                className="students-toast-close"
                onClick={() => setSuccess("")}
                aria-label="إغلاق الإشعار"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      <section className="desktop-students-view">
        <div className="students-card">
          <form
            onSubmit={
              handleAddStudent
            }
          >
            <div className="table-wrapper">
              <table className="students-table inline-students-table">
                <thead>
                  <tr>
                    <th>ت</th>
                    <th>اسم الطالب</th>
                    <th>الأب</th>
                    <th>الجد</th>
                    <th>أب الجد</th>
                    <th>الأم</th>
                    <th>أب الأم</th>
                    <th>المواليد</th>
                    <th>السجل</th>
                    <th>الصفحة</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="new-student-row">
                    <td>+</td>

                    <td>
                      <input
                        ref={studentNameInputRef}
                        type="text"
                        value={newStudent.studentName}
                        onChange={(e) =>
                          updateNewStudent(
                            "studentName",
                            e.target.value
                          )
                        }
                        placeholder="اسم الطالب"
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={newStudent.fatherName}
                        onChange={(e) =>
                          updateNewStudent(
                            "fatherName",
                            e.target.value
                          )
                        }
                        placeholder="الأب"
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={newStudent.grandfatherName}
                        onChange={(e) =>
                          updateNewStudent(
                            "grandfatherName",
                            e.target.value
                          )
                        }
                        placeholder="الجد"
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={newStudent.greatGrandfatherName}
                        onChange={(e) =>
                          updateNewStudent(
                            "greatGrandfatherName",
                            e.target.value
                          )
                        }
                        placeholder="أب الجد"
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={newStudent.motherName}
                        onChange={(e) =>
                          updateNewStudent(
                            "motherName",
                            e.target.value
                          )
                        }
                        placeholder="الأم"
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={newStudent.motherFatherName}
                        onChange={(e) =>
                          updateNewStudent(
                            "motherFatherName",
                            e.target.value
                          )
                        }
                        placeholder="أب الأم"
                      />
                    </td>

                    <td>
                      <input
                        type="date"
                        value={newStudent.birthDate}
                        onChange={(e) =>
                          updateNewStudent(
                            "birthDate",
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newStudent.registerNo}
                        onChange={(e) =>
                          updateNewStudent(
                            "registerNo",
                            e.target.value
                          )
                        }
                        placeholder="السجل"
                      />
                    </td>

                    <td>
                      <input
                        name="pageNo"
                        type="text"
                        inputMode="numeric"
                        value={newStudent.pageNo}
                        onChange={(e) =>
                          updateNewStudent(
                            "pageNo",
                            e.target.value
                          )
                        }
                        onKeyDown={handleAddRowKeyDown}
                        placeholder="الصفحة"
                      />
                    </td>

                    <td>
                      <button
                        type="submit"
                        className="inline-add-button"
                        disabled={saving}
                      >
                        {saving ? "..." : "إضافة"}
                      </button>
                    </td>
                  </tr>

                  {loading ? (
                    <tr>
                      <td colSpan={11} className="inline-table-message">
                        جاري تحميل السجلات...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="inline-table-message">
                        لا توجد سجلات
                      </td>
                    </tr>
                  ) : (
                    students.map((student, index) => {
                      const isEditing =
                        editingId === student.id;

                      if (isEditing) {
                        return (
                          <tr
                            key={student.id}
                            className="editing-student-row"
                          >
                            <td>{index + 1}</td>

                            <td>
                              <input
                                value={editForm.studentName}
                                onChange={(e) =>
                                  updateEditForm(
                                    "studentName",
                                    e.target.value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                value={editForm.fatherName}
                                onChange={(e) =>
                                  updateEditForm(
                                    "fatherName",
                                    e.target.value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                value={editForm.grandfatherName}
                                onChange={(e) =>
                                  updateEditForm(
                                    "grandfatherName",
                                    e.target.value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                value={editForm.greatGrandfatherName}
                                onChange={(e) =>
                                  updateEditForm(
                                    "greatGrandfatherName",
                                    e.target.value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                value={editForm.motherName}
                                onChange={(e) =>
                                  updateEditForm(
                                    "motherName",
                                    e.target.value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                value={editForm.motherFatherName}
                                onChange={(e) =>
                                  updateEditForm(
                                    "motherFatherName",
                                    e.target.value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                type="date"
                                value={editForm.birthDate}
                                onChange={(e) =>
                                  updateEditForm(
                                    "birthDate",
                                    e.target.value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                value={editForm.registerNo}
                                onChange={(e) =>
                                  updateEditForm(
                                    "registerNo",
                                    e.target.value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                value={editForm.pageNo}
                                onChange={(e) =>
                                  updateEditForm(
                                    "pageNo",
                                    e.target.value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <div className="inline-row-actions">
                                <button
                                  type="button"
                                  className="inline-save-button"
                                  onClick={() =>
                                    saveEdit(student.id)
                                  }
                                >
                                  حفظ
                                </button>

                                <button
                                  type="button"
                                  className="inline-cancel-button"
                                  onClick={cancelEdit}
                                >
                                  إلغاء
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td>{student.student_name}</td>
                          <td>{student.father_name}</td>
                          <td>{student.grandfather_name || "-"}</td>
                          <td>{student.great_grandfather_name || "-"}</td>
                          <td>{student.mother_name || "-"}</td>
                          <td>{student.mother_father_name || "-"}</td>
                          <td>{student.birth_date || "-"}</td>
                          <td>{student.register_no}</td>
                          <td>{student.page_no}</td>

                          <td>
                            <div className="inline-row-actions">
                              {student.can_edit === 1 ? (
                                <button
                                  type="button"
                                  className="edit-button"
                                  onClick={() =>
                                    startEdit(student)
                                  }
                                >
                                  تعديل
                                </button>
                              ) : (
                                <span className="inline-locked">
                                  مقفل
                                </span>
                              )}

                              {currentUser?.role === "ADMIN" && (
                                <button
                                  type="button"
                                  className="delete-button"
                                  onClick={() =>
                                    handleDelete(student)
                                  }
                                >
                                  حذف
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      </section>

      <section className="mobile-students-view">
        <form
          className="mobile-add-card"
          onSubmit={handleAddStudent}
        >
          <div className="mobile-card-title">
            إضافة طالب جديد
          </div>

          <div className="mobile-form-grid">
            <label>
              اسم الطالب *
              <input
                type="text"
                value={newStudent.studentName}
                onChange={(e) =>
                  updateNewStudent(
                    "studentName",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              اسم الأب *
              <input
                type="text"
                value={newStudent.fatherName}
                onChange={(e) =>
                  updateNewStudent(
                    "fatherName",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              اسم الجد
              <input
                type="text"
                value={newStudent.grandfatherName}
                onChange={(e) =>
                  updateNewStudent(
                    "grandfatherName",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              اسم أب الجد
              <input
                type="text"
                value={newStudent.greatGrandfatherName}
                onChange={(e) =>
                  updateNewStudent(
                    "greatGrandfatherName",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              اسم الأم
              <input
                type="text"
                value={newStudent.motherName}
                onChange={(e) =>
                  updateNewStudent(
                    "motherName",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              اسم أب الأم
              <input
                type="text"
                value={newStudent.motherFatherName}
                onChange={(e) =>
                  updateNewStudent(
                    "motherFatherName",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              المواليد
              <input
                type="date"
                value={newStudent.birthDate}
                onChange={(e) =>
                  updateNewStudent(
                    "birthDate",
                    e.target.value
                  )
                }
              />
            </label>

            <div className="mobile-register-row">
              <label>
                السجل *
                <input
                  type="text"
                  inputMode="numeric"
                  value={newStudent.registerNo}
                  onChange={(e) =>
                    updateNewStudent(
                      "registerNo",
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                الصفحة *
                <input
                  type="text"
                  inputMode="numeric"
                  value={newStudent.pageNo}
                  onChange={(e) =>
                    updateNewStudent(
                      "pageNo",
                      e.target.value
                    )
                  }
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="mobile-add-button"
            disabled={saving}
          >
            {saving
              ? "جاري الإضافة..."
              : "إضافة الطالب"}
          </button>
        </form>

        <div className="mobile-students-list">
          {loading ? (
            <div className="mobile-empty">
              جاري تحميل السجلات...
            </div>
          ) : students.length === 0 ? (
            <div className="mobile-empty">
              لا توجد سجلات
            </div>
          ) : (
            students.map((student, index) => {
              const isEditing =
                editingId === student.id;

              if (isEditing) {
                return (
                  <div
                    key={student.id}
                    className="mobile-student-card mobile-edit-card"
                  >
                    <div className="mobile-card-number">
                      الطالب رقم {index + 1}
                    </div>

                    <div className="mobile-form-grid">
                      <label>
                        اسم الطالب
                        <input
                          value={editForm.studentName}
                          onChange={(e) =>
                            updateEditForm(
                              "studentName",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        اسم الأب
                        <input
                          value={editForm.fatherName}
                          onChange={(e) =>
                            updateEditForm(
                              "fatherName",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        اسم الجد
                        <input
                          value={editForm.grandfatherName}
                          onChange={(e) =>
                            updateEditForm(
                              "grandfatherName",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        اسم أب الجد
                        <input
                          value={editForm.greatGrandfatherName}
                          onChange={(e) =>
                            updateEditForm(
                              "greatGrandfatherName",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        اسم الأم
                        <input
                          value={editForm.motherName}
                          onChange={(e) =>
                            updateEditForm(
                              "motherName",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        اسم أب الأم
                        <input
                          value={editForm.motherFatherName}
                          onChange={(e) =>
                            updateEditForm(
                              "motherFatherName",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        المواليد
                        <input
                          type="date"
                          value={editForm.birthDate}
                          onChange={(e) =>
                            updateEditForm(
                              "birthDate",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <div className="mobile-register-row">
                        <label>
                          السجل
                          <input
                            value={editForm.registerNo}
                            onChange={(e) =>
                              updateEditForm(
                                "registerNo",
                                e.target.value
                              )
                            }
                          />
                        </label>

                        <label>
                          الصفحة
                          <input
                            value={editForm.pageNo}
                            onChange={(e) =>
                              updateEditForm(
                                "pageNo",
                                e.target.value
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mobile-edit-actions">
                      <button
                        type="button"
                        className="mobile-save-button"
                        onClick={() =>
                          saveEdit(student.id)
                        }
                      >
                        حفظ
                      </button>

                      <button
                        type="button"
                        className="mobile-cancel-button"
                        onClick={cancelEdit}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <article
                  key={student.id}
                  className="mobile-student-card"
                >
                  <div className="mobile-student-header">
                    <div>
                      <div className="mobile-student-index">
                        #{index + 1}
                      </div>

                      <h3>
                        {getFullName(student)}
                      </h3>
                    </div>

                    <div className="mobile-record-badge">
                      {getStudentRecord(student)}
                    </div>
                  </div>

                  <div className="mobile-student-details">
                    <div>
                      <span>اسم الأم</span>
                      <strong>
                        {getMotherFullName(student) || "-"}
                      </strong>
                    </div>

                    <div>
                      <span>المواليد</span>
                      <strong>
                        {student.birth_date || "-"}
                      </strong>
                    </div>

                    <div>
                      <span>السجل</span>
                      <strong>{student.register_no}</strong>
                    </div>

                    <div>
                      <span>الصفحة</span>
                      <strong>{student.page_no}</strong>
                    </div>
                  </div>

                  <div className="mobile-student-actions">
                    {student.can_edit === 1 ? (
                      <button
                        type="button"
                        className="mobile-edit-button"
                        onClick={() =>
                          startEdit(student)
                        }
                      >
                        تعديل
                      </button>
                    ) : (
                      <div className="mobile-locked">
                        التعديل مقفل
                      </div>
                    )}

                    {currentUser?.role === "ADMIN" && (
                      <button
                        type="button"
                        className="mobile-delete-button"
                        onClick={() =>
                          handleDelete(student)
                        }
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {deleteTarget && (
        <div
          className="students-dialog-backdrop"
          onMouseDown={cancelDelete}
        >
          <div
            className="students-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="students-confirm-icon">
              !
            </div>

            <div className="students-confirm-body">
              <h2 id="delete-dialog-title">
                حذف الطالب نهائيًا؟
              </h2>

              <p id="delete-dialog-description">
                سيتم حذف سجل الطالب نهائيًا ولا يمكن
                استعادته بعد تنفيذ العملية.
              </p>

              <div className="students-confirm-student">
                <span>الطالب</span>
                <strong>
                  {getFullName(deleteTarget)}
                </strong>

                <small>
                  السجل {deleteTarget.register_no}
                  {" / "}
                  الصفحة {deleteTarget.page_no}
                </small>
              </div>
            </div>

            <div className="students-confirm-actions">
              <button
                type="button"
                className="students-confirm-cancel"
                onClick={cancelDelete}
                disabled={deleting}
              >
                إلغاء
              </button>

              <button
                type="button"
                className="students-confirm-delete"
                onClick={confirmDelete}
                disabled={deleting}
                autoFocus
              >
                {deleting
                  ? "جاري الحذف..."
                  : "نعم، حذف نهائي"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
