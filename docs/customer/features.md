# Waakye Plug — Customer App Changes

Every feature/change below lives in **`Waakye-Plug2`**. One section per change,
oldest first, so the whole history reads top-to-bottom.

---

## 1. Order pipeline (live orders via Supabase)

The app no longer simulates an order with a WhatsApp-style text — placing an
order now writes a real row to `orders` with status `awaiting_approval` and
tracks it live through `available → rider_assigned → picked_up → delivered`
(or `cancelled`).

- `lib/orders.ts` — `createOrder()` inserts a real order (customer, vendor,
  flat items array, total, delivery address, payment method, GPS pin).
- `ConfirmationScreen` — live status tracker driven by a Supabase realtime
  subscription on `orders`, with status-aware copy and cancel reason display.
- `MyOrdersScreen` — full order history read straight from Supabase.
- Cart lines intentionally use the same flat shape as `orders.items`, so
  checkout needs no data conversion.

## 2. Refresh persistence (the "forgets my location" bug)

Previously **everything** (chosen vendor, cart, dropoff pin) lived in React
state only — a page refresh kicked the user back to the "we need your
location" gate and emptied the basket.

- `context/VendorContext.tsx` — selected vendor id persisted to
  `localStorage["wp.selectedVendorId"]` and rehydrated once vendors load (only
  if that vendor is still listed/approved).
- `context/CartContext.tsx` — the whole cart draft (lines, phone, address,
  lat/lng, payment method) autosaved to `localStorage["wp.cart.v1"]` with a
  timestamp; drafts older than 24h are discarded; `clearCart()` removes it.
- `components/screens/OrderSummaryScreen.tsx` — skips auto-GPS on mount when a
  usable pin is already restored, so a refresh no longer yanks the map pin or
  overwrites a typed address.

## 3. Broken checkout fixed: `leaflet` was missing

`leaflet` was declared in `package.json` but absent from `node_modules`, which
crashed the Order Summary screen (it renders the map) and blocked builds. Ran
`npm install` — the app now builds.

## 4. Waakye packs (category `waakye`)

New menu category. Clicking **Waakye Bowl** on the landing screen now loads the
vendor's pre-made **waakye packs** (category `waakye`) at the top of the home
screen grid (combos still shown beneath them). A pack is a complete served item
with its own price/photo and a fixed list of included components (e.g. egg,
salad, spaghetti) that the vendor defined.

- `lib/vendorMenu.ts` — `MenuItem.category` now includes `'waakye'`; new
  `WaakyeIncluded` type and `included_items` field; `groupMenuByCategory()`
  gained a `waakye` bucket.
- `components/MenuItemThumbnail.tsx` — icon for the new category.
- `components/HomeScreen.tsx` — browse grid leads with packs.
- `components/ItemDetailScreen.tsx` — pack detail shows a **"What's included"**
  chip list, and the pack's components are attached to the cart line.
- `context/CartContext.tsx` / `lib/orders.ts` — `OrderLineItem` gained an
  optional `included` array that flows through `flattenCartItems()` into the
  order's stored JSON items.
- `components/OrderSummaryScreen.tsx` / `ConfirmationScreen.tsx` — a pack line
  renders as a standalone item (category `waakye` treated like `base`/`combo`)
  plus a "Comes with …" line.
- DB: `vendor_menu_items` gained column `included_items jsonb NOT NULL DEFAULT
  '[]'`. No category check constraint existed, so `'waakye'` needed no
  migration.

The build-your-own path (Size/Protein/Extra) is unchanged and remains the
"waakye alone" route for people who want to spec things their own way.

---

## Known issues / notes (not changed yet)

- Landing hero copy says "5:30 – 8:00 AM" but `utils/timeUtils.ts` treats the
  app as open 00:00–23:59 — mismatch.
- Order Summary asks for a checkout phone that isn't prefilled from the user's
  profile.
- HomeScreen favorites are in-memory (reset on refresh).
- `npm audit` reports 1 pre-existing high-severity vulnerability.