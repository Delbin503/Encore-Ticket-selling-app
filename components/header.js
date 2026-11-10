"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./ui";
export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const path = usePathname();
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (active) setUser(d.user);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [path]);
  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    router.push("/");
    router.refresh();
    setUser(null);
  }
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link href="/" className="logo" aria-label="Encore home">
          Encore<span>✳</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link className={path === "/" ? "active" : ""} href="/#discover">
            Discover
          </Link>
          <Link
            className={path.startsWith("/sell") ? "active" : ""}
            href={user?.role === "seller" ? "/seller" : "/sell"}
          >
            Sell tickets
          </Link>
          {user?.role === "buyer" && <Link href="/tickets">My tickets</Link>}
          {user?.role === "admin" && <Link href="/admin">Admin panel</Link>}
        </nav>
        <div className="nav-account">
          {user ? (
            <>
              <Link
                className="account-pill"
                href={
                  user.role === "admin"
                    ? "/admin"
                    : user.role === "seller"
                      ? "/seller"
                      : "/tickets"
                }
              >
                <span className="mini-avatar">{user.fullname[0]}</span>
                <span>{user.fullname.split(" ")[0]}</span>
              </Link>
              <button className="icon-button" title="Sign out" onClick={logout}>
                <Icon name="logout" />
              </button>
            </>
          ) : (
            <Link className="button small" href="/login">
              Sign in <Icon size={16} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
