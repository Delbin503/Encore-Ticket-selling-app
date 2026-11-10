import { query } from "@/lib/db";

// Every concert with its cheapest available ticket and ticket count. Only
// listings from active, approved sellers count. Listings are filtered in a
// derived table because TiDB doesn't allow subqueries inside a JOIN's ON.
export function listEvents() {
  return query(
    `SELECT e.*,MIN(l.price) AS from_price,COUNT(l.id) AS ticket_count FROM events e LEFT JOIN (SELECT l.id,l.event_id,l.price FROM listings l JOIN users u ON u.id=l.seller_id WHERE l.status='available' AND u.status='active' AND u.role='seller' AND u.seller_application='approved') l ON l.event_id=e.id GROUP BY e.id ORDER BY e.event_date`,
  );
}
