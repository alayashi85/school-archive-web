import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../api/api";

type UserRole = "ADMIN" | "USER";

interface UserItem {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: number;
  created_at: string;
}

interface UsersResponse {
  ok: boolean;
  users: UserItem[];
}

interface CreateUserResponse {
  ok: boolean;
  message: string;
}

export default function UsersPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("USER");

  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : null;

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const result =
        await apiRequest<UsersResponse>(
          "/api/users"
        );

      setUsers(result.users);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل المستخدمين"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser?.role !== "ADMIN") {
      navigate("/students", {
        replace: true,
      });

      return;
    }

    loadUsers();
  }, []);

  async function handleCreateUser(
    event: FormEvent
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest<CreateUserResponse>(
        "/api/users",
        {
          method: "POST",
          body: JSON.stringify({
            fullName,
            username,
            password,
            role,
          }),
        }
      );

      setFullName("");
      setUsername("");
      setPassword("");
      setRole("USER");

      setSuccess(
        "تم إنشاء المستخدم بنجاح"
      );

      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء إنشاء المستخدم"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleUser(
    user: UserItem
  ) {
    const newActive =
      user.is_active === 1
        ? false
        : true;

    const confirmed =
      window.confirm(
        newActive
          ? `هل تريد تفعيل المستخدم ${user.username}؟`
          : `هل تريد تعطيل المستخدم ${user.username}؟`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await apiRequest(
        `/api/users/${user.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            fullName:
              user.full_name,

            role:
              user.role,

            isActive:
              newActive,
          }),
        }
      );

      setSuccess(
        newActive
          ? "تم تفعيل المستخدم"
          : "تم تعطيل المستخدم"
      );

      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحديث المستخدم"
      );
    }
  }

  async function handleChangeRole(
    user: UserItem
  ) {
    const newRole: UserRole =
      user.role === "ADMIN"
        ? "USER"
        : "ADMIN";

    const confirmed =
      window.confirm(
        `هل تريد تغيير صلاحية ${user.username} إلى ${
          newRole === "ADMIN"
            ? "مدير"
            : "مستخدم"
        }؟`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await apiRequest(
        `/api/users/${user.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            fullName:
              user.full_name,

            role:
              newRole,

            isActive:
              user.is_active === 1,
          }),
        }
      );

      setSuccess(
        "تم تغيير صلاحية المستخدم"
      );

      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تغيير الصلاحية"
      );
    }
  }

  async function handleResetPassword(
    user: UserItem
  ) {
    const newPassword =
      window.prompt(
        `أدخل كلمة المرور الجديدة للمستخدم ${user.username}`
      );

    if (!newPassword) {
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
      );

      return;
    }

    try {
      setError("");
      setSuccess("");

      await apiRequest(
        `/api/users/${user.id}/password`,
        {
          method: "PUT",
          body: JSON.stringify({
            password:
              newPassword,
          }),
        }
      );

      setSuccess(
        "تم تغيير كلمة المرور بنجاح"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تغيير كلمة المرور"
      );
    }
  }

  return (
    <div
      className="users-page"
      dir="rtl"
    >
      <header className="users-header">
        <div>
          <h1>إدارة المستخدمين</h1>

          <p>
            إضافة وإدارة مستخدمي النظام
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate("/students")
          }
        >
          رجوع إلى الطلاب
        </button>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <section className="user-create-card">
        <h2>إضافة مستخدم جديد</h2>

        <form
          className="user-create-form"
          onSubmit={handleCreateUser}
        >
          <div className="form-grid">
            <label>
              الاسم الكامل *
              <input
                required
                value={fullName}
                onChange={(e) =>
                  setFullName(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              اسم المستخدم *
              <input
                required
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              كلمة المرور *
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              الصلاحية
              <select
                value={role}
                onChange={(e) =>
                  setRole(
                    e.target.value as UserRole
                  )
                }
              >
                <option value="USER">
                  مستخدم
                </option>

                <option value="ADMIN">
                  مدير
                </option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "جاري الحفظ..."
                : "حفظ المستخدم"}
            </button>
          </div>
        </form>
      </section>

      <section className="users-card">
        <h2>المستخدمون</h2>

        {loading ? (
          <div className="empty-state">
            جاري تحميل المستخدمين...
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            لا يوجد مستخدمون
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ت</th>
                  <th>الاسم الكامل</th>
                  <th>اسم المستخدم</th>
                  <th>الصلاحية</th>
                  <th>الحالة</th>
                  <th>تاريخ الإنشاء</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {users.map(
                  (user, index) => (
                    <tr key={user.id}>
                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {user.full_name}
                      </td>

                      <td>
                        {user.username}
                      </td>

                      <td>
                        <span
                          className={
                            user.role ===
                            "ADMIN"
                              ? "role-badge admin-role"
                              : "role-badge user-role"
                          }
                        >
                          {user.role ===
                          "ADMIN"
                            ? "مدير"
                            : "مستخدم"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            user.is_active ===
                            1
                              ? "status-badge active-status"
                              : "status-badge inactive-status"
                          }
                        >
                          {user.is_active ===
                          1
                            ? "فعال"
                            : "معطل"}
                        </span>
                      </td>

                      <td>
                        {user.created_at}
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="small-button"
                            onClick={() =>
                              handleResetPassword(
                                user
                              )
                            }
                          >
                            تغيير كلمة المرور
                          </button>

                          <button
                            type="button"
                            className="small-button"
                            onClick={() =>
                              handleChangeRole(
                                user
                              )
                            }
                          >
                            تغيير الصلاحية
                          </button>

                          <button
                            type="button"
                            className={
                              user.is_active ===
                              1
                                ? "disable-button"
                                : "enable-button"
                            }
                            onClick={() =>
                              handleToggleUser(
                                user
                              )
                            }
                          >
                            {user.is_active ===
                            1
                              ? "تعطيل"
                              : "تفعيل"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
