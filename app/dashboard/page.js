import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function Page() {
  const u = await currentUser();
  redirect(
    !u
      ? "/login"
      : u.role === "admin"
        ? "/admin"
        : u.role === "seller"
          ? "/seller"
          : "/tickets",
  );
}
