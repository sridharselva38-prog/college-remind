import { z } from "zod";

export const studentSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().trim().min(2).max(120),
  register_number: z.string().trim().min(1).max(40),
  department: z.string().trim().max(80).optional().or(z.literal("")),
  course: z.string().trim().max(80).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1).max(6).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  section: z.string().trim().max(10).optional().or(z.literal("")),
  student_phone: z.string().trim().max(20).optional().or(z.literal("")),
  parent_phone: z.string().trim().max(20).optional().or(z.literal("")),
  student_email: z.string().trim().email().max(255).optional().or(z.literal("")),
  parent_email: z.string().trim().email().max(255).optional().or(z.literal("")),
  address: z.string().trim().max(400).optional().or(z.literal("")),
});
export type StudentInput = z.infer<typeof studentSchema>;

export const feeSchema = z.object({
  id: z.string().uuid().optional(),
  student_id: z.string().uuid(),
  academic_year: z.string().trim().max(20).optional().or(z.literal("")),
  term: z.string().trim().max(40).optional().or(z.literal("")),
  total_fee: z.coerce.number().min(0).max(10_000_000),
  paid_fee: z.coerce.number().min(0).max(10_000_000),
  scholarship: z.coerce.number().min(0).max(10_000_000).default(0),
  discount: z.coerce.number().min(0).max(10_000_000).default(0),
  late_fee: z.coerce.number().min(0).max(10_000_000).default(0),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a due date"),
  notes: z.string().trim().max(400).optional().or(z.literal("")),
});
export type FeeInput = z.infer<typeof feeSchema>;

export const collegeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  code: z.string().trim().min(2).max(20),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  whatsapp_number: z.string().trim().max(20).optional().or(z.literal("")),
  address: z.string().trim().max(400).optional().or(z.literal("")),
  support_contact: z.string().trim().max(120).optional().or(z.literal("")),
  payment_link: z.string().trim().url().max(400).optional().or(z.literal("")),
  reminder_language: z.enum(["english", "tamil", "both"]).default("both"),
});
export type CollegeInput = z.infer<typeof collegeSchema>;

export const assignRoleSchema = z.object({
  email: z.string().trim().email().max(255),
  role: z.enum(["super_admin", "college_admin", "student"]),
  college_id: z.string().uuid().optional().or(z.literal("")),
});

export const emailAuthSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

export const signupSchema = emailAuthSchema.extend({
  full_name: z.string().trim().min(2, "Enter your name").max(120),
});
