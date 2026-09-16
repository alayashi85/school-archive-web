import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../api/api";

import "./UsersPage.css";

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

  const [
    actionDialog,
    setActionDialog,
  ] = useState<{
    type: "toggle" | "role";
    user: UserItem;
    newActive?: boolean;
    newRole?: UserRole;
  } | null>(null);

  const [
    passwordDialogUser,
    setPasswordDialogUser,
  ] = useState<UserItem | null>(null);

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    actionSaving,
    setActionSaving,
  ] = useState(false);

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

  useEffect(() => {
    if (
      !actionDialog &&
      !passwordDialogUser
    ) {
      return;
    }

    function handleEscape(
      event: globalThis.KeyboardEvent
    ) {
      if (
        event.key === "Escape" &&
        !actionSaving
      ) {
        setActionDialog(null);
        setPasswordDialogUser(null);
        setNewPassword("");
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleEscape
      );
  }, [
    actionDialog,
    passwordDialogUser,
    actionSaving,
  ]);

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

  function handleToggleUser(
    user: UserItem
  ) {
    const newActive =
      user.is_active !== 1;

    setError("");
    setSuccess("");

    setActionDialog({
      type: "toggle",
      user,
      newActive,
    });
  }

  function handleChangeRole(
    user: UserItem
  ) {
    const newRole: UserRole =
      user.role === "ADMIN"
        ? "USER"
        : "ADMIN";

    setError("");
    setSuccess("");

    setActionDialog({
      type: "role",
      user,
      newRole,
    });
  }

  async function confirmUserAction() {
    if (!actionDialog) {
      return;
    }

    const {
      type,
      user,
      newActive,
      newRole,
    } = actionDialog;

    setActionSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/api/users/${user.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            fullName:
              user.full_name,

            role:
              type === "role"
                ? newRole
                : user.role,

            isActive:
              type === "toggle"
                ? newActive
                : user.is_active === 1,
          }),
        }
      );

      if (type === "toggle") {
        setSuccess(
          newActive
            ? "تم تفعيل المستخدم"
            : "تم تعطيل المستخدم"
        );
      } else {
        setSuccess(
          "تم تغيير صلاحية المستخدم"
        );
      }

      setActionDialog(null);

      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : type === "toggle"
            ? "حدث خطأ أثناء تحديث المستخدم"
            : "حدث خطأ أثناء تغيير الصلاحية"
      );
    } finally {
      setActionSaving(false);
    }
  }

  function handleResetPassword(
    user: UserItem
  ) {
    setError("");
    setSuccess("");
    setNewPassword("");
    setPasswordDialogUser(user);
  }

  async function confirmResetPassword() {
    if (!passwordDialogUser) {
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
      );

      return;
    }

    setActionSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/api/users/${passwordDialogUser.id}/password`,
        {
          method: "PUT",
          body: JSON.stringify({
            password: newPassword,
          }),
        }
      );

      setSuccess(
        "تم تغيير كلمة المرور بنجاح"
      );

      setPasswordDialogUser(null);
      setNewPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تغيير كلمة المرور"
      );
    } finally {
      setActionSaving(false);
    }
  }

  function closeDialogs() {
    if (actionSaving) {
      return;
    }

    setActionDialog(null);
    setPasswordDialogUser(null);
    setNewPassword("");
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

      {(error || success) && (
        <div
          className="users-toast-stack"
          aria-live="polite"
          aria-atomic="true"
        >
          {error && (
            <div
              className="users-toast users-toast-error"
              role="alert"
            >
              <div className="users-toast-icon">
                !
              </div>

              <div className="users-toast-content">
                <strong>
                  تعذر إكمال العملية
                </strong>
                <span>{error}</span>
              </div>

              <button
                type="button"
                className="users-toast-close"
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
              className="users-toast users-toast-success"
              role="status"
            >
              <div className="users-toast-icon">
                ✓
              </div>

              <div className="users-toast-content">
                <strong>
                  تمت العملية بنجاح
                </strong>
                <span>{success}</span>
              </div>

              <button
                type="button"
                className="users-toast-close"
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

      {actionDialog && (
        <div
          className="users-dialog-backdrop"
          onMouseDown={closeDialogs}
        >
          <div
            className="users-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-action-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="users-confirm-icon">
              !
            </div>

            <div className="users-confirm-body">
              <h2 id="user-action-title">
                {actionDialog.type === "toggle"
                  ? actionDialog.newActive
                    ? "تفعيل المستخدم؟"
                    : "تعطيل المستخدم؟"
                  : "تغيير صلاحية المستخدم؟"}
              </h2>

              <p>
                {actionDialog.type === "toggle"
                  ? actionDialog.newActive
                    ? "سيتم السماح للمستخدم بتسجيل الدخول واستخدام النظام."
                    : "سيتم منع المستخدم من تسجيل الدخول إلى النظام."
                  : `سيتم تغيير الصلاحية إلى ${
                      actionDialog.newRole === "ADMIN"
                        ? "مدير"
                        : "مستخدم"
                    }.`}
              </p>

              <div className="users-confirm-user">
                <span>المستخدم</span>
                <strong>
                  {actionDialog.user.full_name}
                </strong>
                <small>
                  {actionDialog.user.username}
                </small>
              </div>
            </div>

            <div className="users-confirm-actions">
              <button
                type="button"
                className="users-confirm-cancel"
                onClick={closeDialogs}
                disabled={actionSaving}
              >
                إلغاء
              </button>

              <button
                type="button"
                className={
                  actionDialog.type === "toggle" &&
                  actionDialog.newActive === false
                    ? "users-confirm-danger"
                    : "users-confirm-primary"
                }
                onClick={confirmUserAction}
                disabled={actionSaving}
                autoFocus
              >
                {actionSaving
                  ? "جاري التنفيذ..."
                  : "تأكيد"}
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordDialogUser && (
        <div
          className="users-dialog-backdrop"
          onMouseDown={closeDialogs}
        >
          <div
            className="users-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-dialog-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="users-password-icon">
              •••
            </div>

            <div className="users-confirm-body">
              <h2 id="password-dialog-title">
                تغيير كلمة المرور
              </h2>

              <p>
                أدخل كلمة مرور جديدة للمستخدم
                التالي. يجب أن تتكون من 8 أحرف
                على الأقل.
              </p>

              <div className="users-confirm-user">
                <span>المستخدم</span>
                <strong>
                  {passwordDialogUser.full_name}
                </strong>
                <small>
                  {passwordDialogUser.username}
                </small>
              </div>

              <label className="users-password-field">
                كلمة المرور الجديدة
                <input
                  type="password"
                  value={newPassword}
                  minLength={8}
                  autoComplete="new-password"
                  autoFocus
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      event.preventDefault();
                      confirmResetPassword();
                    }
                  }}
                />
              </label>
            </div>

            <div className="users-confirm-actions">
              <button
                type="button"
                className="users-confirm-cancel"
                onClick={closeDialogs}
                disabled={actionSaving}
              >
                إلغاء
              </button>

              <button
                type="button"
                className="users-confirm-primary"
                onClick={
                  confirmResetPassword
                }
                disabled={actionSaving}
              >
                {actionSaving
                  ? "جاري الحفظ..."
                  : "حفظ كلمة المرور"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
