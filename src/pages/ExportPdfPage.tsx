import {
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { apiRequest } from "../api/api";

import type {
  Student,
  StudentsResponse,
} from "../types/student";

import "./ExportPdfPage.css";

type SortBy =
  | "pageNo"
  | "fullName"
  | "registerNo";

type SortDirection =
  | "asc"
  | "desc";

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
  const motherFullName = [
    student.mother_name,
    student.mother_father_name,
  ]
    .filter(Boolean)
    .join(" ");

  return motherFullName || "-";
}

function getBirthDate(
  student: Student
) {
  if (!student.birth_date) {
    return "-";
  }

  return student.birth_date.replace(
    /-/g,
    "/"
  );
}

function getRecordReference(
  student: Student
) {
  return `${student.register_no}\\${student.page_no}`;
}

function compareText(
  a: string,
  b: string
) {
  return a.localeCompare(
    b,
    "ar",
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

function compareNumericText(
  a: string,
  b: string
) {
  const aTrimmed =
    String(a ?? "").trim();

  const bTrimmed =
    String(b ?? "").trim();

  const aNumber =
    Number(aTrimmed);

  const bNumber =
    Number(bTrimmed);

  const aIsNumber =
    aTrimmed !== "" &&
    Number.isFinite(aNumber);

  const bIsNumber =
    bTrimmed !== "" &&
    Number.isFinite(bNumber);

  if (
    aIsNumber &&
    bIsNumber
  ) {
    return aNumber - bNumber;
  }

  if (aIsNumber) {
    return -1;
  }

  if (bIsNumber) {
    return 1;
  }

  return compareText(
    aTrimmed,
    bTrimmed
  );
}

export default function ExportPdfPage() {
  const navigate =
    useNavigate();

  const [registerNo, setRegisterNo] =
    useState("");

  const [sortBy, setSortBy] =
    useState<SortBy>(
      "pageNo"
    );

  const [
    sortDirection,
    setSortDirection,
  ] =
    useState<SortDirection>(
      "asc"
    );

  const [students, setStudents] =
    useState<Student[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const [error, setError] =
    useState("");

  const sortedStudents =
    useMemo(() => {
      const result =
        [...students];

      result.sort(
        (
          first,
          second
        ) => {
          let value = 0;

          if (
            sortBy ===
            "pageNo"
          ) {
            value =
              compareNumericText(
                first.page_no,
                second.page_no
              );
          }

          if (
            sortBy ===
            "registerNo"
          ) {
            value =
              compareNumericText(
                first.register_no,
                second.register_no
              );

            if (value === 0) {
              value =
                compareNumericText(
                  first.page_no,
                  second.page_no
                );
            }
          }

          if (
            sortBy ===
            "fullName"
          ) {
            value =
              compareText(
                getFullName(first),
                getFullName(second)
              );
          }

          return sortDirection ===
            "asc"
            ? value
            : -value;
        }
      );

      return result;
    }, [
      students,
      sortBy,
      sortDirection,
    ]);

  async function loadAllStudents() {
    setLoading(true);
    setLoaded(false);
    setError("");

    try {
      const allStudents:
        Student[] = [];

      const pageSize = 100;

      let page = 1;

      while (true) {
        const params =
          new URLSearchParams();

        params.set(
          "page",
          String(page)
        );

        params.set(
          "pageSize",
          String(pageSize)
        );

        if (
          registerNo.trim()
        ) {
          params.set(
            "registerNo",
            registerNo.trim()
          );
        }

        const result =
          await apiRequest<StudentsResponse>(
            `/api/students?${params.toString()}`
          );

        allStudents.push(
          ...result.students
        );

        if (
          result.students.length <
          pageSize
        ) {
          break;
        }

        page += 1;

        if (page > 1000) {
          throw new Error(
            "تم تجاوز الحد المتوقع لعدد صفحات البيانات"
          );
        }
      }

      setStudents(
        allStudents
      );

      setLoaded(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تجهيز التقرير"
      );
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  const reportTitle =
    registerNo.trim()
      ? `فهرس سجل الطلاب - السجل ${registerNo.trim()}`
      : "فهرس سجلات الطلاب";

  return (
    <div
      className="export-page"
      dir="rtl"
    >
      <div className="export-controls no-print">
        <div className="export-controls-header">
          <div>
            <h1>
              تصدير PDF
            </h1>

            <p>
              إعداد فهرس
              السجلات الورقية
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
        </div>

        <div className="export-options">
          <label>
            رقم السجل

            <input
              type="text"
              value={
                registerNo
              }
              onChange={(e) =>
                setRegisterNo(
                  e.target.value
                )
              }
              placeholder="مثال: 1"
            />

            <small>
              اتركه فارغًا
              لتصدير جميع
              السجلات
            </small>
          </label>

          <label>
            الفرز حسب

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target
                    .value as SortBy
                )
              }
            >
              <option value="pageNo">
                رقم الصفحة
              </option>

              <option value="fullName">
                الاسم الرباعي
              </option>

              <option value="registerNo">
                رقم السجل
              </option>
            </select>
          </label>

          <label>
            اتجاه الفرز

            <select
              value={
                sortDirection
              }
              onChange={(e) =>
                setSortDirection(
                  e.target
                    .value as SortDirection
                )
              }
            >
              <option value="asc">
                تصاعدي
              </option>

              <option value="desc">
                تنازلي
              </option>
            </select>
          </label>
        </div>

        <div className="export-actions">
          <button
            type="button"
            className="primary-button"
            onClick={
              loadAllStudents
            }
            disabled={loading}
          >
            {loading
              ? "جاري تجهيز التقرير..."
              : "معاينة التقرير"}
          </button>

          {loaded &&
            sortedStudents.length >
              0 && (
              <button
                type="button"
                className="secondary-button"
                onClick={
                  handlePrint
                }
              >
                طباعة / حفظ PDF
              </button>
            )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      {loaded && (
        <div className="report-sheet">
          <div className="report-header">
            <div className="report-country">
              جمهورية العراق
            </div>

            <div className="report-ministry">
              وزارة التربية
            </div>

            <div className="report-school">
              إعدادية الإمام الحسين
              (عليه السلام) للبنين
            </div>

            <h2>
              {reportTitle}
            </h2>

            <div className="report-meta">
              <span>
                عدد الطلاب:{" "}
                <strong>
                  {
                    sortedStudents.length
                  }
                </strong>
              </span>

              {registerNo.trim() && (
                <span>
                  رقم السجل:{" "}
                  <strong>
                    {
                      registerNo
                    }
                  </strong>
                </span>
              )}
            </div>
          </div>

          {sortedStudents.length ===
          0 ? (
            <div className="report-empty">
              لا توجد سجلات
              مطابقة
            </div>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th className="col-index">
                    ت
                  </th>

                  <th className="col-name">
                    الاسم الرباعي
                  </th>

                  <th className="col-mother">
                    اسم الأم
                  </th>

                  <th className="col-birth">
                    المواليد
                  </th>

                  <th className="col-record">
                    القيد
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedStudents.map(
                  (
                    student,
                    index
                  ) => (
                    <tr
                      key={
                        student.id
                      }
                    >
                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {getFullName(
                          student
                        )}
                      </td>

                      <td>
                        {getMotherFullName(
                          student
                        )}
                      </td>

                      <td>
                        {getBirthDate(
                          student
                        )}
                      </td>

                      <td className="record-reference">
                        {getRecordReference(
                          student
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}