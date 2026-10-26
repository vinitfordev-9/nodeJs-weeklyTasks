import { z } from 'zod';
const cursor = z.string().regex(/^[1-9]\d{0,18}$/).refine(value => BigInt(value) <= 9223372036854775807n, 'Cursor is too large.');
export const historySchema = z.strictObject({ before: cursor.optional(), after: cursor.optional(), limit: z.coerce.number().int().min(1).max(50).default(30) }).refine(value => !(value.before && value.after), 'Use either before or after, not both.');
export const messageSchema = z.strictObject({ content: z.string().trim().min(1, 'Write a message before sending.').max(4000), clientMessageId: z.uuid() });
export const readSchema = z.strictObject({ messageIds: z.array(z.uuid()).min(1).max(50).transform(value => [...new Set(value)]) });
export const roomEventSchema = z.strictObject({ roomId: z.uuid() });
export const sendEventSchema = messageSchema.extend({ roomId: z.uuid() });
export const readEventSchema = readSchema.extend({ roomId: z.uuid() });
export const typingSchema = roomEventSchema.extend({ typing: z.boolean() });
