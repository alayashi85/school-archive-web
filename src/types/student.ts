export interface Student {
  id: number;

  student_name: string;
  father_name: string;
  grandfather_name: string | null;
  great_grandfather_name: string | null;

  mother_name: string | null;
  mother_father_name: string | null;

  birth_date: string | null;

  register_no: string;
  page_no: string;

  created_at: string;
  updated_at: string | null;

  created_by: number;
  created_by_name: string | null;

  can_edit: number;
  edit_deadline: string;
}

export interface StudentsResponse {
  ok: boolean;
  page: number;
  pageSize: number;
  students: Student[];
}

export interface StudentResponse {
  ok: boolean;
  student: Student;
}

export interface StudentSaveResponse {
  ok: boolean;
  message: string;
  studentId?: number;
}