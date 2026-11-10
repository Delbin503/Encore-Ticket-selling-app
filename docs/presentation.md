# Encore — DIT205 presentation content

Toe Htet Arkar · Student ID 6808344

## Slide 1 — Encore: For the love of live (20 seconds)

A concert ticket resale web application connecting fans with spare tickets to fans who want to attend.

**Script:** “My project is Encore, a concert ticket resale web application. It continues my Concert Ticket Resale System design from DIT204. The idea is simple: when one fan’s plans change, another fan gets the chance to be there.”

## Slide 2 — Problem, users and benefit (25 seconds)

- Problem: resale listings scattered across social posts make prices, seats and sellers difficult to compare.
- Buyers: search concerts, compare tickets, track purchases and report issues.
- Sellers: list spare tickets, manage sales and send handover details.
- Admins: review sellers, enforce price caps and handle reports.

**Script:** “The problem is that resale tickets are often scattered across social media. Buyers struggle to compare seats and prices, while sellers need a structured way to manage their tickets. Encore brings those steps together. Administrators review sellers, set price caps, and handle reports.”

## Slide 3 — Role-based access control (35 seconds)

| Action                           | Buyer         | Approved seller        | Admin           |
| -------------------------------- | ------------- | ---------------------- | --------------- |
| Browse tickets                   | Yes           | Yes                    | Yes             |
| Buy / view purchases / report    | Own purchases | —                      | Review reports  |
| Create / edit / cancel listings  | —             | Own available listings | Remove listings |
| Send handover                    | —             | Own sales              | —               |
| Approve sellers / set price caps | —             | —                      | Yes             |
| Manage roles / suspend accounts  | —             | —                      | Other accounts  |

**Script:** “There are three roles. Buyers can purchase and report their own tickets. Approved sellers can create listings within the price cap, manage only their own available listings, and send handover details. Admins approve sellers, manage price caps, review reports, and control accounts. These permissions are enforced by the server, so hiding or changing buttons cannot bypass them.”

## Slide 4 — Current working progress (40 seconds)

Use actual screenshots from `screenshots/`:

- `home-desktop.png` — Fan Club concert discovery.
- `buyer-tickets.png` — Purchases and handover status.
- `seller-studio.png` — Listing management.
- `admin-studio.png` — Moderation overview.

**Script:** “The working prototype uses Next.js and MySQL-compatible MariaDB. These are actual screens: the music-inspired homepage, buyer tickets, seller studio, and admin panel. Login, listing management, seller approval, price caps, reports, and handover are implemented. Checkout and payouts are clearly simulated. Real payment processing, identity verification and ticket transfer are future work. The prototype also prevents two buyers from purchasing the same listing.”

## Submission checklist

This file is presentation content, not a submitted slide link. Assemble/export the four slides, add the actual screenshots, and confirm the instructor has view access before submitting the slide link. Keep the spoken presentation within two minutes.
