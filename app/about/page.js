import Link from "next/link";
import { Icon } from "@/components/ui";
export const metadata = { title: "How Encore works" };
export default function Page() {
  return (
    <article className="section-wrap about-page">
      <span className="eyebrow">FOR THE LOVE OF LIVE</span>
      <h1>
        Good tickets.
        <br />
        Better memories.
      </h1>
      <p className="lead">
        Encore is a DIT205 concert ticket resale prototype by Toe Htet Arkar
        (6808344), continuing the Concert Ticket Resale System design.
      </p>
      <div className="about-grid">
        <section className="panel">
          <Icon name="ticket" />
          <h2>For buyers</h2>
          <p>
            Find concerts, compare seats and prices, complete a simulated
            purchase, view seller handover details, and report a problem with
            your own purchase.
          </p>
        </section>
        <section className="panel">
          <Icon name="music" />
          <h2>For sellers</h2>
          <p>
            Apply for admin approval. Once approved, list tickets within the
            event price cap, manage your own available listings, and send
            handover instructions to buyers.
          </p>
        </section>
        <section className="panel">
          <Icon name="shield" />
          <h2>For admins</h2>
          <p>
            Review seller applications, set price caps, remove listings, review
            reports, suspend accounts, and manage roles.
          </p>
        </section>
      </div>
      <section className="panel">
        <h2>A prototype with clear boundaries.</h2>
        <p>
          All concerts, ticket listings, and demonstration accounts are
          fictional. Artwork is AI-generated. Checkout and payouts are
          simulations: no money is charged, no ticket is issued, and no real
          payment gateway is connected.
        </p>
        <p>
          Seller applications use a short note. Identity verification, real
          ticket transfer, payment processing, and payout integration are future
          work. Approval does not guarantee ticket authenticity.
        </p>
        <p>
          Permissions and ownership are checked on the server. Account status
          and role changes are read from the database on each authenticated
          request.
        </p>
      </section>
      <Link className="button" href="/">
        Find your next night <Icon />
      </Link>
    </article>
  );
}
