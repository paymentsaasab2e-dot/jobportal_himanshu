# Duplication Check Engine

Contextual duplicate / conflict checks — **no full-DB scans**. Each page or profile section only runs the rules that belong there.

## How it works

| Context | What is checked | Scope |
|---------|-----------------|-------|
| `auth.signup` | Email + mobile already owned by another account | Cross-user (indexed lookup) |
| `auth.login` | No uniqueness probe — normal login APIs only | Existence / password verify |
| `profile.basic` | Email + mobile changed to someone else’s | Cross-user, excludes self |
| `profile.skills` | Same skill name already on your list | Within your profile |
| `profile.education` | Same school + degree + years | Within your profile |
| `profile.experience` | Same title + company + dates | Within your profile |
| `profile.portfolio` | Same URL already saved | Within your profile |

**Not unique across users:** display name, first/last name, city, job titles, education school names alone.  
**Passwords:** never checked for uniqueness across users (by design). Login only verifies the password for that account.

## Backend

`POST /api/auth/check-credential`

```json
{ "type": "email"|"phone", "value": "...", "countryCode": "+91", "excludeCandidateId": "...", "intent": "signup"|"profile" }
```

Uses `findFirst` / unique `whatsappNumber` index — not a table dump.

## Frontend

- `src/lib/duplication-check/` — engine, normalize, API client, alerts  
- Wired: WhatsApp signup, Basic Info, Skills, Education, Work Experience, Portfolio  
- Alerts via toast (`showErrorToast` / `showWarningToast`)

## User alerts (examples)

- “This email is already used by another account…”
- “This mobile number is already used by another account…”
- “React is already on your skills list.”
- “This education entry looks the same as one you already saved…”
- “This work experience looks the same as one you already saved…”
- “This link is already in your portfolio.”
