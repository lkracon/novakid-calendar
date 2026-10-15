# Privacy Policy – Calendar sync for Novakid (unofficial)

_Effective date: 15 October 2026_

"Calendar sync for Novakid" (the "Extension") is an unofficial browser extension that copies
your children's scheduled Novakid lessons into a Google Calendar you choose. It is not
affiliated with, endorsed by, or operated by Novakid.

**In short:** the Extension has no servers of its own. Your data stays in your browser,
except for the calendar events you choose to create in your own Google Calendar.

## What data the Extension handles

| Data | Source | Why | Where it goes |
|---|---|---|---|
| Your children's first names and Novakid student IDs | Novakid (your logged-in account) | To label each calendar event with the right child | Stored locally in your browser; written into event titles/descriptions in your Google Calendar |
| Lesson date, time, duration, lesson name/code, teacher name, lesson status | Novakid | To create, update and remove calendar events | Stored locally; written into your Google Calendar |
| Your Novakid parent user ID and the request headers the Novakid website uses | The Novakid page you have open | To request your own schedule from Novakid on your behalf | Kept in memory on the open Novakid page only; never stored; sent only to Novakid |
| List of your Google calendars (names and IDs) | Google Calendar API | To let you choose the calendar (e.g. "Family") | Shown in the Extension popup; only the chosen calendar's ID is stored locally |
| Google access token | Chrome sign-in (`chrome.identity`) | To call the Google Calendar API | Managed by Chrome; never stored by the Extension |

The Extension does **not** collect passwords, payment details, birth dates, browsing history,
location, or any data from websites other than `school.novakidschool.com`.

## How data is shared

- **Novakid:** while you have a Novakid page open, the Extension requests your children's list
  and upcoming lessons from Novakid's servers, the same way the Novakid website does, using your
  existing login. No other data is sent to Novakid.
- **Google:** when you click "Connect Google" and "Add / update in calendar", the Extension reads
  your calendar list and creates, updates or deletes lesson events in the calendar you choose.
  Anyone you share that calendar with (e.g. family members) can see those events.
- **No one else.** The developer has no server and receives none of your data. There are no
  analytics, tracking, ads, or third-party scripts. Data is never sold or transferred to third
  parties, and never used for advertising, creditworthiness, or lending purposes.

## Google API Services – Limited Use

The Extension's use and transfer of information received from Google APIs adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements. Google user data is used only to provide the
user-facing feature of adding Novakid lessons to your calendar, and is not read or stored by
any human or server operated by the developer.

## Children's data

The Extension is used by parents. It processes the first names of the parent's children only
to label calendar events, and only on the parent's own device and in the parent's own Google
Calendar. It does not create profiles of children or share their data with anyone.

## Retention and deletion

- Lessons are deleted from local storage automatically one day after they end.
- Click **"Forget stored data"** in the Extension popup to delete all locally stored data and
  sign out of Google within the Extension.
- Uninstalling the Extension deletes all of its local data.
- Calendar events already created stay in your Google Calendar until you delete them.
- You can revoke the Extension's Google access at any time at
  <https://myaccount.google.com/permissions>.

## Changes

If this policy changes, the new version will be published at this address with a new effective date.

## Contact

[YOUR NAME] – [YOUR CONTACT EMAIL]
