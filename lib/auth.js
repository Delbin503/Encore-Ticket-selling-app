import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { query } from "./db.js";
import { can } from "./rbac.js";
export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
function secret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error("Set a JWT_SECRET of at least 32 characters");
  return new TextEncoder().encode(process.env.JWT_SECRET);
}
export async function signToken(user) {
  return new SignJWT({ id: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret());
}
export async function currentUser() {
  const token = (await cookies()).get("encore_session")?.value;
  if (!token) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] }));
  } catch {
    return null;
  }
  const rows = await query(
    "SELECT id,fullname,email,role,status,seller_application FROM users WHERE id=?",
    [payload.id],
  );
  return rows[0]?.status === "active" ? rows[0] : null;
}
export async function requireUser(permission) {
  const u = await currentUser();
  if (!u) throw new AppError("Please sign in to continue.", 401);
  if (permission && !can(u.role, permission))
    throw new AppError("Your role cannot perform this action.", 403);
  return u;
}
export function text(value, name, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new AppError(`${name} is required (maximum ${max} characters).`);
  return value.trim();
}
export function id(value) {
  if (!["number", "string"].includes(typeof value))
    throw new AppError("Enter a valid number.");
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1)
    throw new AppError("Invalid identifier.");
  return n;
}
export function amount(value) {
  if (value === "" || value === null || value === undefined)
    throw new AppError("Enter a price.");
  if (!["number", "string"].includes(typeof value))
    throw new AppError("Enter a valid number.");
  const n = Number(value);
  if (
    !Number.isFinite(n) ||
    n <= 0 ||
    n > 100000 ||
    Math.abs(Math.round(n * 100) - n * 100) > 0.000001
  )
    throw new AppError(
      "Enter a valid price, up to ฿100,000 with at most two decimals.",
    );
  return n;
}
