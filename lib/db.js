import mysql from "mysql2/promise";
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 8,
  decimalNumbers: true,
  timezone: "Z",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
});
export async function query(sql, args = []) {
  const [rows] = await pool.execute(sql, args);
  return rows;
}
