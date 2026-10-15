# Calendar sync for Novakid (unofficial)

Chrome extension that adds your children's Novakid lessons to a Google Calendar (e.g. the
shared Family calendar). Works for any Novakid parent account and any number of children.

## How it works
- `hook.js` (runs in the Novakid page) notes your parent user ID and the page's API auth
  headers, then fetches `/api/0/users/<id>/students/` and each child's
  `/classes?status=scheduled&status=ongoing&student_id=…` (following `offset` pages).
  At most once every 5 minutes, whenever a Novakid page is open.
- `novakid.js` + `bridge.js` keep only the needed fields in `chrome.storage.local`.
  A lesson missing from a child's complete list is marked removed.
- `popup.js` syncs to Google Calendar with stable event IDs (re-sync updates, never
  duplicates; removed/cancelled lessons get deleted) or exports an `.ics` file.

Novakid's API is undocumented. If they change it, `novakid.js` is the place to adapt.

## Develop / install locally
1. `chrome://extensions` → Developer mode → **Load unpacked** → this folder.
2. Create an OAuth client (Google Cloud console → enable Google Calendar API → Google Auth
   Platform → Clients → **Chrome Extension**, Item ID = the extension's ID) and put its client
   ID in `manifest.json` → `oauth2.client_id`. Add yourself as a test user under **Audience**.
3. Reload the extension, open https://school.novakidschool.com/parent/schedule, click the icon.

## Publish to the Chrome Web Store
1. Register at https://chrome.google.com/webstore/devconsole (one-time US$5 fee).
2. Host `docs/PRIVACY.md` publicly, e.g. GitHub Pages, and fill in the contact line at the end.
3. `./build.sh` → upload `dist/novakid-calendar-<version>.zip` as a new item (don't submit yet).
   The dashboard now shows the permanent **item ID**.
4. In Google Cloud, create a **Chrome Extension** OAuth client for that item ID and put its
   client ID in `manifest.json`. Optional: to give your unpacked dev copy the same ID, copy the
   public key from the dashboard (**Package → View public key**) into `manifest.json` as `"key"`.
   `build.sh` strips it from the upload.
5. Fill in the listing and privacy tabs from `docs/STORE_LISTING.md` (screenshots needed).
6. Bump `version`, run `./build.sh`, upload, and submit for review.
7. Google Auth Platform → **Verification Center**: submit the app for verification
   (`docs/STORE_LISTING.md` has the scope justifications and demo video outline). Until it's
   verified, only up to 100 test users you add by hand can connect Google; `.ics` export works for everyone.

## Before publishing, consider
- Novakid's terms of service regarding automated access to their API.
- Keep the "(unofficial)" naming and disclaimer, and don't use Novakid's logo.
