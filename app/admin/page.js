import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Admin from "@/components/admin";
export const metadata = { title: "Admin studio" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "admin") redirect("/dashboard");
  return <Admin user={u} />;
}
