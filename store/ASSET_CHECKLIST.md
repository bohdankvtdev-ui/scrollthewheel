# Store assets checklist

Use copy from `store/metadata/en-US.json` in Google Play Console and App Store Connect.

## Required before submission

| Asset | Google Play | App Store | Suggested path |
|-------|-------------|-----------|----------------|
| App icon 512×512 | Yes | Via build | `assets/images/logow.png` → export 1024 master |
| Feature graphic 1024×500 | Yes | N/A | `store/assets/feature-graphic.png` (create) |
| Phone screenshots 16:9 | Yes (min 2) | Yes (6.7") | `store/screenshots/phone/` |
| Tablet screenshots | Recommended | Yes (iPad) | `store/screenshots/tablet/` |
| Privacy policy URL | Yes | Yes | `https://scrollthewheel.bohdanium.com/privacy` |
| Short description | Yes (80) | N/A | metadata JSON |
| Full description | Yes | Yes | metadata JSON |
| Subtitle | N/A | Yes (30) | metadata JSON |
| Keywords | N/A | Yes (100) | metadata JSON |
| Content rating questionnaire | Yes | Yes | Simulated gambling, no real money |

## Icon export sizes

- **iOS**: 1024×1024 PNG, no alpha, no rounded corners (Apple applies mask)
- **Android adaptive**: foreground 432×432 safe zone in 512×512; background `#6D28D9`
- **Play Store**: 512×512 hi-res icon

## Screenshot overlay text (from metadata)

1. **Spin nine wheels. Build your bank.** — Roguelike money run from $0  
2. **Shop perks & forge wedges** — Spend chips between spins  
3. **Clear the boss. Survive the cycle.** — Hit $0 — run over  

Capture on iPhone 15 Pro Max and iPad Pro 12.9" simulators after `eas build` dev client.
