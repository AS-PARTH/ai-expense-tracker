# AI Auto-Fill — Test Plan

A focused test playbook for the **core PDF feature** (Section 3 of the brief).
Tests are copy-paste ready. Run them on `/expenses` → click **+ Add expense**
→ paste into the **AI auto-fill** textarea → click **Auto-fill with AI**.

The goal isn't 100% accuracy — LLMs are probabilistic. The goal is:
1. Every PDF requirement is exercised
2. The flow degrades gracefully on every failure mode
3. User-side controls always work (review-and-confirm before save)

---

## Quick Reference: What to Look For

| Field | Expected behavior |
|---|---|
| **Amount** | Numeric, positive, no currency symbols. If multiple amounts, picks the total. |
| **Category** | From the user's available list (defaults + custom). Falls back to `other` if uncertain. |
| **Date** | `YYYY-MM-DD`. Resolves relative phrases ("yesterday", "23 Apr") to absolute. Defaults to today if absent. |
| **Confidence** | `high` / `medium` / `low` — shown in the hint line below the AI button |
| **Toast** | Success: "Form auto-filled - please review". Nothing extracted: "Nothing extracted - fill manually" |

---

## Section A — Happy Paths (must pass)

These are the cases the PDF explicitly mentions. They should produce all three
fields with `high` or `medium` confidence.

| # | Paste this | Expected amount | Expected category | Expected date | Confidence |
|---|---|---|---|---|---|
| A1 | `Dominos pizza 850 yesterday` | `850` | `food` | yesterday's date | `high` |
| A2 | `Uber to airport on 23 Apr, paid Rs 450` | `450` | `transport` | `<current-year>-04-23` | `high` |
| A3 | `Electricity bill 2340 on 5 Nov` | `2340` | `bills` | `<current-year>-11-05` | `high` |
| A4 | `Bought shirt from Zara for ₹1299 today` | `1299` | `shopping` | today | `high` |
| A5 | `PVR movie ticket 350 on 12 May` | `350` | `entertainment` | `<current-year>-05-12` | `high` |
| A6 | `Apollo pharmacy meds 480 today` | `480` | `health` | today | `high` |

**Pass criteria:** all three fields populated, no toast errors, "Add expense" button works after AI fills.

---

## Section B — Real-World Messy Formats

The PDF says "bill, SMS, or receipt." These are the actual shapes such text takes
in production.

### B1 — Indian bank SMS (typical UPI debit)
```
INR 1,250.00 debited from your A/c XX1234 on 15-NOV-26 at SWIGGY.
Avl bal 12,345.67
```
**Expected:** amount `1250` (NOT `12345.67`), category `food`, date `2026-11-15`.
**Why this matters:** the model must pick the transaction amount, not the
balance. Tests the "pick the total" prompt rule.

### B2 — E-commerce delivery notification
```
Your Amazon order Rs 2999 delivered on Wed, 12 May
```
**Expected:** `2999`, `shopping`, `<current-year>-05-12`.

