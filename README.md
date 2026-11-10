# Encore — Concert Ticket Resale

A DIT205 / DIT204 continuation project by **Toe Htet Arkar · 6808344**.

Encore connects concert fans who need tickets with fans who cannot attend. Its **Fan Club** visual direction uses butter yellow, cobalt blue, coral stickers, poster-style event cards, and concert photography.

## Run this prepared workspace

From `07_encore_mysql`, use two terminals:

```sh
npm run db:local
```

```sh
npm run dev
```

Open **http://localhost:3001**. The prepared workspace has its own ignored `.env.local` and isolated MariaDB data directory on port 3310, using the installed XAMPP MariaDB executable. The previous `06_auth_mysql` assignment is unchanged.

For the production preview, `npm run build` then `npm start` (stop `npm run dev` first).

## Fresh installation with MySQL / MariaDB

1. Install Node.js 22+ and MySQL 8+ or MariaDB 10.4+.
2. Run `npm ci`.
3. Create an `encore_db` database and a database user with schema/data privileges on that database.
4. Copy `.env.example` to `.env.local`, set your connection values, and generate a JWT secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Never commit `.env.local`.
5. Run `npm run db:seed` to create tables and add fictional demo data. Existing rows are not reset.
6. Run `npm run dev` and open http://localhost:3001.

The schema is in `sql/schema.sql`. Dates are stored in UTC and displayed in Asia/Bangkok.

### Optional isolated local MariaDB on this Mac

`npm run db:local` expects `.local-mysql` to have been initialized. It is already initialized in this workspace. On another Mac with XAMPP:

```sh
/Applications/XAMPP/xamppfiles/bin/mysql_install_db --no-defaults --basedir=/Applications/XAMPP/xamppfiles --datadir="$PWD/.local-mysql" --auth-root-authentication-method=normal
npm run db:local
```

Configure a database account and password, remove anonymous accounts, and set `.env.local` before seeding. This helper binds only to 127.0.0.1:3310. `MYSQL_BASEDIR` can override the binary directory.

## Demonstration accounts

All share the demo password **Encore2026!**:

| Email                    | Role                   | Purpose                                         |
| ------------------------ | ---------------------- | ----------------------------------------------- |
| buyer@encore.test        | Buyer                  | Purchases, handovers, reports                   |
| seller@encore.test       | Approved seller        | Own listings, sales and handover                |
| admin@encore.test        | Admin                  | Applications, listings, caps, reports, accounts |
| pending@encore.test      | Buyer / pending seller | Seller approval demonstration                   |
| other-seller@encore.test | Approved seller        | Ownership boundary demonstration                |

The login page has role buttons that fill demo credentials; click **Let me in** to sign in. These known demo accounts are for local classroom use. Replace them before a real deployment.

## Features

- Responsive four-card desktop concert carousel with previous/next controls, mobile swiping, live search and genre filtering.
- Six unique AI-generated concert portraits, proportionally cropped across cards, details and purchases.
- Concert details, available seats, seller names and event price caps.
- View zone seating schematic with selectable available resale seats, seller/price details, and selection passed into checkout. Zone positions are illustrative, not an official venue plan.
- Registration (buyer role only), bcrypt passwords and signed HttpOnly session cookie.
- Explicitly simulated checkout. A SQL transaction locks a listing and prevents double purchase.
- Buyer purchases, handover receipt confirmation, and reports restricted to owned purchases.
- Seller applications and admin approval before listing creation.
- Seller listing creation, editing and cancellation restricted to their own unsold listings.
- Seller sale history and owned-order handover instructions.
- Admin seller review, listing removal, event price caps, report decisions, account suspension/restoration and role management.
- Lowering a price cap removes over-cap available listings while preserving sold order prices.
- Roles and account status read from the database on each authenticated request: changes apply to existing sessions.
- Cross-origin mutations rejected, parameterized SQL, server input validation and keyboard focus-managed dialogs.

## RBAC

| Feature / action                 | Buyer | Approved seller  | Admin               |
| -------------------------------- | ----- | ---------------- | ------------------- |
| Browse concerts / tickets        | Yes   | Yes              | Yes                 |
| Purchase                         | Yes   | No               | No                  |
| View purchases / confirm receipt | Own   | No               | No                  |
| Report a purchased ticket        | Own   | No               | Review reports      |
| Apply to sell                    | Yes   | Already approved | Review applications |
| Create listings                  | No    | Within cap       | No                  |
| Edit / cancel listings           | No    | Own available    | Remove available    |
| View sales / send handover       | No    | Own sales        | No                  |
| Set price caps                   | No    | No               | Yes                 |
| Review seller applications       | No    | No               | Yes                 |
| Decide reports                   | No    | No               | Yes                 |
| Suspend / restore accounts       | No    | No               | Others only         |
| Manage user roles                | No    | No               | Others only         |

Visitors can browse public concerts. Pending sellers retain buyer permissions. Admins cannot change their own role/status. A payment gateway is an external service, not a user role. The admin panel intentionally avoids access to private handover text.

`lib/rbac.js` is the role/permission map. `lib/auth.js` checks current database access. API handlers in `app/api/[...path]/route.js` enforce permissions and ownership independently of UI visibility. Protected pages also check the current user before rendering.

## Verification

```sh
npm run lint
npm run build
# With the app and DB running:
npm test
```

The integration suite creates temporary fixtures and removes them after running. It exercises anonymous/role restrictions, ownership, price caps, simultaneous checkout, handover, report uniqueness, immediate approval/ban effects, self-management protection, and cross-origin rejection.

Actual desktop/mobile screenshots are in `docs/screenshots`. Presentation content and a two-minute script are in `docs/presentation.md`.

## Prototype scope

All events and tickets are fictional. Artwork is AI-generated. Payments and payouts are simulated: no money is charged or transferred and no ticket is issued. Seller approval uses an application note, **not identity-document verification**. Approval does not guarantee authenticity. Real payment integration, ticket validation/transfer, identity verification, refund handling and email delivery remain future work.

### Browser and accessibility checks

With the app and database running, install a Playwright browser once (`npx playwright install chromium`) and run `npm run test:browser`. On this Mac, the existing Chrome can be used without downloading Chromium:

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:browser
```

The browser check exercises role sign-in, filters/search, decimal-price listing creation/editing/cancellation, modal keyboard dismissal, simulated checkout, mobile overflow and axe WCAG checks. It captures current screenshots and removes temporary test listings/orders.
