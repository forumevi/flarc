# Flarc — Arc Mainnet Deploy Talimatları

## Ön Gereksinimler

1. **Foundry kurulu olmalı** — [getfoundry.sh](https://getfoundry.sh)
2. **Arc Mainnet USDC** — cüzdanında en az 2-3 USDC olmalı (gas için)
3. **Cüzdan private key** — MetaMask: Settings → Security → Export Private Key

## Adımlar

### 1. Projeyi indir

Arc Studio'dan kodu indir (Download Code butonu) veya GitHub'a push et.

### 2. Bağımlılıkları kur

```bash
cd contracts
forge install
```

### 3. Deploy et

```bash
cd contracts
PRIVATE_KEY=0xSENIN_PRIVATE_KEYIN forge script script/DeployFlareLaunchpad.s.sol \
  --rpc-url https://rpc.mainnet.arc.io \
  --broadcast \
  --chain-id 5042
```

> **ÖNEMLİ:** Private key'ini kimseyle paylaşma. Komut satırında kullanınca history'den sil:
> ```bash
> history -c
> ```

### 4. Contract adresini kaydet

Deploy çıktısında şunu göreceksin:
```
FlareLaunchpad deployed at: 0x...
```

Bu adresi kopyala.

### 5. Frontend'i güncelle

Arc Studio'ya dön ve şunu söyle:
> "Mainnet contract adresim: 0x..."

Ben frontend'i güncelleyip Vercel'e deploy edeceğim.

### 6. Vercel environment variable ekle

Vercel dashboard → Project → Settings → Environment Variables:
- `VITE_CONTRACT_ADDRESS` = mainnet contract adresi
- `VITE_CHAIN_ID` = `5042`

---

## Arc Mainnet Bilgileri

| | |
|--|--|
| Chain ID | 5042 |
| RPC | https://rpc.mainnet.arc.io |
| Explorer | https://explorer.arc.io |
| USDC | 0x3600000000000000000000000000000000000000 |
| Fee recipient | 0x95773C1f40B82DD8D0529471f6A6016fdfE990Aa |

---

## Hackathon Submission Checklist

- [ ] Arc Mainnet'e deploy edildi
- [ ] Contract adresi explorer'da görünüyor
- [ ] En az bir mainnet TX var (token oluştur + bir alım)
- [ ] GitHub'a push edildi (public repo)
- [ ] Vercel'de canlı URL var
- [ ] Video walkthrough çekildi (2-3 dakika)
- [ ] DoraHacks'te submit edildi

## Video içeriği (önerilen)

1. Arc Studio'yu aç, projeyi göster
2. Testnet'te token oluştur, al/sat yap
3. Mainnet'teki deploy TX'i explorer'da göster
4. Mainnet'te token oluştur, alım yap
5. USDC'nin gerçekten hareket ettiğini göster
