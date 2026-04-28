# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the apps

No build step — both files are self-contained HTML. Open directly in a browser:

```bash
open tictactoe.html
open xsgd-monitor.html
```

After any edit, reopen the file or hard-refresh with **Cmd+Shift+R** (browsers cache `file://` pages).

## Git workflow

Commit and push after every meaningful change:

```bash
git add <files>
git commit -m "concise description"
git push
```

Remote: `https://github.com/keekxun/xsgd-monitor` (private, `main` branch).

## xsgd-monitor.html architecture

Single-file app — all CSS, HTML, and JS in one file. Key sections in order:

**Data sources (constants at top of `<script>`)**
- `OANDA_TOKEN` / `FX_URL` — Oanda fxTrade Practice API (`api-fxpractice.oanda.com`). Instrument is `USD_SGD` (not `SGD_USD` — Oanda doesn't list the inverse). Price is inverted: `1 / candle.mid.c`.
- `COINGECKO_URL` — CoinGecko free public API, no key required. Returns tickers where `base`/`target` are **raw contract addresses** for DEX pairs, not symbols.

**Exchange identity resolution (`resolveExchange`)**
- `KNOWN_DEX` map: exact CoinGecko `market.identifier` → `{name, chain}`. Identifiers use hyphens (e.g. `aerodrome-slipstream`, `uniswap-v3-base`) — not underscores.
- Fallback: detects chain from `trade_url` via `detectChain()` for unknown DEXes on Base/Polygon/Avalanche.
- Only CEX (Coinbase via `gdax`) and DEXes on Base, Polygon, Avalanche are shown; all others are filtered out.

**Price normalisation (`getPrice`)**
- DEX pairs use contract addresses. `XSGD_ADDRS` and `USDC_ADDRS` sets hold lowercase addresses per chain.
- Handles both directions: `XSGD→USDC` (return `last`) and `USDC→XSGD` (return `1/last`). Non-USDC pairs (e.g. XSGD/WAVAX) return `null` and are dropped.

**Stale data**
- CoinGecko marks tickers with `is_stale: true` when no recent trades.
- Stale rows are displayed greyed-out at the bottom of the table and **excluded from all spread and alert calculations**.

**Two independent alert systems**
1. *Cross-venue spread* (`checkAlert`): fires when `(maxPrice − minPrice) / minPrice × 10000 ≥ threshold` across active venues.
2. *Spot deviation* (`checkSpotAlert`): fires when any individual venue deviates from the Oanda SGD/USD mid by ≥ `spotThreshold` bps.

Both thresholds have independent sliders (default 20 bps each). Alerts trigger a Web Audio beep and browser Notification (permission requested on first breach).

**Refresh loop**
- `fetchFX()` and `fetchTickers()` are called independently in `refresh()` — FX failure shows "Unavailable" without blocking the price table.
- Auto-refresh interval: 15 / 30 / 60 s (dropdown). Countdown shown in footer.
- Raw CoinGecko ticker array is logged to the browser console on every refresh for debugging exchange identifiers.
