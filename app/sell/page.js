import { currentUser } from "@/lib/auth";
import Sell from "@/components/sell";
export const metadata = { title: "Sell a ticket" };
export const dynamic = "force-dynamic";
export default async function Page() {
  return <Sell user={await currentUser()} />;
}
