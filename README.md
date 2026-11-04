# Cartify Mobile

Android and iOS app for Cartify, built with **React Native + Expo (SDK 58)** and TypeScript.
It uses the existing Cartify backend (`../cartify-backend-mqtt-main`) and follows the
"Cartify Mobile App" Figma file.

## Stack

| Concern | Choice |
|---|---|
| Navigation | Expo Router (file-based, `src/app`) with a custom floating pill tab bar |
| Server data | TanStack Query (`src/hooks/queries.ts`) over a small `fetch` client (`src/api`) |
| Session | React Context (`src/providers/AuthProvider.tsx`) |
| Forms / validation | react-hook-form + zod (rules mirror the backend's express-validator rules) |
| Secure storage | expo-secure-store (JWT + guest session id, in Keychain / Keystore) |
| UI | Space Grotesk, lucide icons, expo-image, expo-linear-gradient |
| Smart returns | react-native-maps, expo-location, react-native-qrcode-svg, view-shot + expo-sharing |

## Project layout

```
src/
  app/            routes (screens). (tabs)/ = Home, Shop, Returns, Cart, Me
  api/            fetch client, endpoints, backend types
  components/     shared UI (Text, Button, TextField, Screen, ProductCard, states…)
  features/       screen-specific helpers (auth, browse, orders, returns)
  hooks/          React Query hooks + cache keys
  lib/            secure session storage, formatting helpers
  providers/      Auth + Toast
  theme.ts        design tokens taken from Figma variables
```

## Prerequisites

- Node 18+ (tested with Node 24)
- The backend running (see below)
- For Android: Android Studio emulator **or** a phone with **Expo Go**
- For iOS: an iPhone with **Expo Go** (no Mac needed for development). A Mac + Xcode is only
  needed for the iOS Simulator or local iOS builds; cloud builds work from Windows.

## Run in development

1. Start the backend:

   ```bash
   cd ../cartify-backend-mqtt-main/cartify-backend-mqtt-main
   npm install
   npm run dev
   ```

2. Start the app:

   ```bash
   cd cartify-mobile
   npm install
   npx expo start
   ```

   Then press `a` for the Android emulator, or scan the QR code with Expo Go (Android) / the
   Camera app (iOS). The phone must be on the same Wi-Fi as the computer.

The app finds the backend automatically at `http://<computer IP>:3001`. Set
`EXPO_PUBLIC_API_URL` in `.env.local` (see `.env.example`) to point somewhere else.
Allow port 3001 through the Windows firewall if a physical phone can't connect.

### Sign-in codes in development

Customers sign in with a 6-digit email code (`POST /users/otp/request`, `/users/otp/verify`).
If the backend can't send email (no Gmail app password configured) and `NODE_ENV` isn't
`production`, the code is printed in the backend console:
`🔑  [dev] OTP for you@example.com: 123456`.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `.env.local` / `eas.json` | Backend base URL. Optional in development. Must be HTTPS for store builds. |

Nothing secret lives in the app. All `EXPO_PUBLIC_*` values are bundled into the binary.

## Checks

```bash
npm run typecheck
npx expo-doctor
```

## Builds (Expo Application Services)

One-time setup: `npx eas-cli@latest login`, then `npx eas-cli@latest build:configure`.

```bash
# Android APK for testers (internal distribution)
npx eas-cli@latest build --profile preview --platform android

# Store builds (AAB for Google Play, IPA for the App Store)
npx eas-cli@latest build --profile production --platform android
npx eas-cli@latest build --profile production --platform ios

# Submit to the stores
npx eas-cli@latest submit --platform android
npx eas-cli@latest submit --platform ios
```

- iOS builds need a paid Apple Developer account. EAS creates the certificates and profiles.
- Android store builds need a Google Play Console account. EAS generates the upload keystore.
- `preview` and `production` point to `https://cartify-backend-mqtt.vercel.app`. That deployment must
  include the backend changes listed below (OTP login, `/lockers`, `X-Session-Id`) before you use it.
- **Google Maps on Android**: the SmartBox map works in Expo Go, but a standalone Android build
  needs a Google Maps API key ("Maps SDK for Android") in `app.json` under
  `android.config.googleMaps.apiKey`. iOS uses Apple Maps and needs no key.
- Local native builds (`npx expo run:android`) also work with Android Studio installed.

## Backend changes made for the app (backward compatible)

- `POST /users/otp/request` and `POST /users/otp/verify`: passwordless email-code sign-in
  (codes hashed, 10 min TTL, 5 attempts, rate limited).
- `POST /users/auth` now requires the correct password for **admin** accounts (before, anyone
  who typed the admin email got an admin token). Customer behaviour on the web is unchanged.
- Auth reads `Authorization: Bearer` before the cookie. The guest session is also accepted from
  the `X-Session-Id` header and returned in a response header for new guests.
- `GET /lockers` (public) plus admin `POST/PATCH/DELETE /lockers`: SmartBox locations.
  The 3 seeded lockers are **samples** named after the design. Replace them with the real boxes.
- `validateLockerCode` compared a string to a number and always failed. It now compares strings
  and also accepts yesterday's code.
- `POST /returns` now checks that the order belongs to the caller (account or guest session);
  before, anyone could open a return on any order id. It also flags every returned item on the
  order as `isRefundRequested`, not only the first.
- Free SmartBox drop-off check: every box photo is checked with the box weight and a local CLIP
  image model (no API cost). The result shows on the return screen ("Item verified by the
  SmartBox" or "sent for manual review") and in the admin Camera Sessions page.
- Signing in now also moves the guest's return requests into the account (orders, cart and
  wishlist were already merged).

Backend files touched: `index.js`, `db/seeder.js`, `db/models/otp.model.js` (new),
`db/models/locker.model.js` (new), `src/middleware/{auth,session,validation,cameraRateLimit}.js`,
`src/utils/{email,lockerCode}.js`, `src/modules/user/*`, `src/modules/return/return.controller.js`,
`src/modules/locker/*` (new).

## Known limitations

These parts of the Figma design have no backend support yet, so the app hides them or shows
them as "Coming soon". None of them is faked:

- Cartify Wallet, refund amounts, saved cards and online payment (Cash on delivery only)
- Courier pickup returns and Express shipping
- Promo codes, sub-categories, "Popular"/trending data, and the courier name/ETA on tracking
- Push notifications. The Notifications screen is an in-app feed built from order and return status history.
- Google / Apple sign-in, and password-based login for customers (email code instead)
- Arabic / RTL. The web app and the design are English only.

Onboarding slides 2–3 use copy written for their illustrations, because the Figma text layers
are placeholders.
