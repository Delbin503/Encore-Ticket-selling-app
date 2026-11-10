import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool, query } from "@/lib/db";
import {
  AppError,
  requireUser,
  currentUser,
  signToken,
  text,
  id,
  amount,
} from "@/lib/auth";
export const dynamic = "force-dynamic";
const ok = (data, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function handle(req, ctx) {
  try {
    const { path } = await ctx.params;
    const key = path.join("/");
    const method = req.method;
    // Same-origin mutations protect cookie-authenticated endpoints against cross-site form submissions.
    if (method !== "GET") {
      const origin = req.headers.get("origin");
      if (origin && origin !== new URL(req.url).origin)
        throw new AppError("Cross-origin request rejected.", 403);
      if (req.headers.get("sec-fetch-site") === "cross-site")
        throw new AppError("Cross-site request rejected.", 403);
    }
    let body = {};
    if (method !== "GET" && method !== "DELETE") {
      try {
        body = await req.json();
      } catch {
        throw new AppError("Send a valid JSON request.");
      }
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new AppError("Invalid request body.");
    }
    if (key === "auth/me" && method === "GET")
      return ok({ user: await currentUser() });
    if (key === "auth/logout" && method === "POST") {
      const r = ok({ ok: true });
      r.cookies.set("encore_session", "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      return r;
    }
    if (key === "auth/register" && method === "POST") {
      const fullname = text(body.fullname, "Name", 100),
        email = text(body.email, "Email", 190).toLowerCase(),
        password = text(body.password, "Password", 100);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new AppError("Enter a valid email address.");
      if (password.length < 8)
        throw new AppError("Use a password with at least 8 characters.");
      await query("INSERT INTO users(fullname,email,password) VALUES(?,?,?)", [
        fullname,
        email,
        await bcrypt.hash(password, 10),
      ]);
      return ok({ ok: true }, 201);
    }
    if (key === "auth/login" && method === "POST") {
      const email = text(body.email, "Email", 190).toLowerCase(),
        password = text(body.password, "Password", 100);
      const [u] = await query("SELECT * FROM users WHERE email=?", [email]);
      if (!u || !(await bcrypt.compare(password, u.password)))
        throw new AppError("Email or password is incorrect.", 401);
      if (u.status !== "active")
        throw new AppError("This account has been suspended.", 403);
      const r = ok({ ok: true, role: u.role });
      r.cookies.set("encore_session", await signToken(u), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 7200,
      });
      return r;
    }
    if (key === "events" && method === "GET")
      return ok(
        await query(
          `SELECT e.*,MIN(l.price) AS from_price,COUNT(l.id) AS ticket_count FROM events e LEFT JOIN (SELECT l.id,l.event_id,l.price FROM listings l JOIN users s ON s.id=l.seller_id WHERE l.status='available' AND s.status='active' AND s.role='seller' AND s.seller_application='approved') l ON l.event_id=e.id GROUP BY e.id ORDER BY e.event_date`,
        ),
      );
    if (path[0] === "events" && path.length === 2 && method === "GET") {
      const [event] = await query("SELECT * FROM events WHERE id=?", [
        id(path[1]),
      ]);
      if (!event) throw new AppError("Concert not found.", 404);
      const listings = await query(
        `SELECT l.id,l.section,l.seat,l.price,u.fullname AS seller_name FROM listings l JOIN users u ON u.id=l.seller_id WHERE l.event_id=? AND l.status='available' AND u.status='active' AND u.role='seller' AND u.seller_application='approved' ORDER BY l.price`,
        [event.id],
      );
      return ok({ event, listings });
    }
    if (key === "seller/apply" && method === "POST") {
      const u = await requireUser("seller:apply");
      if (u.seller_application === "pending")
        throw new AppError("Your application is already being reviewed.", 409);
      await query(
        "UPDATE users SET seller_application='pending',application_note=? WHERE id=?",
        [text(body.note, "Application note", 500), u.id],
      );
      return ok({ ok: true });
    }
    if (key === "seller/listings" && method === "GET") {
      const u = await requireUser("listing:own");
      return ok(
        await query(
          "SELECT l.*,e.artist,e.title,e.image,e.event_date FROM listings l JOIN events e ON e.id=l.event_id WHERE seller_id=? ORDER BY l.id DESC",
          [u.id],
        ),
      );
    }
    if (key === "seller/listings" && method === "POST") {
      const u = await requireUser("listing:create");
      if (u.seller_application !== "approved")
        throw new AppError("Seller approval is required.", 403);
      const c = await pool.getConnection();
      try {
        await c.beginTransaction();
        const [events] = await c.execute(
          "SELECT * FROM events WHERE id=? FOR UPDATE",
          [id(body.event_id)],
        );
        const e = events[0];
        if (!e) throw new AppError("Concert not found.", 404);
        const price = amount(body.price);
        if (price > e.price_cap)
          throw new AppError(`The price cap is ฿${e.price_cap}.`);
        const [r] = await c.execute(
          "INSERT INTO listings(event_id,seller_id,section,seat,price) VALUES(?,?,?,?,?)",
          [
            e.id,
            u.id,
            text(body.section, "Section", 80),
            text(body.seat, "Seat", 60),
            price,
          ],
        );
        await c.commit();
        return ok({ id: r.insertId }, 201);
      } catch (e) {
        await c.rollback();
        throw e;
      } finally {
        c.release();
      }
    }
    if (
      path[0] === "seller" &&
      path[1] === "listings" &&
      path.length === 3 &&
      ["PATCH", "DELETE"].includes(method)
    ) {
      const u = await requireUser("listing:own");
      const c = await pool.getConnection();
      try {
        await c.beginTransaction();
        // Lock event before listing, matching purchase and cap-update lock order.
        const [refs] = await c.execute(
          "SELECT event_id FROM listings WHERE id=?",
          [id(path[2])],
        );
        if (!refs[0]) throw new AppError("Listing not found.", 404);
        const [es] = await c.execute(
          "SELECT * FROM events WHERE id=? FOR UPDATE",
          [refs[0].event_id],
        );
        const [ls] = await c.execute(
          "SELECT * FROM listings WHERE id=? FOR UPDATE",
          [id(path[2])],
        );
        const l = ls[0];
        if (l.seller_id !== u.id)
          throw new AppError("You can only change your own listings.", 403);
        if (l.status !== "available")
          throw new AppError("Only available listings can be changed.", 409);
        if (method === "DELETE")
          await c.execute("UPDATE listings SET status='cancelled' WHERE id=?", [
            l.id,
          ]);
        else {
          const price = amount(body.price);
          if (price > es[0].price_cap)
            throw new AppError(`The price cap is ฿${es[0].price_cap}.`);
          await c.execute(
            "UPDATE listings SET section=?,seat=?,price=? WHERE id=?",
            [
              text(body.section, "Section", 80),
              text(body.seat, "Seat", 60),
              price,
              l.id,
            ],
          );
        }
        await c.commit();
        return ok({ ok: true });
      } catch (e) {
        await c.rollback();
        throw e;
      } finally {
        c.release();
      }
    }
    if (key === "orders" && method === "POST") {
      const u = await requireUser("order:create");
      if (body.simulation !== true)
        throw new AppError("Confirm this is a simulated purchase.");
      const c = await pool.getConnection();
      try {
        await c.beginTransaction();
        const [refs] = await c.execute(
          "SELECT event_id FROM listings WHERE id=?",
          [id(body.listing_id)],
        );
        if (!refs[0]) throw new AppError("Ticket not found.", 404);
        const [es] = await c.execute(
          "SELECT * FROM events WHERE id=? FOR UPDATE",
          [refs[0].event_id],
        );
        const [rows] = await c.execute(
          "SELECT l.*,u.status AS seller_status,u.role AS seller_role,u.seller_application FROM listings l JOIN users u ON u.id=l.seller_id WHERE l.id=? FOR UPDATE",
          [id(body.listing_id)],
        );
        const l = rows[0];
        if (
          !l ||
          l.status !== "available" ||
          l.seller_status !== "active" ||
          l.seller_role !== "seller" ||
          l.seller_application !== "approved"
        )
          throw new AppError("This ticket is no longer available.", 409);
        if (Number(l.price) > Number(es[0].price_cap))
          throw new AppError(
            "This listing exceeds the current price cap.",
            409,
          );
        const [r] = await c.execute(
          "INSERT INTO orders(listing_id,buyer_id,price) VALUES(?,?,?)",
          [l.id, u.id, l.price],
        );
        await c.execute("UPDATE listings SET status='sold' WHERE id=?", [l.id]);
        await c.commit();
        return ok({ id: r.insertId }, 201);
      } catch (e) {
        await c.rollback();
        throw e;
      } finally {
        c.release();
      }
    }
    if (key === "orders" && method === "GET") {
      const u = await requireUser("order:own");
      return ok(
        await query(
          "SELECT o.*,e.id AS event_id,e.artist,e.title,e.event_date,e.venue,e.image,l.section,l.seat,u.fullname AS seller_name,r.id AS report_id,r.status AS report_status FROM orders o JOIN listings l ON l.id=o.listing_id JOIN events e ON e.id=l.event_id JOIN users u ON u.id=l.seller_id LEFT JOIN reports r ON r.order_id=o.id WHERE o.buyer_id=? ORDER BY o.id DESC",
          [u.id],
        ),
      );
    }
    if (key === "seller/sales" && method === "GET") {
      const u = await requireUser("sale:own");
      return ok(
        await query(
          "SELECT o.*,e.artist,l.section,l.seat,u.fullname AS buyer_name FROM orders o JOIN listings l ON l.id=o.listing_id JOIN events e ON e.id=l.event_id JOIN users u ON u.id=o.buyer_id WHERE l.seller_id=? ORDER BY o.id DESC",
          [u.id],
        ),
      );
    }
    if (
      path[0] === "orders" &&
      path.length === 3 &&
      path[2] === "handover" &&
      method === "PATCH"
    ) {
      const u = await requireUser("handover:update");
      const result = await query(
        "UPDATE orders o JOIN listings l ON l.id=o.listing_id SET o.handover_details=?,o.handover_status='sent' WHERE o.id=? AND l.seller_id=? AND o.handover_status='pending'",
        [text(body.details, "Handover details", 1500), id(path[1]), u.id],
      );
      if (!result.affectedRows)
        throw new AppError(
          "Sale unavailable, already handed over, or belongs to another seller.",
          403,
        );
      return ok({ ok: true });
    }
    if (
      path[0] === "orders" &&
      path.length === 3 &&
      path[2] === "receive" &&
      method === "PATCH"
    ) {
      const u = await requireUser("order:own");
      const r = await query(
        "UPDATE orders SET handover_status='received',payout_status='simulated' WHERE id=? AND buyer_id=? AND handover_status='sent'",
        [id(path[1]), u.id],
      );
      if (!r.affectedRows)
        throw new AppError("Handover is not ready for confirmation.", 409);
      return ok({ ok: true });
    }
    if (key === "reports" && method === "POST") {
      const u = await requireUser("report:create");
      const [o] = await query(
        "SELECT id FROM orders WHERE id=? AND buyer_id=?",
        [id(body.order_id), u.id],
      );
      if (!o)
        throw new AppError("You can only report your own purchases.", 403);
      await query(
        "INSERT INTO reports(order_id,buyer_id,reason) VALUES(?,?,?)",
        [o.id, u.id, text(body.reason, "Report reason", 1500)],
      );
      return ok({ ok: true }, 201);
    }
    if (key === "admin/overview" && method === "GET") {
      await requireUser("user:manage");
      const users = await query(
        "SELECT id,fullname,email,role,status,seller_application,application_note FROM users ORDER BY id",
      );
      const listings = await query(
        "SELECT l.*,e.artist,u.fullname AS seller_name FROM listings l JOIN events e ON e.id=l.event_id JOIN users u ON u.id=l.seller_id ORDER BY l.id DESC",
      );
      const reports = await query(
        "SELECT r.*,e.artist,u.fullname AS buyer_name,s.fullname AS seller_name,s.id AS seller_id FROM reports r JOIN orders o ON o.id=r.order_id JOIN listings l ON l.id=o.listing_id JOIN events e ON e.id=l.event_id JOIN users u ON u.id=r.buyer_id JOIN users s ON s.id=l.seller_id ORDER BY r.id DESC",
      );
      const events = await query("SELECT * FROM events ORDER BY event_date");
      return ok({ users, listings, reports, events });
    }
    if (
      path[0] === "admin" &&
      path[1] === "users" &&
      path.length === 3 &&
      method === "PATCH"
    ) {
      const u = await requireUser("user:manage");
      const target = id(path[2]);
      if (target === u.id)
        throw new AppError("You cannot change your own account.");
      if (body.action === "approve" || body.action === "reject") {
        const approved = body.action === "approve";
        const r = await query(
          "UPDATE users SET seller_application=?,role=? WHERE id=? AND seller_application='pending' AND status='active' AND role='buyer'",
          [
            approved ? "approved" : "rejected",
            approved ? "seller" : "buyer",
            target,
          ],
        );
        if (!r.affectedRows)
          throw new AppError("No pending seller application found.", 409);
      } else if (body.action === "ban" || body.action === "restore") {
        const r = await query("UPDATE users SET status=? WHERE id=?", [
          body.action === "ban" ? "banned" : "active",
          target,
        ]);
        if (!r.affectedRows) throw new AppError("User not found.", 404);
      } else if (body.action === "role") {
        if (!["buyer", "seller", "admin"].includes(body.role))
          throw new AppError("Invalid role.");
        const [t] = await query("SELECT * FROM users WHERE id=?", [target]);
        if (!t) throw new AppError("User not found.", 404);
        if (body.role === "seller" && t.seller_application !== "approved")
          throw new AppError(
            "Approve the seller application before granting seller access.",
          );
        await query("UPDATE users SET role=? WHERE id=?", [body.role, target]);
      } else throw new AppError("Invalid action.");
      return ok({ ok: true });
    }
    if (
      path[0] === "admin" &&
      path[1] === "events" &&
      path.length === 3 &&
      method === "PATCH"
    ) {
      await requireUser("cap:update");
      const cap = amount(body.price_cap);
      const c = await pool.getConnection();
      try {
        await c.beginTransaction();
        const [es] = await c.execute(
          "SELECT id FROM events WHERE id=? FOR UPDATE",
          [id(path[2])],
        );
        if (!es[0]) throw new AppError("Concert not found.", 404);
        await c.execute("UPDATE events SET price_cap=? WHERE id=?", [
          cap,
          id(path[2]),
        ]);
        const [r] = await c.execute(
          "UPDATE listings SET status='removed' WHERE event_id=? AND status='available' AND price>?",
          [id(path[2]), cap],
        );
        await c.commit();
        return ok({ ok: true, removed: r.affectedRows });
      } catch (e) {
        await c.rollback();
        throw e;
      } finally {
        c.release();
      }
    }
    if (
      path[0] === "admin" &&
      path[1] === "listings" &&
      path.length === 3 &&
      method === "DELETE"
    ) {
      await requireUser("listing:moderate");
      const r = await query(
        "UPDATE listings SET status='removed' WHERE id=? AND status='available'",
        [id(path[2])],
      );
      if (!r.affectedRows)
        throw new AppError("Only available listings can be removed.", 409);
      return ok({ ok: true });
    }
    if (
      path[0] === "admin" &&
      path[1] === "reports" &&
      path.length === 3 &&
      method === "PATCH"
    ) {
      await requireUser("report:review");
      if (!["confirmed", "dismissed"].includes(body.status))
        throw new AppError("Invalid decision.");
      const r = await query(
        "UPDATE reports SET status=?,decision=? WHERE id=? AND status='open'",
        [body.status, text(body.decision, "Decision note", 500), id(path[2])],
      );
      if (!r.affectedRows)
        throw new AppError("Report already reviewed or not found.", 409);
      return ok({ ok: true });
    }
    throw new AppError("Endpoint not found.", 404);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY")
      return ok(
        { message: "This email, purchase, or report already exists." },
        409,
      );
    if (e instanceof AppError) return ok({ message: e.message }, e.status);
    console.error("Encore API:", e.code || e.message);
    return ok({ message: "Something went wrong. Please try again." }, 500);
  }
}
export const GET = handle,
  POST = handle,
  PATCH = handle,
  DELETE = handle;
