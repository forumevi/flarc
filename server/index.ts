import express from 'express'
import cors from 'cors'
import multer from 'multer'
import FormData from 'form-data'
import fetch from 'node-fetch'
import { getTrades, getHolders, getPriceHistory, getStats, getTokenMetadata, upsertTokenMetadata, getTrending } from './db.ts'
import { startIndexer, syncNow } from './indexer.ts'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/trades/:tokenId', (req, res) => {
  const tokenId = parseInt(req.params.tokenId)
  if (isNaN(tokenId)) { res.status(400).json({ error: 'invalid tokenId' }); return }
  const limit = Math.min(parseInt((req.query.limit as string) || '50'), 200)
  res.json(getTrades(tokenId, limit))
})

app.get('/holders/:tokenId', (req, res) => {
  const tokenId = parseInt(req.params.tokenId)
  if (isNaN(tokenId)) { res.status(400).json({ error: 'invalid tokenId' }); return }
  res.json(getHolders(tokenId))
})

app.get('/price-history/:tokenId', (req, res) => {
  const tokenId = parseInt(req.params.tokenId)
  if (isNaN(tokenId)) { res.status(400).json({ error: 'invalid tokenId' }); return }
  res.json(getPriceHistory(tokenId, 500))
})

app.get('/stats/:tokenId', (req, res) => {
  const tokenId = parseInt(req.params.tokenId)
  if (isNaN(tokenId)) { res.status(400).json({ error: 'invalid tokenId' }); return }
  res.json(getStats(tokenId))
})

app.get('/metadata/:tokenId', (req, res) => {
  const tokenId = parseInt(req.params.tokenId)
  if (isNaN(tokenId)) { res.status(400).json({ error: 'invalid tokenId' }); return }
  res.json(getTokenMetadata(tokenId))
})

app.post('/metadata/:tokenId', (req, res) => {
  const tokenId = parseInt(req.params.tokenId)
  if (isNaN(tokenId)) { res.status(400).json({ error: 'invalid tokenId' }); return }
  const { description, twitter, telegram, website, image_url } = req.body as Record<string, string>
  upsertTokenMetadata(tokenId, { description, twitter, telegram, website, image_url })
  res.json({ ok: true })
})

app.get('/trending', (_req, res) => {
  res.json(getTrending(10))
})

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

app.post('/upload-image', upload.single('file'), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'no file' }); return }

  const PINATA_JWT = process.env.PINATA_JWT
  if (!PINATA_JWT) {
    res.json({ url: '' }); return
  }

  try {
    const form = new FormData()
    form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype })
    form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }))

    const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + PINATA_JWT, ...form.getHeaders() },
      body: form as unknown as import('node-fetch').BodyInit,
    })
    const data = await pinataRes.json() as { IpfsHash?: string; error?: { details?: string } }
    if (!pinataRes.ok) throw new Error(data.error?.details || 'Pinata error')
    const url = 'https://gateway.pinata.cloud/ipfs/' + data.IpfsHash
    res.json({ url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    console.error('[upload]', message)
    res.status(500).json({ error: message })
  }
})

// On-demand sync — called by frontend after a trade to pick up new events quickly
app.post('/sync', (_req, res) => {
  void syncNow()
  res.json({ ok: true })
})

app.get('/health', (_req, res) => res.json({ ok: true }))

const PORT = 3001
app.listen(PORT, () => {
  console.log('[server] listening on :' + PORT)
  startIndexer()
})
