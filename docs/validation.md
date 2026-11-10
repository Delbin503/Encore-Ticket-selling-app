# Verification

Verified locally on 10 November 2026 against the production Next.js build with an isolated MariaDB database.

- `npm run build`: passed.
- `npm run lint`: passed with no warnings.
- `npm test`: 11 passing API checks (one parent and ten subtests), with temporary database fixtures cleaned up.
- `CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:browser`: passed in headless Chrome.
- UI checks: buyer/seller/admin sign-in, search and genre filters, listing creation/editing/cancellation (including decimal prices), keyboard modal dismissal, and simulated purchase through visible controls.
- Desktop (1440px) and mobile (390px) checks: no detected document horizontal overflow on tested pages. Dashboard tables intentionally scroll inside their own containers.
- Axe WCAG 2 A/AA and WCAG 2.1 AA scans: no detected violations on the tested home, concert details, buyer tickets, seller studio, admin overview, handover dialog and price-cap dialog views. Automated scans are not a complete accessibility certification.
- No browser page errors during the UI run.
- Final visual review covered the desktop home, mobile home, buyer tickets, seller studio, desktop admin and mobile admin screens. A mobile decorative overlap and inconsistent order artwork were corrected, then targeted mobile scans and screenshots were refreshed.

The existing `06_auth_mysql` Git working tree remained clean. No deployment or online slide submission was performed.

## Carousel and artwork revision

- Production build and lint pass after the revision.
- Six independent PNG assets have six distinct SHA-256 hashes; all six demo event records point to distinct image URLs.
- Browser checks assert exactly four complete cards inside the desktop carousel frame, exercise next/previous controls, and confirm each image uses proportional cover cropping.
- Desktop and narrow-phone carousel screenshots are saved as `screenshots/carousel-desktop.png` and `screenshots/carousel-mobile.png`.
- Existing browser checkout check now waits for streamed ticket content after the route changes, preventing an assertion against the temporary loading screen.
