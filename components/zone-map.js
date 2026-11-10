"use client";
import { useState } from "react";
import { Icon, Badge } from "./ui";
import { money } from "@/lib/format";
import { useModalFocus } from "./use-modal-focus";

export default function ZoneMap({
  event,
  listings,
  selected,
  onClose,
  onChoose,
}) {
  const [choice, setChoice] = useState(selected);
  useModalFocus(true, onClose);
  const zones = Object.entries(
    listings.reduce((groups, listing) => {
      (groups[listing.section] ||= []).push(listing);
      return groups;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  return (
    <div className="modal-backdrop">
      <section
        className="modal zone-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zone-map-title"
        aria-describedby="zone-map-description"
      >
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Close zone map"
        >
          <Icon name="close" />
        </button>
        <span className="eyebrow">FIND YOUR SPOT IN THE CROWD</span>
        <h2 id="zone-map-title">A little closer to the music.</h2>
        <p id="zone-map-description">
          {event.venue} · {event.artist}
        </p>
        <div className="zone-map-legend">
          <span>
            <i className="seat-key available" /> Available ticket
          </span>
          <span>
            <i className="seat-key selected" /> Your selection
          </span>
          <Badge>{listings.length} available</Badge>
        </div>
        <div className="venue-map" aria-label="Schematic seating zones">
          <div className="venue-stage">
            <Icon name="music" size={21} />
            <strong>STAGE</strong>
            <span>Feel everything.</span>
          </div>
          <div className="stage-sound" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          {zones.length ? (
            <div className="venue-zones">
              {zones.map(([section, seats], index) => (
                <section
                  className={`venue-zone zone-tone-${index % 3}`}
                  key={section}
                  aria-label={`${section} available seats`}
                >
                  <div className="zone-heading">
                    <h3>{section}</h3>
                    <span>{seats.length} available</span>
                  </div>
                  <div className="zone-seats">
                    {seats.map((listing) => (
                      <button
                        key={listing.id}
                        className={`map-seat ${choice?.id === listing.id ? "chosen" : ""}`}
                        aria-pressed={choice?.id === listing.id}
                        aria-label={`${section}, seat ${listing.seat}, ${money(listing.price)}, sold by ${listing.seller_name}`}
                        onClick={() => setChoice(listing)}
                      >
                        <Icon
                          name={choice?.id === listing.id ? "check" : "ticket"}
                          size={20}
                        />
                        <strong>{listing.seat}</strong>
                        <span>{money(listing.price)}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="zone-empty">
              <Icon name="ticket" size={32} />
              <h3>No seats available right now.</h3>
              <p>Check back for new resale listings.</p>
            </div>
          )}
          <div className="venue-rear" aria-hidden="true">
            BACK OF VENUE
          </div>
        </div>
        <p className="zone-map-note">
          <Icon name="grid" size={16} /> Schematic only, not an official venue
          plan. Zone positions are illustrative; only currently listed resale
          seats are shown.
        </p>
        <div className="zone-selection" aria-live="polite">
          {choice ? (
            <div>
              <span className="eyebrow">YOUR PICK</span>
              <strong>
                {choice.section} · Seat {choice.seat}
              </strong>
              <p>
                Sold by {choice.seller_name} · <b>{money(choice.price)}</b>
              </p>
            </div>
          ) : (
            <div>
              <strong>Where do you want to be?</strong>
              <p>Select an available seat to see its ticket details.</p>
            </div>
          )}
          <button
            className="button"
            disabled={!choice}
            onClick={() => onChoose(choice)}
          >
            Use this ticket <Icon />
          </button>
        </div>
      </section>
    </div>
  );
}
