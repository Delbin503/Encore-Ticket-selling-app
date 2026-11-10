import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(new URL("../package.json", import.meta.url));
const mysql = require("mysql2/promise");
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
  headless: true,
});
const errors = [],
  overflows = [],
  a11y = [];
let purchasedListing;
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
const base = "http://localhost:3001",
  shots = "docs/screenshots/";
async function shot(name) {
  await page.screenshot({ path: shots + name + ".png", fullPage: true });
}
async function overflow(label) {
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    view: innerWidth,
  }));
  if (width.scroll > width.view) overflows.push({ label, ...width });
}
async function login(role) {
  await context.clearCookies();
  await page.goto(base + "/login");
  await page.getByRole("button", { name: role, exact: true }).click();
  await page.getByRole("button", { name: "Let me in", exact: true }).click();
  await page.waitForURL(
    base +
      (role === "buyer"
        ? "/tickets"
        : role === "seller"
          ? "/seller"
          : "/admin"),
  );
  await page.waitForLoadState("networkidle");
}
async function audit(label) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  for (const v of results.violations)
    a11y.push({
      page: label,
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    });
}
try {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => !document.querySelector('[aria-label="Next concerts"]').disabled,
  );
  const visibleCards = await page.locator(".event-grid").evaluate((element) => {
    const frame = element.getBoundingClientRect();
    return [...element.querySelectorAll(".event-card")].filter((card) => {
      const r = card.getBoundingClientRect();
      return r.left >= frame.left - 1 && r.right <= frame.right + 1;
    }).length;
  });
  assert.equal(
    visibleCards,
    4,
    "Desktop carousel should show four complete cards",
  );
  const artwork = await page
    .locator(".event-art .photo")
    .evaluateAll((elements) =>
      elements.map((e) => ({
        image: getComputedStyle(e).backgroundImage,
        size: getComputedStyle(e).backgroundSize,
      })),
    );
  assert.equal(
    new Set(artwork.map((a) => a.image)).size,
    6,
    "Each concert must have a unique image",
  );
  assert.ok(
    artwork.every((a) => a.size === "cover"),
    "Photos should crop proportionally, never stretch",
  );
  await page
    .getByRole("button", { name: "Next concerts", exact: true })
    .click();
  await page.waitForFunction(
    () => document.querySelector(".event-grid").scrollLeft > 100,
  );
  await page
    .getByRole("button", { name: "Previous concerts", exact: true })
    .click();
  await page.waitForFunction(
    () => document.querySelector(".event-grid").scrollLeft < 2,
  );
  await shot("home-desktop");
  await audit("home");
  await overflow("home desktop");
  await page.getByRole("button", { name: "Indie", exact: true }).click();
  assert.equal(await page.locator(".event-card").count(), 2);
  await page.getByRole("button", { name: "All", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search concerts, artists or venues" })
    .fill("LENA");
  assert.equal(await page.locator(".event-card").count(), 1);
  await page
    .getByRole("textbox", { name: "Search concerts, artists or venues" })
    .fill("");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("home-mobile");
  await overflow("home mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/concerts/1", { waitUntil: "networkidle" });
  await shot("concert-details");
  await audit("concert details");
  await page.getByRole("button", { name: "View zone", exact: true }).click();
  const zoneDialog = page.getByRole("dialog");
  await zoneDialog.waitFor();
  const inventory = await (
    await context.request.get(base + "/api/events/1")
  ).json();
  assert.equal(
    await zoneDialog.locator(".map-seat").count(),
    inventory.listings.length,
    "Map must show only actual available listings",
  );
  assert.equal(
    await zoneDialog
      .getByRole("button", { name: "Use this ticket" })
      .isDisabled(),
    true,
  );
  await audit("zone map desktop");
  await shot("zone-map-desktop");
  const chosenSeat = await zoneDialog
    .locator(".map-seat strong")
    .last()
    .innerText();
  await zoneDialog.locator(".map-seat").last().click();
  assert.equal(
    await zoneDialog
      .getByRole("button", { name: "Use this ticket" })
      .isEnabled(),
    true,
  );
  await zoneDialog.getByRole("button", { name: "Use this ticket" }).click();
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.match(
    await page.locator(".ticket-option.chosen").innerText(),
    new RegExp(chosenSeat),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "View zone", exact: true }).click();
  assert.equal(
    await page.locator(".map-seat[aria-pressed=true]").count(),
    1,
    "Selection should persist when reopening map",
  );
  await shot("zone-map-mobile");
  await audit("zone map mobile");
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .getByRole("button", { name: "View zone", exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
    "Map must restore focus to its trigger",
  );
  await overflow("concert mobile");
  await shot("concert-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login("buyer");
  await shot("buyer-tickets");
  await audit("buyer");
  await page.getByRole("button", { name: "Report a problem" }).first().click();
  await page.waitForSelector("[role=dialog]");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("[role=dialog]").count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await overflow("buyer mobile");
  await shot("buyer-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login("seller");
  await page.getByText("All your listings", { exact: false }).waitFor();
  await shot("seller-studio");
  await audit("seller");
  await page
    .getByRole("button", { name: "List a ticket", exact: true })
    .click();
  await page.getByLabel("Section", { exact: true }).fill("QA-UI");
  await page.getByLabel("Seat", { exact: true }).fill("QA-UI");
  await page.getByLabel("Resale price (THB)", { exact: true }).fill("19.99");
  await page.getByRole("button", { name: "Publish my ticket" }).click();
  await page.getByRole("status").waitFor();
  const row = page.locator("tr").filter({ hasText: "QA-UI" });
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Resale price (THB)", { exact: true }).fill("20.50");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.waitForSelector("[role=dialog]", { state: "detached" });
  await row.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Confirm cancellation" }).click();
  await page.waitForSelector("[role=dialog]", { state: "detached" });
  assert.match(await row.innerText(), /cancelled/);
  await page
    .getByRole("button", { name: "Sales & handover", exact: true })
    .click();
  await shot("seller-sales");
  await page
    .getByRole("button", { name: "Send handover", exact: true })
    .first()
    .click();
  await audit("seller handover dialog");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await overflow("seller mobile");
  await shot("seller-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login("admin");
  await page
    .getByText("Seller applications", { exact: true })
    .first()
    .waitFor();
  await shot("admin-studio");
  await audit("admin");
  for (const name of [
    "Seller applications",
    "Ticket listings",
    "Price caps",
    "Reports",
    "User management",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForTimeout(100);
    await overflow("admin " + name);
  }
  await page.getByRole("button", { name: "Price caps", exact: true }).click();
  await page.getByRole("button", { name: "Edit cap ↗" }).first().click();
  await audit("admin cap dialog");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await overflow("admin mobile");
  await shot("admin-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  // Purchase via the visible UI using a temporary ticket and remove only that fixture afterwards.
  const [[seller]] = await db.execute(
    "SELECT id FROM users WHERE email='seller@encore.test'",
  );
  const [r] = await db.execute(
    "INSERT INTO listings(event_id,seller_id,section,seat,price) VALUES(1,?,'QA-UI','QA-BUY',19.99)",
    [seller.id],
  );
  purchasedListing = r.insertId;
  await login("buyer");
  await page.goto(base + "/concerts/1");
  await page.getByRole("button", { name: /QA-UI · Seat QA-BUY/ }).click();
  await page
    .getByRole("checkbox", {
      name: "I understand this is a simulated purchase.",
    })
    .check();
  await page.getByRole("button", { name: "Complete demo purchase" }).click();
  await page.waitForURL(/\/tickets\?purchased=1/);
  await page.getByText(/QA-BUY/).waitFor();
  assert.match(await page.locator("main").innerText(), /QA-BUY/);
  console.log(
    JSON.stringify(
      { result: "UI flows passed", errors, overflows, a11y },
      null,
      2,
    ),
  );
  assert.equal(errors.length, 0);
  assert.equal(overflows.length, 0);
  assert.equal(a11y.length, 0);
} finally {
  if (purchasedListing) {
    await db.execute("DELETE FROM orders WHERE listing_id=?", [
      purchasedListing,
    ]);
    await db.execute("DELETE FROM listings WHERE id=?", [purchasedListing]);
  }
  await db.execute(
    "DELETE FROM listings WHERE section='QA-UI' AND seat='QA-UI' AND status='cancelled'",
  );
  await db.end();
  await browser.close();
}
