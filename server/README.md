# Pocket Malé AI — ChatGPT with one free question

`worker.js` is a Cloudflare Worker that sits between the app and OpenAI. It
keeps the OpenAI key secret, gives every device **one free question**, and
unlocks more for people who buy **Pocket Malé Plus** and enter their licence key.

    app (web / Android / iPhone) ──► worker (your key, limits, licences) ──► OpenAI

Nothing here costs money until people use it: Cloudflare Workers and KV have a
free tier, and OpenAI bills per question (gpt-4o-mini is a fraction of a cent).

## What you need (all free to sign up)

1. **An OpenAI API key** — <https://platform.openai.com/api-keys>. Add billing
   and set a monthly **usage limit** so a bug can never run up a large bill.
2. **A way to sell Plus** that gives licence keys. Stripe isn't available to
   businesses in the Maldives, so use one of these (both handle tax and pay out
   internationally):
   - **Gumroad** — create a product "Pocket Malé Plus", set the price, and turn
     on *Generate a unique license key per sale*. Note the **product ID** shown
     in the licence-key section and the product's **checkout link**.
   - **Lemon Squeezy** — create a product with *License keys* enabled. Note the
     **product ID** and the **checkout link**.
3. **A Cloudflare account** — <https://dash.cloudflare.com/sign-up>.

## Deploy (about 10 minutes)

In a terminal, inside this `server` folder:

```bash
npx wrangler login
```
```bash
npx wrangler kv namespace create PM
```

Paste the `id` it prints into `wrangler.toml` (replace
`REPLACE_WITH_KV_NAMESPACE_ID`). In the same file set `GUMROAD_PRODUCT_ID`
(or set `LICENSE_PROVIDER = "lemonsqueezy"` and `LEMONSQUEEZY_PRODUCT_ID`).

Store the OpenAI key as a secret. You paste it into the terminal prompt — it is
never written to a file, committed, or shared anywhere else:

```bash
npx wrangler secret put OPENAI_API_KEY
```
```bash
npx wrangler deploy
```

It prints your worker URL, e.g. `https://pocket-male-ai.yourname.workers.dev`.

## Switch it on in the app

Edit `config.js` in the repository root:

```js
aiEndpoint: 'https://pocket-male-ai.yourname.workers.dev',
upgradeUrl: 'https://yourname.gumroad.com/l/pocket-male-plus',
plusPrice:  '$4.99',
```

Commit and push. The website updates in a minute and the Android app rebuilds
automatically.

## Limits you can change (`wrangler.toml` → `[vars]`)

| Setting | Default | Meaning |
|---|---|---|
| `FREE_QUESTIONS` | 1 | Free questions per device |
| `FREE_PER_IP_PER_DAY` | 5 | Free questions per network per day — stops people clearing app data to get more. Kept above 1 because many phones in Malé share a mobile network address. |
| `FREE_TOTAL_PER_DAY` | 300 | Free questions for everyone per day, a hard cap on free cost |
| `PLUS_MONTHLY_LIMIT` | 300 | Questions per Plus licence per month (fair use, protects you from one shared key) |
| `MAX_DEVICES` | 3 | Devices one licence can be activated on |
| `MODEL` | gpt-4o-mini | OpenAI model |
| `ALLOWED_ORIGINS` | the site, the app shells, localhost | Who may call the worker |

Cloudflare KV's free tier allows 1,000 writes a day; each answered question uses
about 3, so move to the $5/month Workers plan once you pass ~300 questions a day.

## Test without any accounts

```bash
node test.mjs
```
```bash
node dev.mjs
```

`test.mjs` checks the free question, upgrade, licence activation, monthly and
device limits with a fake OpenAI. `dev.mjs` runs the worker locally on port 8787
with fake answers; point a local `config.js` at `http://localhost:8787` and use
the licence key `DEMO-PLUS-KEY`.

## App store rules

Selling Plus through a web checkout is fine on the website and in the Android
APK you distribute yourself. **Google Play and the Apple App Store require their
own in-app purchase systems** for digital upgrades like this, so before
publishing to either store, Plus has to be sold through Play Billing / Apple IAP
(the worker would then verify store receipts instead of licence keys).
