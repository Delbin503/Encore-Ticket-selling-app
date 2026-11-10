import "./style.css";
import Header from "@/components/header";
import Link from "next/link";
export const metadata = {
  title: {
    default: "Encore — Be there. Feel everything.",
    template: "%s · Encore",
  },
  description:
    "Find your next night. A concert ticket resale project for music fans, built with Next.js and MySQL.",
};
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main id="main-content">{children}</main>
        <footer className="footer">
          <div>
            <Link href="/" className="logo">
              Encore<span>✳</span>
            </Link>
            <p>For the love of live.</p>
          </div>
          <div>
            <p>DIT205 · Toe Htet Arkar · 6808344</p>
            <p className="fine">
              Student project · Fictional events · Payments are simulated
            </p>
          </div>
          <Link href="/about">How Encore works ↗</Link>
        </footer>
      </body>
    </html>
  );
}
