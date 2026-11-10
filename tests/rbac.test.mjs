import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { pool, query } from "../lib/db.js";
const base = process.env.TEST_URL || "http://localhost:3001";
async function request(path, method = "GET", body, cookie) {
  const r = await fetch(`${base}/api/${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await r.json();
  } catch {
    data = {};
  }
  return {
    status: r.status,
    data,
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
test("Encore API: role, ownership, purchase, moderation and handover boundaries", async (t) => {
  const token = Date.now();
  const users = [];
  let eventId, listingId, orderId;
  try {
    const hash = await bcrypt.hash("TestPassword123!", 4);
    for (const [role, app] of [
      ["buyer", "none"],
      ["seller", "approved"],
      ["seller", "approved"],
      ["admin", "none"],
      ["buyer", "none"],
    ]) {
      const email = `qa-${token}-${users.length}@encore.test`;
      const r = await query(
        "INSERT INTO users(fullname,email,password,role,seller_application) VALUES(?,?,?,?,?)",
        ["QA Test", email, hash, role, app],
      );
      const login = await request("auth/login", "POST", {
        email,
        password: "TestPassword123!",
      });
      assert.equal(login.status, 200);
      users.push({ id: r.insertId, email, cookie: login.cookie });
    }
    const [buyer, seller, other, admin, applicant] = users;
    const ev = await query(
      "INSERT INTO events(artist,title,genre,venue,city,event_date,image,color,price_cap) VALUES('QA Event','QA','Pop','QA Venue','Bangkok','2027-12-01 12:00:00','/images/music.png','#ffffff',2500)",
    );
    eventId = ev.insertId;
    await t.test("Anonymous and buyer cannot access admin APIs", async () => {
      assert.equal((await request("admin/overview")).status, 401);
      assert.equal(
        (await request("admin/overview", "GET", null, buyer.cookie)).status,
        403,
      );
      assert.equal(
        (
          await request(
            "seller/listings",
            "POST",
            { event_id: eventId, section: "QA", seat: "1", price: 100 },
            buyer.cookie,
          )
        ).status,
        403,
      );
    });
    await t.test(
      "Seller cannot list over cap; valid ticket is persisted",
      async () => {
        assert.equal(
          (
            await request(
              "seller/listings",
              "POST",
              { event_id: eventId, section: "QA", seat: "1", price: 2600 },
              seller.cookie,
            )
          ).status,
          400,
        );
        const r = await request(
          "seller/listings",
          "POST",
          { event_id: eventId, section: "QA", seat: "1", price: 2000 },
          seller.cookie,
        );
        assert.equal(r.status, 201);
        listingId = r.data.id;
      },
    );
    await t.test("Other sellers cannot edit or cancel listing", async () => {
      assert.equal(
        (
          await request(
            `seller/listings/${listingId}`,
            "PATCH",
            { section: "hacked", seat: "X", price: 1 },
            other.cookie,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await request(
            `seller/listings/${listingId}`,
            "DELETE",
            null,
            other.cookie,
          )
        ).status,
        403,
      );
    });
    await t.test(
      "Checkout requires explicit simulation; concurrent sales reserve once",
      async () => {
        assert.equal(
          (
            await request(
              "orders",
              "POST",
              { listing_id: listingId },
              buyer.cookie,
            )
          ).status,
          400,
        );
        const rs = await Promise.all([
          request(
            "orders",
            "POST",
            { listing_id: listingId, simulation: true },
            buyer.cookie,
          ),
          request(
            "orders",
            "POST",
            { listing_id: listingId, simulation: true },
            applicant.cookie,
          ),
        ]);
        assert.deepEqual(rs.map((r) => r.status).sort(), [201, 409]);
        const success = rs.findIndex((r) => r.status === 201);
        orderId = rs[success].data.id;
        [users[0], users[4]] =
          success === 0 ? [buyer, applicant] : [applicant, buyer];
      },
    );
    const purchaser = users[0],
      nonbuyer = users[4];
    await t.test(
      "Sold listings cannot be edited; unrelated buyer cannot report",
      async () => {
        assert.equal(
          (
            await request(
              `seller/listings/${listingId}`,
              "PATCH",
              { section: "QA", seat: "1", price: 1000 },
              seller.cookie,
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              "reports",
              "POST",
              { order_id: orderId, reason: "Wrong owner" },
              nonbuyer.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `orders/${orderId}/receive`,
              "PATCH",
              {},
              purchaser.cookie,
            )
          ).status,
          409,
        );
      },
    );
    await t.test(
      "Only owning seller hands over and owning buyer confirms receipt",
      async () => {
        assert.equal(
          (
            await request(
              `orders/${orderId}/handover`,
              "PATCH",
              { details: "QA handover" },
              other.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `orders/${orderId}/handover`,
              "PATCH",
              { details: "QA handover" },
              seller.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              `orders/${orderId}/receive`,
              "PATCH",
              {},
              nonbuyer.cookie,
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              `orders/${orderId}/receive`,
              "PATCH",
              {},
              purchaser.cookie,
            )
          ).status,
          200,
        );
        const r = await request("orders", "GET", null, purchaser.cookie);
        assert.equal(
          r.data.find((o) => o.id === orderId).payout_status,
          "simulated",
        );
      },
    );
    await t.test("Buyer report is unique; admin can review it", async () => {
      assert.equal(
        (
          await request(
            "reports",
            "POST",
            { order_id: orderId, reason: "QA issue" },
            purchaser.cookie,
          )
        ).status,
        201,
      );
      assert.equal(
        (
          await request(
            "reports",
            "POST",
            { order_id: orderId, reason: "Duplicate" },
            purchaser.cookie,
          )
        ).status,
        409,
      );
      const [report] = await query("SELECT id FROM reports WHERE order_id=?", [
        orderId,
      ]);
      assert.equal(
        (
          await request(
            `admin/reports/${report.id}`,
            "PATCH",
            { status: "dismissed", decision: "QA review complete" },
            admin.cookie,
          )
        ).status,
        200,
      );
    });
    await t.test(
      "Application approval and ban apply to existing sessions immediately",
      async () => {
        assert.equal(
          (
            await request(
              "seller/apply",
              "POST",
              { note: "QA application" },
              nonbuyer.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              `admin/users/${nonbuyer.id}`,
              "PATCH",
              { action: "approve" },
              admin.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (await request("auth/me", "GET", null, nonbuyer.cookie)).data.user
            .role,
          "seller",
        );
        assert.equal(
          (
            await request(
              `admin/users/${nonbuyer.id}`,
              "PATCH",
              { action: "ban" },
              admin.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (await request("seller/listings", "GET", null, nonbuyer.cookie))
            .status,
          401,
        );
        assert.equal(
          (
            await request(
              `admin/users/${admin.id}`,
              "PATCH",
              { action: "ban" },
              admin.cookie,
            )
          ).status,
          400,
        );
      },
    );
    await t.test(
      "Cap reduction removes over-cap unsold listings without changing sold orders",
      async () => {
        const r = await request(
          "seller/listings",
          "POST",
          { event_id: eventId, section: "QA", seat: "2", price: 2200 },
          seller.cookie,
        );
        assert.equal(r.status, 201);
        assert.equal(
          (
            await request(
              `admin/events/${eventId}`,
              "PATCH",
              { price_cap: 1500 },
              admin.cookie,
            )
          ).status,
          200,
        );
        const [l] = await query("SELECT status FROM listings WHERE id=?", [
          r.data.id,
        ]);
        assert.equal(l.status, "removed");
        const [o] = await query("SELECT price FROM orders WHERE id=?", [
          orderId,
        ]);
        assert.equal(o.price, 2000);
      },
    );
    await t.test("Cross-origin mutation rejected", async () => {
      const r = await fetch(`${base}/api/auth/logout`, {
        method: "POST",
        headers: {
          origin: "https://unrelated.example",
          "content-type": "application/json",
        },
        body: "{}",
      });
      assert.equal(r.status, 403);
    });
  } finally {
    if (eventId) {
      await query(
        "DELETE r FROM reports r JOIN orders o ON o.id=r.order_id JOIN listings l ON l.id=o.listing_id WHERE l.event_id=?",
        [eventId],
      );
      await query(
        "DELETE o FROM orders o JOIN listings l ON l.id=o.listing_id WHERE l.event_id=?",
        [eventId],
      );
      await query("DELETE FROM listings WHERE event_id=?", [eventId]);
      await query("DELETE FROM events WHERE id=?", [eventId]);
    }
    for (const u of users) await query("DELETE FROM users WHERE id=?", [u.id]);
    await pool.end();
  }
});
