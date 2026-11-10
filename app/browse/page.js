import { listEvents } from "@/lib/events";
import Discover from "@/components/discover";

export const dynamic = "force-dynamic";
export const metadata = { title: "Browse concerts" };

export default async function BrowsePage() {
  const events = await listEvents();
  return (
    <div className="browse-page">
      <Discover
        events={JSON.parse(JSON.stringify(events))}
        layout="grid"
        id="browse"
        eyebrow="EVERY SHOW, ONE PLACE"
        title="Browse all concerts"
      />
    </div>
  );
}
