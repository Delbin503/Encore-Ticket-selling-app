import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
const c = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
});
if (!/^\w+$/.test(process.env.DB_DATABASE))
  throw new Error("Invalid database name");
await c.query(
  `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_DATABASE}\`; USE \`${process.env.DB_DATABASE}\`;`,
);
await c.query(
  readFileSync(new URL("../sql/schema.sql", import.meta.url), "utf8"),
);
const hash = await bcrypt.hash("Encore2026!", 10);
const users = [
  ["Maya Chen", "buyer@encore.test", "buyer", "none"],
  ["Jamie Park", "seller@encore.test", "seller", "approved"],
  ["Alex Morgan", "admin@encore.test", "admin", "none"],
  ["Nina Win", "pending@encore.test", "buyer", "pending"],
  ["Leo Tan", "other-seller@encore.test", "seller", "approved"],
];
for (const [name, email, role, application] of users)
  await c.execute(
    "INSERT IGNORE INTO users(fullname,email,password,role,seller_application) VALUES(?,?,?,?,?)",
    [name, email, hash, role, application],
  );
const events = [
  [
    "LENA RAY",
    "Night Bloom Tour",
    "Pop",
    "IMPACT Arena",
    "Bangkok",
    "2027-02-20 12:00:00",
    "/images/lena-ray.png",
    "#f5b5cb",
    3500,
  ],
  [
    "THE MONDAY KIDS",
    "A little louder, a little longer",
    "Indie",
    "Thunder Dome",
    "Bangkok",
    "2027-03-06 11:30:00",
    "/images/monday-kids.png",
    "#b9d9ed",
    2800,
  ],
  [
    "RIVER ATLAS",
    "The Afterhours Tour",
    "Rock",
    "BITEC Live",
    "Bangkok",
    "2027-03-20 12:00:00",
    "/images/river-atlas.png",
    "#ffc08d",
    3200,
  ],
  [
    "MIRA SOL",
    "Cloudline Sessions",
    "R&B",
    "UOB LIVE",
    "Bangkok",
    "2027-04-10 12:00:00",
    "/images/mira-sol.png",
    "#dfccff",
    3000,
  ],
  [
    "NEON SOCIAL",
    "Dance until tomorrow",
    "EDM",
    "Sphere Hall",
    "Bangkok",
    "2027-04-17 13:00:00",
    "/images/neon-social.png",
    "#c7ed9d",
    2400,
  ],
  [
    "SUNDAY THEORY",
    "Soft Landing",
    "Indie",
    "Lido Connect",
    "Bangkok",
    "2027-05-01 11:00:00",
    "/images/sunday-theory.png",
    "#f1b8b1",
    1800,
  ],
];
for (let i = 0; i < events.length; i++)
  await c.execute(
    "INSERT IGNORE INTO events(id,artist,title,genre,venue,city,event_date,image,color,price_cap) VALUES(?,?,?,?,?,?,?,?,?,?)",
    [i + 1, ...events[i]],
  );
// Refresh only artwork on existing demo concerts; preserve listings and transactions.
for (let i = 0; i < events.length; i++)
  await c.execute("UPDATE events SET image=? WHERE id=? AND artist=?", [
    events[i][6],
    i + 1,
    events[i][0],
  ]);
const [[seller]] = await c.execute("SELECT id FROM users WHERE email=?", [
  "seller@encore.test",
]);
const [[other]] = await c.execute("SELECT id FROM users WHERE email=?", [
  "other-seller@encore.test",
]);
const prices = [2800, 1900, 2400, 2200, 1600, 1200];
for (let i = 0; i < 6; i++) {
  await c.execute(
    "INSERT IGNORE INTO listings(id,event_id,seller_id,section,seat,price) VALUES(?,?,?,?,?,?)",
    [i * 2 + 1, i + 1, seller.id, "Zone A", `A${12 + i}`, prices[i]],
  );
  await c.execute(
    "INSERT IGNORE INTO listings(id,event_id,seller_id,section,seat,price) VALUES(?,?,?,?,?,?)",
    [i * 2 + 2, i + 1, other.id, "Zone B", `B${20 + i}`, prices[i] + 200],
  );
}
// Seed two simulated purchases so each role has a useful demonstration view.
const [[buyer]] = await c.execute("SELECT id FROM users WHERE email=?", [
  "buyer@encore.test",
]);
for (const [listingId, eventId, seat, price, orderId, handover, details] of [
  [101, 4, "C08", 2200, 101, "pending", null],
  [
    102,
    2,
    "A16",
    1900,
    102,
    "sent",
    "DEMO ONLY: Meet at the venue entrance 30 minutes before the show. No real ticket will be transferred.",
  ],
]) {
  await c.execute(
    "INSERT IGNORE INTO listings(id,event_id,seller_id,section,seat,price,status) VALUES(?,?,?,?,?,?, 'sold')",
    [listingId, eventId, seller.id, "Zone A", seat, price],
  );
  await c.execute(
    "INSERT IGNORE INTO orders(id,listing_id,buyer_id,price,handover_status,handover_details) VALUES(?,?,?,?,?,?)",
    [orderId, listingId, buyer.id, price, handover, details],
  );
}
await c.execute(
  "INSERT IGNORE INTO reports(id,order_id,buyer_id,reason) VALUES(101,101,?,?)",
  [
    buyer.id,
    "Demo report: I would like the seller to confirm the seat details before handover.",
  ],
);
await c.execute(
  "UPDATE users SET application_note='I have a spare ticket for an upcoming concert and would like to list it within the price cap.' WHERE email='pending@encore.test' AND application_note IS NULL",
);
console.log(
  "Encore database ready. Demo accounts: buyer@encore.test, seller@encore.test, admin@encore.test. Password: Encore2026!",
);
await c.end();
