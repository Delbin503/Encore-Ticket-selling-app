import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import Tickets from "@/components/tickets";
export const metadata = { title: "My tickets" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "buyer") redirect("/dashboard");
  const orders = await query(
    "SELECT o.*,e.id AS event_id,e.artist,e.title,e.event_date,e.venue,e.image,l.section,l.seat,u.fullname AS seller_name,r.id AS report_id,r.status AS report_status FROM orders o JOIN listings l ON l.id=o.listing_id JOIN events e ON e.id=l.event_id JOIN users u ON u.id=l.seller_id LEFT JOIN reports r ON r.order_id=o.id WHERE o.buyer_id=? ORDER BY o.id DESC",
    [u.id],
  );
  return <Tickets user={u} orders={JSON.parse(JSON.stringify(orders))} />;
}
