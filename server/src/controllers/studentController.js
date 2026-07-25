import { ACCESS_ROLES } from '../constants/roles.js';
import * as studentService from '../services/studentService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  addStudentNoteSchema,
  assignStudentSchema,
  listQuerySchema,
  parseOrThrow,
  registerStudentSchema,
} from '../validators/accessValidators.js';

export const listStudents = asyncHandler(async (req, res) => {
  const query = parseOrThrow(listQuerySchema, req.query, ApiError);
  const result = await studentService.listStudents(req.accessUser, query);
  res.json(result);
});

export const listUnassignedStudents = asyncHandler(async (req, res) => {
  if (req.accessUser.accessRole === ACCESS_ROLES.COUNSELOR) {
    throw new ApiError(403, 'Counselors cannot view unassigned students');
  }
  const query = parseOrThrow(listQuerySchema, req.query, ApiError);
  const result = await studentService.listUnassignedStudents(req.accessUser, query);
  res.json(result);
});

export const getStudent = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.accessUser, req.params.id);
  res.json({ student });
});

export const registerStudent = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(registerStudentSchema, req.body, ApiError);
  const student = await studentService.registerStudent(payload);
  res.status(201).json({ student });
});

export const validateReferral = asyncHandler(async (req, res) => {
  const result = await studentService.validateReferralCode(req.query.code);
  res.json(result);
});

export const lookupStudentByEmail = asyncHandler(async (req, res) => {
  const email = String(req.query.email || '').trim();
  if (!email) throw new ApiError(400, 'email is required');
  const result = await studentService.getStudentByEmail(email);
  if (!result) {
    return res.json({
      assignmentStatus: 'not-registered',
      student: null,
      counselor: null,
    });
  }
  res.json(result);
});

export const assignStudent = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(assignStudentSchema, req.body, ApiError);
  const student = await studentService.assignStudent(
    req.accessUser,
    req.params.id,
    payload.counselorId
  );
  res.json({ student });
});

export const addStudentNote = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(addStudentNoteSchema, req.body, ApiError);
  const student = await studentService.addStudentNote(
    req.accessUser,
    req.params.id,
    payload.text
  );
  res.json({ student });
});
