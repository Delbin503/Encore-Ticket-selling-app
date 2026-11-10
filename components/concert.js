"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, Photo, Badge, Empty } from "./ui";
import { date, time, money } from "@/lib/format";
import { api } from "./api";
import ZoneMap from "./zone-map";
export default function Concert({ event, listings, user }) {
  const router = useRouter();
  const [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false),
    [zoneOpen, setZoneOpen] = useState(false);
  function selectTicket(listing) {
    setSelected(listing);
    setError("");
    setConfirm(false);
  }
  async function buy() {
    setBusy(true);
    setError("");
    try {
      await api("orders", "POST", {
        listing_id: selected.id,
        simulation: true,
      });
      router.push("/tickets?purchased=1");
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="section-wrap concert-page">
      <Link className="back-link" href="/#discover">
        ← Back to the good stuff
      </Link>
      <div className="concert-layout">
        <div>
          <div className="concert-poster" style={{ background: event.color }}>
            <Photo event={event} />
            <span className="poster-eyebrow">
              ENCORE PRESENTS · {event.genre.toUpperCase()}
            </span>
            <div className="poster-title">
              <strong>{event.artist}</strong>
              <span>{event.title}</span>
            </div>
            <span className="poster-footer">
              LIVE IN BANGKOK / {date(event.event_date).toUpperCase()}
            </span>
          </div>
          <div className="event-description">
            <h2>The night you’ll talk about.</h2>
            <p>
              One stage. A room full of fans. Find your seat for {event.artist}
              ’s {event.title} and be part of the crowd.
            </p>
            <p className="fine">
              Fictional concert for this student project. Seller approval is an
              account review, not a guarantee of ticket authenticity.
            </p>
          </div>
        </div>
        <div className="ticket-panel">
          <Badge>{event.genre} · Live music</Badge>
          <h1>{event.artist}</h1>
          <p className="lead">{event.title}</p>
          <div className="concert-facts">
            <p>
              <Icon name="calendar" />
              {date(event.event_date)} · {time(event.event_date)} ICT
            </p>
            <p>
              <Icon name="pin" />
              {event.venue}, {event.city}
            </p>
          </div>
          <div className="cap-note">
            <Icon name="shield" />
            <div>
              <strong>A cap on prices. Not on the vibes.</strong>
              <span>
                Maximum resale price: {money(event.price_cap)} per ticket.
              </span>
            </div>
          </div>
          <div className="section-head compact">
            <h2>Pick your ticket</h2>
            <div className="ticket-heading-actions">
              <span className="fine">{listings.length} available</span>
              <button
                className="button small outline view-zone-button"
                onClick={() => setZoneOpen(true)}
                aria-haspopup="dialog"
              >
                <Icon name="grid" size={16} /> View zone
              </button>
            </div>
          </div>
          <div className="ticket-options">
            {listings.map((l) => (
              <button
                className={`ticket-option ${selected?.id === l.id ? "chosen" : ""}`}
                key={l.id}
                onClick={() => selectTicket(l)}
                aria-pressed={selected?.id === l.id}
              >
                <span className="radio-dot" />
                <span>
                  <strong>
                    {l.section} · Seat {l.seat}
                  </strong>
                  <small>Sold by {l.seller_name}</small>
                </span>
                <b>{money(l.price)}</b>
              </button>
            ))}
          </div>
          {!listings.length && (
            <Empty title="All snapped up.">
              Check back later for new listings.
            </Empty>
          )}
          {selected && (
            <div className="checkout">
              <div className="total-row">
                <span>Total · 1 ticket</span>
                <strong>{money(selected.price)}</strong>
              </div>
              <p className="simulation">
                <Icon name="ticket" size={16} /> Demo checkout · no money will
                be charged.
              </p>
              {!user ? (
                <Link className="button full" href="/login">
                  Sign in to continue <Icon />
                </Link>
              ) : user.role !== "buyer" ? (
                <p className="alert">
                  Use a buyer account to make a demo purchase.
                </p>
              ) : (
                <>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={confirm}
                      onChange={(e) => setConfirm(e.target.checked)}
                    />
                    I understand this is a simulated purchase.
                  </label>
                  <button
                    className="button full"
                    disabled={!confirm || busy}
                    onClick={buy}
                  >
                    {busy ? "Reserving your ticket…" : "Complete demo purchase"}
                    <Icon />
                  </button>
                </>
              )}
              {error && (
                <p className="alert error" role="alert">
                  {error}
                </p>
              )}
            </div>
          )}
          <p className="fine ticket-disclaimer">
            One listing = one ticket. Handover details appear in My tickets
            after the seller sends them. No real payment or ticket transfer
            takes place.
          </p>
        </div>
      </div>
      {zoneOpen && (
        <ZoneMap
          event={event}
          listings={listings}
          selected={selected}
          onClose={() => setZoneOpen(false)}
          onChoose={(listing) => {
            selectTicket(listing);
            setZoneOpen(false);
          }}
        />
      )}
    </div>
  );
}
