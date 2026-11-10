import Link from "next/link";
import { Fragment } from "react";
import { listEvents } from "@/lib/events";
import { Icon, Photo, Star } from "@/components/ui";
import Discover from "@/components/discover";
export const dynamic = "force-dynamic";
const MARQUEE_WORDS = [
  "FANS FIRST",
  "LOUDER TOGETHER",
  "MORE MUSIC. MORE MEMORIES.",
];
export default async function Home() {
  const events = await listEvents();
  return (
    <>
      <section className="hero section-wrap">
        <div className="hero-copy">
          <div className="hero-tag">
            <span /> THE TICKET TO YOUR NEXT CORE MEMORY
          </div>
          <h1>
            Be there.
            <br />
            Feel <span className="underlined">everything.</span>
          </h1>
          <p>
            The lights. The crowd. Your favourite song.
            <br />
            Find resale tickets. Make a night of it.
          </p>
          <Link className="button hero-cta" href="#discover">
            Find my next concert <Icon />
          </Link>
          <div className="hero-note">
            <span className="doodle-arrow">↳</span> more live music, less FOMO.
          </div>
        </div>
        <div className="hero-collage" aria-label="Concert photography collage">
          <span className="scribble">✴</span>
          <div className="polaroid main-polaroid">
            <Photo src="/images/river-atlas.png" />
            <span>GOOD NIGHTS. BETTER MEMORIES.</span>
          </div>
          <div className="polaroid little-polaroid">
            <Photo src="/images/neon-social.png" />
          </div>
          <Star className="star star-blue" />
          <Star className="star star-coral" />
          <div className="ticket-sticker">
            <span>ADMIT ONE</span>
            <strong>
              ENCORE
              <br />
              LIVE
            </strong>
            <span className="barcode" />
          </div>
          <span className="collage-note">see you in the crowd ♡</span>
        </div>
      </section>
      <div className="marquee" aria-hidden="true">
        {/* Two identical groups slide left together, so the loop is seamless */}
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div className="marquee-group" key={copy}>
              {[
                ...MARQUEE_WORDS,
                ...MARQUEE_WORDS,
                ...MARQUEE_WORDS,
                ...MARQUEE_WORDS,
              ].map((word, i) => (
                <Fragment key={i}>
                  <span>{word}</span>✳
                </Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
      <Discover events={JSON.parse(JSON.stringify(events))} />
      <section className="community section-wrap">
        <div className="community-art">
          <Photo src="/images/sunday-theory.png" />
          <span className="community-sticker">
            PASS THE TICKET.
            <br />
            KEEP THE ENERGY.
          </span>
        </div>
        <div>
          <span className="eyebrow">FROM ONE FAN TO ANOTHER</span>
          <h2>
            Plans change.
            <br />
            The show goes on.
          </h2>
          <p>
            Can’t make it? Give another fan their night to remember. Apply to
            sell, list within the price cap, and pass the good vibes on.
          </p>
          <Link className="button" href="/sell">
            Sell a ticket <Icon />
          </Link>
        </div>
        <Star className="community-star" />
      </section>
      <section className="values section-wrap">
        <div>
          <Icon name="ticket" />
          <h3>Prices with boundaries.</h3>
          <p>Every listing follows an event price cap set by our admins.</p>
        </div>
        <div>
          <Icon name="users" />
          <h3>People behind the tickets.</h3>
          <p>Sellers need admin approval before publishing a listing.</p>
        </div>
        <div>
          <Icon name="flag" />
          <h3>Something feel off?</h3>
          <p>Report a purchased ticket for our admins to review.</p>
        </div>
      </section>
    </>
  );
}
