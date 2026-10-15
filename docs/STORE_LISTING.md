# Chrome Web Store listing – Calendar sync for Novakid (unofficial)

## Store listing tab

**Name** (from `_locales/*/messages.json`):
- EN: Calendar sync for Novakid (unofficial)
- PL: Synchronizacja kalendarza dla Novakid (nieoficjalna)

**Summary** (≤132 characters – taken from `extDescription`):
- EN: Adds your children's Novakid lessons to Google Calendar, e.g. the shared Family calendar. Not affiliated with Novakid.

**Category:** Productivity (alternative: Education) · **Language:** English, Polish

**Description (EN):**

> Keep the whole family up to date with your kids' Novakid English lessons.
>
> This extension reads the upcoming lesson schedule of all your children from your Novakid
> parent account and adds each lesson to the Google Calendar you choose – for example the
> shared Family calendar, so everyone in the family sees when each child has a lesson.
>
> • Works for all your children at once; every event shows the child's name, the lesson and the teacher
> • Re-sync any time: lessons are updated in place, never duplicated
> • Cancelled or moved lessons are removed from the calendar on the next sync
> • No Google account connection needed if you prefer: download an .ics file and import it
> • Private by design: no developer servers, no analytics; data stays in your browser and your calendar
>
> How to use: open your Novakid schedule while logged in, click the extension icon, connect
> Google, pick a calendar and click "Add / update in calendar".
>
> This is an independent, unofficial tool. It is not affiliated with, endorsed by, or supported
> by Novakid. "Novakid" is a trademark of its respective owner.

**Description (PL):**

> Cała rodzina zawsze wie, kiedy dzieci mają lekcje angielskiego w Novakid.
>
> Rozszerzenie odczytuje harmonogram nadchodzących lekcji wszystkich Twoich dzieci z konta
> rodzica w Novakid i dodaje każdą lekcję do wybranego Kalendarza Google – np. do wspólnego
> kalendarza Rodzina, dzięki czemu wszyscy domownicy widzą, kiedy które dziecko ma zajęcia.
>
> • Obsługuje wszystkie dzieci naraz; wydarzenie zawiera imię dziecka, temat lekcji i nauczyciela
> • Synchronizuj w dowolnym momencie – lekcje są aktualizowane, nigdy nie dublowane
> • Odwołane lub przeniesione lekcje znikają z kalendarza przy następnej synchronizacji
> • Bez łączenia z Google: pobierz plik .ics i zaimportuj go do kalendarza
> • Prywatność: brak serwerów autora i analityki; dane zostają w przeglądarce i w Twoim kalendarzu
>
> Narzędzie nieoficjalne, niepowiązane z Novakid i przez nie niewspierane.
> „Novakid” jest znakiem towarowym jego właściciela.

**Graphics you still need to make:**
- Icon 128×128: `icons/128.png` ✓
- At least 1 screenshot, 1280×800 or 640×400 (popup over the Novakid schedule, and the
  resulting events in Google Calendar). Blur real children's/teachers' names or use a test account.
- Small promo tile 440×280 (optional but recommended).

## Privacy practices tab

**Single purpose:**
> Copies the user's children's scheduled Novakid lessons into a Google Calendar chosen by the user.

**Permission justifications:**
- `storage` – Keeps the list of upcoming lessons, the children's names and the chosen calendar ID
  on the device, so the popup can show and sync them.
- `identity` – Signs the user in to Google with Chrome's built-in OAuth to create, update and
  delete lesson events in the calendar the user selects.
- Content scripts on `https://school.novakidschool.com/*` – Reads the user's own children and
  lesson schedule from the Novakid parent pages the user has open. No other site is accessed.

**Remote code:** No, I am not using remote code. (All JavaScript is in the package; the only
network calls are data requests to Novakid and the Google Calendar REST API.)

**Data usage – check these boxes:**
- ☑ Personally identifiable information (children's first names, teacher names)
- ☑ Website content (lesson schedule read from school.novakidschool.com)
- ☐ everything else (health, financial, authentication info, personal communications,
  location, web history, user activity) – not collected

**Certify all three:**
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases
- ☑ I do not use or transfer user data for purposes unrelated to my item's single purpose
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** the public URL where you host `docs/PRIVACY.md` (see README).

## Google OAuth verification (Google Cloud console → Google Auth Platform)

Both scopes are "sensitive", so the app must be verified before it can leave Testing mode
(up to 100 manually added test users until then).

- **App name / logo:** same as the store listing (no Novakid logo).
- **App home page:** e.g. your GitHub Pages site or the Chrome Web Store listing URL.
- **Privacy policy link:** same URL as above, on a domain you have verified in Google Search Console.
- **Authorized domain:** the domain of the home page / privacy policy.
- **Scope justification:**
  - `calendar.events` – "Creates, updates and deletes one event per scheduled Novakid lesson in
    the calendar the user selects, so the lessons appear in the user's (or their family's) calendar.
    Events the extension did not create are never read or modified."
  - `calendar.calendarlist.readonly` – "Lists the user's writable calendars so the user can pick
    which calendar (e.g. the Family calendar) receives the lesson events."
- **Demo video** (unlisted YouTube, ~2 min), show:
  1. Installing the extension, opening the Novakid schedule.
  2. Clicking "Connect Google" – the full consent screen, with the browser address bar showing the client ID.
  3. Picking the calendar and syncing; the events appearing in Google Calendar.
  4. "Forget stored data" and revoking access at myaccount.google.com/permissions.