### B3 — Card swipe with merchant code
```
BIG BAZAAR T2 PAYMENT 1840 RS UPI Ref 4892
```
**Expected:** `1840`, `shopping` (or your custom `groceries` if you've added it), today.

### B4 — Recurring bill payment
```
Sent Rs.500.00 to BHARTI AIRTEL on 03-Jun-26
```
**Expected:** `500`, `bills`, `2026-06-03`.

### B5 — Airline booking confirmation
```
INDIGO 6E-205 BLR-DEL 4250 INR
```
**Expected:** `4250`, `transport`, today.

### B6 — Multi-line receipt (CRITICAL — tests "pick total" rule)
```
Cafe Coffee Day
Cappuccino 220
Sandwich 180
Total: 400
Date: 14 Mar 2026
```
**Expected:** amount `400` (the total — NOT `220` or `180`), category `food`,
date `2026-03-14`. **This is the highest-value test in this section.** If the
model picks an item amount instead of the total, the prompt has a regression.

---

## Section C — Edge Cases (must not crash)

These verify graceful degradation. The form should never break and the user
should always be able to fix things manually.

| # | Paste this | Expected |
|---|---|---|
| C1 | (empty textarea, click button) | Toast: "Paste some text first". No API call. |
| C2 | `     ` (only whitespace) | Same as C1 |
| C3 | `hello how are you` (no expense info) | Either: nothing populated **OR** confidence=`low`, fields may be null. **Must not crash.** Toast: "Nothing extracted - fill manually" |
| C4 | `pizza` (only category info) | Category fills as `food`. Amount/date may be null or defaults. Confidence: `low` or `medium`. |
| C5 | `paid 200 to a friend last week` | Amount=`200`, category=`other`, date≈7 days ago. Confidence: `medium`. |
| C6 | (paste 1500 chars of lorem ipsum) | Does not crash. Likely returns confidence=`low` with no fields. |
| C7 | `Café — ₹1,200 (incl. GST) — 10/12/26` | `1200`, `food`, `2026-12-10`. Comma + currency + parens stripped correctly. |
| C8 | `Coffee 125.50 today` | Amount=`125.5` (NOT `12550` — decimal must survive cleanup) |
| C9 | `Bought book $25 on Amazon today` | Amount=`25`, category=`shopping`. (No FX conversion is by design.) |

---

## Section D — Date Parsing

Critical because dates are the easiest field to get wrong. Run on different
days to ensure no hardcoded year/month in the prompt.

| # | Paste this | Expected date | Notes |
|---|---|---|---|
| D1 | `groceries 500 today` | today's date | |
| D2 | `groceries 500 yesterday` | today − 1 day | |
| D3 | `groceries 500 last Monday` | most recent Monday before today | |
| D4 | `groceries 500 on 5th` | 5th of current month | |
| D5 | `groceries 500 on Dec 25` | Dec 25 of current year | |
| D6 | `groceries 500` (no date) | today's date | Per our prompt's explicit rule |
| D7 | `groceries 500 on 31/02/2026` (invalid date) | today's date **or** null | Must not crash; `coerceDate` filters invalid dates |

---

## Section E — Custom Category Integration

This is the highest-impact feature beyond the PDF baseline. The AI prompt is
**built dynamically** including the user's custom categories on every call.

### Setup
1. Go to **Budgets** page
2. Click **+ Add category**
3. Add `groceries`
4. Click **+ Add category** again
5. Add `coffee`
6. Go back to **Expenses → + Add expense**

### E1 — Custom category wins over default
**Paste:** `Bought rice and dal for 800 today`
**Expected:** category = `groceries` (not `food` or `other`)
**Why:** The prompt now lists `groceries` as an available option, and "rice and dal" semantically maps to it.

### E2 — Specific custom over generic
**Paste:** `Starbucks latte 300`
**Expected:** category = `coffee` (not `food`)
**Why:** Tests that the model prefers the most specific available category.

### E3 — Falls back to `other` if no match
**Paste:** `Paid 5000 for plumbing fix`
**Expected:** category = `other` (none of the categories — default or custom — fit "plumbing")
**Why:** Verifies the "if nothing fits use other" rule from the prompt.

---

## Section F — Failure Modes (graceful degradation)

These verify the "graceful fallback if API fails" requirement from the PDF
evaluation criteria.

### F1 — API key removed
1. Edit `.env.local`, comment out or delete the `GROQ_API_KEY` line
2. Restart dev server
3. Try Auto-fill on any text

**Expected:**
- No crash
- Response: `{amount:null, category:null, date:null, confidence:'low'}`
- Toast: "Nothing extracted - fill manually"
- Form stays editable, user can fill manually and save

Restore the key after this test.

### F2 — Invalid API key
1. Change `GROQ_API_KEY=...` to `GROQ_API_KEY=gsk_invalid`
2. Restart dev server
3. Try Auto-fill on `Dominos pizza 850 yesterday`

**Expected:**
- Server logs `[ai/extract] Groq error 401 ...`
- API still returns `200 OK` with the fallback shape
- Toast: "Nothing extracted - fill manually"
- **No 500 response, no React crash.**

Restore the key after this test.

### F3 — Network offline
1. Disconnect Wi-Fi briefly
2. Try Auto-fill on any text

**Expected:**
- Server catches the fetch error
- Returns fallback shape
- UI behaves identically to F1/F2

### F4 — Model returns malformed JSON
*Cannot easily simulate without modifying code* — but the route handles this case via:
- `response_format: { type: 'json_object' }` (Groq enforces JSON)
- `extractJsonObject()` strips ```` ```json ```` fences if present
- `JSON.parse` inside try/catch → returns fallback on failure

---

## Section G — Review & Confirm (PDF requirement)

PDF: *"User can review and confirm before saving"*

| # | Steps | Expected |
|---|---|---|
| G1 | After AI fills the form, change the amount manually before clicking Add | Saved value = the edited amount, not AI's amount |
| G2 | After AI fills with wrong category, change it via the dropdown | Saved category = the changed one |
| G3 | Click Auto-fill on text A → then click Auto-fill on text B | Form re-populates each time. No leftover state from previous run. |
| G4 | Click Auto-fill, then click **Cancel** (X) | Form closes, nothing saved |
| G5 | AI populates date as `2026-04-23` → user changes it to `2026-04-24` → clicks Add | Saved date = `2026-04-24` |

**These five tests are explicit verification of the "review and confirm"
requirement.** Any failure here is a PDF compliance break.

---

## Section H — Suggested 5-Minute Smoke Test

If you have only 5 minutes to verify the AI feature works end-to-end:

1. **A1** — `Dominos pizza 850 yesterday` (baseline)
2. **B1** — The Swiggy SMS (realistic use case)
3. **B6** — Multi-line CCD receipt (proves "pick total" rule)
4. **D6** — `groceries 500` with no date (fills today)
5. **E1** — Custom category integration (after adding `groceries`)
6. **C3** — `hello how are you` (graceful no-extract)
7. **G1** — Change AI-filled amount before saving (review-and-confirm)

If all 7 pass, the feature satisfies every PDF requirement plus the bonus
custom-category integration.

---

## Manual cURL Sanity Check

Quick test that the endpoint itself works (replace `<TOKEN>` with a real JWT
from `localStorage` after login, or from the `token` cookie):

```bash
curl -X POST http://localhost:3000/api/ai/extract \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"text":"Uber to airport on 23 Apr, paid Rs 450"}'
```

Expected response:
```json
{
  "ok": true,
  "data": {
    "amount": 450,
    "category": "transport",
    "date": "2026-04-23",
    "confidence": "high",
    "raw": "Uber to airport on 23 Apr, paid Rs 450"
  }
}
```

---

## Known Quirks

- **Foreign currency**: We deliberately don't convert. `$25` becomes `25`. The user can correct before saving.
- **Very large amounts**: Above `999999.99`, the prompt may strip commas inconsistently. Edge case; user can correct.
- **Past years**: If the input is just `5 Nov`, the model assumes current year. To input a 2024 expense, type the full date `5 Nov 2024`.
- **Ambiguous dates**: `12/05/26` — depending on context, the model may interpret as DD/MM or MM/DD. Tests B2, D5 use unambiguous formats.

These quirks are documented and expected. The review-and-confirm step exists
precisely because LLMs are probabilistic.
