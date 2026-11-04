import { z } from 'zod';

export const emailField = z.string().trim().toLowerCase().email('Please enter a valid email address');

export const loginSchema = z.object({ email: emailField });

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your name').refine((v) => v.split(/\s+/).every((p) => p.length >= 2), 'Each name must be at least 2 characters'),
  email: emailField,
  terms: z.literal(true, { error: 'Please accept the Terms & Privacy Policy' }),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;

// "Haneen Hafez" → first: Haneen, last: Hafez (backend requires ≥2 chars each when present)
export const splitName = (full: string) => {
  const [first, ...rest] = full.trim().split(/\s+/);
  return { firstName: first, lastName: rest.join(' ') || undefined };
};
