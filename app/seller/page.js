import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Seller from "@/components/seller";
export const metadata = { title: "Seller studio" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "seller" || u.seller_application !== "approved")
    redirect("/sell");
  return <Seller user={u} />;
}
