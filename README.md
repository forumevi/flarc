# Flarc — USDC-Native Meme Token Launchpad on Arc

Flarc is a pump.fun-style meme token launchpad built natively on Arc, where USDC is the gas token. Anyone can launch a token in seconds, trade on a bonding curve, and graduate to a DEX at 69,000 USDC market cap.

## Live Demo

[flarc.fun](https://flarc.fun) — Arc Mainnet

## What Makes Flarc Different

- **USDC-native:** Every trade is denominated in USDC. No ETH, no SOL — just stable, predictable pricing.
- **Near-zero gas:** Arc's sub-cent gas fees make micro-trades viable for the first time.
- **Sub-second finality:** Trades confirm in under a second, enabling a real-time trading experience.
- **Bonding curve:** Price increases automatically as more tokens are bought — early buyers are rewarded.
- **Graduation:** When a token collects 69,000 USDC, it graduates and liquidity migrates to a DEX.

## How It Works

1. **Create a token** — pay 1 USDC, set name, ticker, image, and social links
2. **Bonding curve trading** — buy/sell with USDC, price moves automatically
3. **1% protocol fee** — on every trade, split to the protocol
4. **Graduation** — at 69K USDC collected, token graduates; holders can claim pro-rata USDC

## Contract

| Network | Address |
|---------|---------|
| Arc Mainnet | `0x735E2f7D97852CCC4D2E35c010850c801E4f035B` |
| Arc Testnet | `0x0f69fa4e1dac3d32dbfb93556e8a075661b1480b` |

## Tech Stack

- **Smart contract:** Solidity 0.8.20, OpenZeppelin 5.1, bonding curve with ReentrancyGuard + SafeERC20
- **Frontend:** React + TypeScript + Vite + wagmi + ConnectKit
- **Storage:** IPFS via Pinata for token images and metadata
- **Chain:** Arc (chainId 5042) — USDC as native gas

## Built With

Built entirely with [Arc Studio](https://studio.arc.io) for the Arc Microgrants 2 hackathon.

## Local Development

```bash
bun install
bun run dev
```

## License

MIT
