import { query } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Concert from "@/components/concert";
export const dynamic = "force-dynamic";
export default async function Page({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [event] = await query("SELECT * FROM events WHERE id=?", [id]);
  if (!event) notFound();
  const listings = await query(
    "SELECT l.id,l.section,l.seat,l.price,u.fullname AS seller_name FROM listings l JOIN users u ON u.id=l.seller_id WHERE l.event_id=? AND l.status='available' AND u.status='active' AND u.role='seller' AND u.seller_application='approved' ORDER BY l.price",
    [id],
  );
  const user = await currentUser();
  return (
    <Concert
      event={JSON.parse(JSON.stringify(event))}
      listings={listings}
      user={user}
    />
  );
}
