"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon, Star, Badge } from "./ui";
import { api } from "./api";
export default function Sell({ user }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function apply(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("seller/apply", "POST", {
        note: new FormData(e.currentTarget).get("note"),
      });
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="sell-page section-wrap">
      <div className="sell-intro">
        <span className="eyebrow">LET ANOTHER FAN HAVE THEIR MOMENT</span>
        <h1>
          Can’t make it?
          <br />
          Pass on the
          <br />
          <span className="underlined">good vibes.</span>
        </h1>
        <p>
          Your plans changed. Someone else’s night is about to get a whole lot
          better.
        </p>
        <Star className="sell-star" />
        <div className="steps">
          {[
            [
              "01",
              "Join the seller crew",
              "Apply and wait for an admin to review your account.",
            ],
            [
              "02",
              "List your spare ticket",
              "Choose a concert, add your seat, and stay within the price cap.",
            ],
            [
              "03",
              "Make someone’s night",
              "Manage your sale and send handover details.",
            ],
          ].map(([n, title, desc]) => (
            <div key={n}>
              <b>{n}</b>
              <span>
                <strong>{title}</strong>
                <p>{desc}</p>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel apply-panel">
        <Icon name="ticket" size={36} />
        <h2>Your seller era starts here.</h2>
        {!user ? (
          <>
            <p>
              Sign in or create an account to apply. New accounts start as
              buyers.
            </p>
            <Link className="button full" href="/login">
              Sign in to apply <Icon />
            </Link>
            <Link className="text-button centered" href="/register">
              New here? Join Encore
            </Link>
          </>
        ) : user.role === "seller" ? (
          <>
            <p>You’re already part of the seller crew.</p>
            <Link className="button" href="/seller">
              Open seller dashboard <Icon />
            </Link>
          </>
        ) : user.role === "admin" ? (
          <>
            <p>Review seller applications from your admin panel.</p>
            <Link className="button" href="/admin">
              Open admin panel <Icon />
            </Link>
          </>
        ) : user.seller_application === "pending" ? (
          <>
            <Badge>Application pending</Badge>
            <p>
              Your application is with the admin team. You can keep browsing and
              buying while you wait.
            </p>
            <p className="fine">
              Once approved, sign in again to open your seller dashboard.
            </p>
          </>
        ) : (
          <>
            {user.seller_application === "rejected" && (
              <p className="alert">
                Your previous application wasn’t approved. You can submit a new
                one below.
              </p>
            )}
            <p>
              Tell us a little about the ticket you’d like to sell. An admin
              will review your application.
            </p>
            <form onSubmit={apply}>
              <label>
                Application note
                <textarea
                  name="note"
                  placeholder="Which concert? Why are you reselling?"
                  rows={5}
                  required
                  maxLength={500}
                />
              </label>
              <p className="fine">
                This prototype uses a seller application note. Don’t upload or
                include identity documents or sensitive information.
              </p>
              {error && (
                <p role="alert" className="alert error">
                  {error}
                </p>
              )}
              <button className="button full" disabled={busy}>
                {busy ? "Submitting…" : "Apply to sell"}
                <Icon />
              </button>
            </form>
          </>
        )}
        <div className="cap-note">
          <Icon name="shield" />
          <p>
            Seller approval and price caps support moderation. They don’t
            guarantee ticket authenticity.
          </p>
        </div>
      </div>
    </div>
  );
}
