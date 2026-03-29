# Flappy Drone — Analytics Webhook Templates

## Option A: Google Apps Script → Google Sheets

Create a Google Sheet, then Extensions → Apps Script, paste this:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  // Auto-create headers on first row if empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp', 'event', 'score', 'best', 'drone', 'mode']);
  }

  sheet.appendRow([
    data.ts || new Date().toISOString(),
    data.event || '',
    data.score || '',
    data.best || '',
    data.drone || '',
    data.mode || ''
  ]);

  return ContentService.createTextOutput('ok');
}
```

Deploy: Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
Copy the URL → paste into `window.__FD_WEBHOOK` in index.html.

### Sheet formulas for analysis

```
=COUNTIF(B:B,"game_over")                          // total games
=AVERAGEIF(B:B,"game_over",C:C)                    // avg score
=AVERAGEIFS(C:C,B:B,"game_over",E:E,"quad")        // avg score per drone
=MAXIFS(C:C,B:B,"game_over",E:E,"stealth")         // best score per drone
=COUNTIFS(B:B,"game_start",E:E,"quad")/COUNTIF(B:B,"game_start")  // drone pick rate
```

---

## Option B: Power Automate → Teams

1. Create a Power Automate flow: "Automated cloud flow"
2. Trigger: "When an HTTP request is received"
3. Request body JSON schema:
```json
{
  "type": "object",
  "properties": {
    "event": { "type": "string" },
    "ts": { "type": "string" },
    "score": { "type": "number" },
    "best": { "type": "number" },
    "drone": { "type": "string" },
    "mode": { "type": "string" }
  }
}
```
4. Add action: "Post message in a chat or channel" (Teams)
5. Message format:
```
🎮 Flappy Drone: @{triggerBody()?['event']}
Score: @{triggerBody()?['score']} | Drone: @{triggerBody()?['drone']} | Mode: @{triggerBody()?['mode']}
```
6. Copy the HTTP POST URL → paste into `window.__FD_WEBHOOK` in index.html.

---

## Option C: Discord Webhook

1. Server Settings → Integrations → Webhooks → New Webhook
2. Copy URL → use as `window.__FD_WEBHOOK`

Note: Discord expects `{ content: "text" }` format, so you'd need a small
proxy or Power Automate step to reformat. Easiest path is Option A or B.

---

## How it works

`trackEvent()` in index.html dual-fires:
- GA4 via `gtag()` (if loaded — blocked by ad blockers)
- Webhook via `navigator.sendBeacon()` (survives ad blockers, page closes, tab switches)

Both are fire-and-forget. Neither blocks gameplay. If the webhook isn't set, only GA4 fires (original behaviour).
