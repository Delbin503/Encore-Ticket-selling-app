# Fan Club design implementation

Audience: young concert fans discovering resale tickets in Bangkok.
Tone: energetic, welcoming and expressive.
Layout: asymmetric collage hero, search and genre chips, three-column poster cards; role workspaces use a sidebar, statistics and structured tables.
Typography: DM Sans with heavy tight headlines; Space Grotesk for artist titles and numerical highlights; local sans-serif fallbacks.
Palette: butter #FFF2A9, cobalt #1929D5, coral #F86652, warm paper #FFFDF4.
Motion: small card/button hover shifts; disabled when reduced motion is requested.
Signature: polaroid concert collage with star stickers and a perforated Encore Live ticket.
No external component inspiration was used; implementation follows the selected concept mockup.

## Original concept artwork (retained for provenance)

Built-in image_gen tool, saved as `public/images/music.png`. This source was used in the initial build. The six separate concert portraits documented below replace it in the current interface.

Final generation prompt:

> Create a high-quality editorial music photography triptych as a single wide landscape image, three equal vertical panels edge to edge. Left panel: candid young Asian indie singer with dark curly hair singing into a microphone on stage, electric cobalt and warm peach stage lighting, stylish white t-shirt, film grain, medium close-up, authentic live music photography. Middle panel: joyful crowd at a concert, hands raised, coral and yellow lights, atmospheric wide shot. Right panel: young Asian alternative pop singer with long dark hair, red stage light, profile at microphone, editorial music portrait. Energetic, warm, Gen Z independent music magazine art direction. No text, no logos, no UI, no frames, no watermarks. Intended as three crop-ready photographs for a playful butter-yellow and cobalt concert ticket app.

## Individual concert artwork and carousel update

The concert strip now uses four complete cards on desktop, three on smaller laptops/tablets, two on larger phones/tablets, and swipeable wide cards on narrow phones. Previous/next buttons are keyboard accessible, disabled at the ends, and respect reduced motion. Search and genre changes reset the carousel position.

The original triptych has been replaced on concert cards by six separately generated portraits. All photo containers now use proportional `background-size: cover` instead of stretched dimensions. Each concert keeps the same image on its card, details page and purchased ticket.

Built-in image_gen prompt set (one independent generation per asset, no input images):

Shared specification: individual portrait concert photograph for Encore, a Gen Z ticket resale app; portrait 4:5 composition; natural human proportions, realistic undistorted anatomy and instruments; professional editorial music photography with subtle film grain; one continuous photograph; no collage, panels, borders, text, logos or watermark; faces kept inside the frame for responsive crops; fictional musicians rather than recognizable celebrities.

- `public/images/lena-ray.png`: fictional young Asian female pop singer with a short dark bob and silver outfit, handheld microphone, magenta and rose lighting, midnight pop show, candid medium-wide framing with full head and upper body, subtle crowd foreground.
- `public/images/monday-kids.png`: fictional three-person young indie band, Asian female bassist, male vocalist in blue denim and drummer, turquoise and amber lighting, independent festival mood, visible instruments and breathing room.
- `public/images/river-atlas.png`: fictional young Black male alternative rock guitarist with braided hair and a red guitar, smoky stage, burnt-orange spotlights and backlight, candid medium-wide framing with full head, torso and guitar.
- `public/images/mira-sol.png`: fictional young Southeast Asian female R&B singer, long wavy hair and flowing lavender outfit, standing microphone, soulful expression, lilac and indigo lighting and haze, generous framing.
- `public/images/neon-social.png`: electronic duo behind a synthesizer and DJ desk, neon lime and blue lasers, euphoric crowd foreground, geometric lighting and festival atmosphere.
- `public/images/sunday-theory.png`: fictional acoustic indie duo, Asian male singer in cream and female guitarist in sage green, intimate garden stage at golden hour, peach and soft-green tones, vintage indie magazine mood.

## View zone / seating schematic

A `View zone` action beside `Pick your ticket` opens a responsive, keyboard-accessible dialog. The schematic shows a stage and zone groups derived solely from the concert's available resale listings. Each seat button shows its label and price; a selected seat also shows seller details. `Use this ticket` transfers that listing into the existing checkout selection. Reopening the dialog retains the selected ticket.

This is deliberately labelled an illustrative schematic, because the app has no authoritative venue geometry or complete seat inventory. It does not invent additional seats or claim to be an official venue plan. Server-side purchase validation remains authoritative if a listing is sold after the page loads.
