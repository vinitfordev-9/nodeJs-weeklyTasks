import {
  randomBytes,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "../config/database.js";
import { AppError, RESPONSES } from "../common/responses.js";
const scrypt = promisify(scryptCallback);
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  companyName: true,
};
export const tokenHash = (token) =>
  createHash("sha256").update(token).digest("hex");
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await scrypt(password, salt, 64)).toString("hex")}`;
}
async function verifyPassword(password, hash) {
  const [salt, key] = hash.split(":");
  return timingSafeEqual(
    Buffer.from(key, "hex"),
    await scrypt(password, salt, 64),
  );
}
const dummyHash = await hashPassword("unused-timing-placeholder");
async function startSession(user) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { tokenHash: tokenHash(token), userId: user.id, expiresAt },
  });
  return { user, token, expiresAt };
}
export async function register(input) {
  const { password, ...profile } = input;
  try {
    const user = await prisma.user.create({
      data: { ...profile, passwordHash: await hashPassword(password) },
      select: publicUserSelect,
    });
    return startSession(user);
  } catch (error) {
    if (error.code === "P2002") throw new AppError(RESPONSES.EMAIL_EXISTS);
    throw error;
  }
}
export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash || dummyHash);
  if (!user || !valid) throw new AppError(RESPONSES.CREDENTIALS);
  return startSession(
    Object.fromEntries(
      Object.keys(publicUserSelect).map((key) => [key, user[key]]),
    ),
  );
}
export async function logout(sessionId) {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}
