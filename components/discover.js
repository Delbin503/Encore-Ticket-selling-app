"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Icon, Photo, Star } from "./ui";
import { date, money } from "@/lib/format";
const genres = ["All", "Pop", "Indie", "Rock", "Hip-Hop", "R&B", "EDM"];
export default function Discover({ events }) {
  const [search, setSearch] = useState(""),
    [genre, setGenre] = useState("All");
  const track = useRef(null);
  const [edges, setEdges] = useState({ previous: false, next: false });
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () =>
      setEdges({
        previous: element.scrollLeft > 2,
        next:
          element.scrollLeft + element.clientWidth < element.scrollWidth - 2,
      });
    element.scrollTo({ left: 0, behavior: "instant" });
    const frame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, [search, genre, events.length]);
  function move(direction) {
    const element = track.current;
    if (element)
      element.scrollBy({
        left: direction * (element.clientWidth + 20),
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }
  const filtered = events.filter(
    (e) =>
      (genre === "All" || e.genre === genre) &&
      `${e.artist} ${e.title} ${e.venue} ${e.city}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <section id="discover" className="discover section-wrap">
      <div className="search-bar">
        <Icon name="search" size={24} />
        <input
          aria-label="Search concerts, artists or venues"
          placeholder="Your artist, your concert, your next night…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="search-location">
          <Icon name="pin" size={16} /> Bangkok, TH
        </span>
      </div>
      <div className="section-head">
        <div>
          <span className="eyebrow">THE GOOD STUFF STARTS HERE</span>
          <h2>
            Find your kind of loud<span className="coral">.</span>
          </h2>
        </div>
        <span className="result-count">
          {filtered.length} concerts to fall for <Icon name="music" />
        </span>
      </div>
      <div className="discovery-tools">
        <div className="genre-row" role="group" aria-label="Filter by genre">
          {genres.map((g) => (
            <button
              key={g}
              className={`chip ${g === genre ? "selected" : ""}`}
              onClick={() => setGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <div
          className="carousel-controls"
          aria-label="Concert carousel controls"
        >
          <button
            type="button"
            className="carousel-arrow previous"
            aria-label="Previous concerts"
            aria-controls="concert-carousel"
            disabled={!edges.previous}
            onClick={() => move(-1)}
          >
            <Icon />
          </button>
          <button
            type="button"
            className="carousel-arrow"
            aria-label="Next concerts"
            aria-controls="concert-carousel"
            disabled={!edges.next}
            onClick={() => move(1)}
          >
            <Icon />
          </button>
        </div>
      </div>
      <div
        className="event-grid"
        id="concert-carousel"
        ref={track}
        role="region"
        aria-roledescription="carousel"
        aria-label="Concerts"
        tabIndex={0}
      >
        {filtered.map((e, i) => (
          <Link href={`/concerts/${e.id}`} className="event-card" key={e.id}>
            <div className="event-art" style={{ background: e.color }}>
              <Photo event={e} />
              {i === 0 && genre === "All" && (
                <span className="sticker small-sticker">
                  YOUR NEXT
                  <br />
                  OBSESSION
                </span>
              )}
              <span className="genre-label">{e.genre}</span>
              <div className="poster-title">
                <strong>{e.artist}</strong>
                <span>{e.title}</span>
              </div>
            </div>
            <div className="event-info">
              <div className="event-meta">
                <span>
                  <Icon name="calendar" size={15} />
                  {date(e.event_date)}
                </span>
                <span>
                  <Icon name="pin" size={15} />
                  {e.venue}, {e.city}
                </span>
              </div>
              <div className="card-bottom">
                <span>
                  {e.ticket_count}{" "}
                  {Number(e.ticket_count) === 1 ? "ticket" : "tickets"}{" "}
                  available
                </span>
                <strong>
                  {e.from_price ? <>From {money(e.from_price)}</> : "Sold out"}{" "}
                  <Icon size={17} />
                </strong>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          <Star className="empty-star" />
          <h3>No gigs found. Yet.</h3>
          <p>Try another artist or genre.</p>
          <button
            className="button"
            onClick={() => {
              setSearch("");
              setGenre("All");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
