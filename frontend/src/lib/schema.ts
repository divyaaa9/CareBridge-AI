import { z } from 'zod'
// These schemas mirror the Pydantic models on the FastAPI side. API responses are parsed with them.
export const MedSchema = z.object({ n: z.string(), s: z.string(), f: z.string(), fd: z.string(), dur: z.number() })
export const ExtractionSchema = z.object({
  name: z.string(), dd: z.string(), hosp: z.string(), city: z.string(), dept: z.string(),
  meds: z.array(MedSchema), diet: z.string(), act: z.string(), fu: z.string(), warn: z.string(),
})
export const UploadResultSchema = z.object({ documentId: z.string(), blurry: z.boolean().default(false), extraction: ExtractionSchema.optional(), confidence: z.record(z.number()).optional() })
export const PlanResultSchema = z.object({ version: z.number(), planId: z.string().optional() })
export const AskResultSchema = z.object({ answer: z.string(), line: z.number().nullable() })
export const TranslateSchema = z.object({ translations: z.record(z.string()) })
export const AuthSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').optional(),
  email: z.string().trim().regex(/^\S+@\S+\.\S+$/, 'Enter a valid email address.'),
  password: z.string().min(6, 'Use at least 6 characters.'),
})
