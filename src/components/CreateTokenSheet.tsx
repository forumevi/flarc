import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Loader2, Check } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { FLARE_ADDRESS, FLARE_ABI, ACTIVE_CHAIN_ID, USDC_ADDRESS } from '../contract'
import { toast } from 'sonner'

const spectral = 'linear-gradient(90deg, #5fbeff, #af8ff4, #f05c6b, #ffcd83, #7ef1b3)'
const springs = { sheet: { type: 'spring' as const, damping: 30, stiffness: 300 } }
const CREATION_FEE = 1_000_000n

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

type Step = 'form' | 'approving' | 'creating' | 'done'

export default function CreateTokenSheet({ open, onClose, onCreated }: Props) {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const wrongChain = chainId !== ACTIVE_CHAIN_ID

  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [description, setDescription] = useState('')
  const [twitter, setTwitter] = useState('')
  const [telegram, setTelegram] = useState('')
  const [website, setWebsite] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [creatorFee, setCreatorFee] = useState('0')
  const [openingBuy, setOpeningBuy] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  // Prevent doCreate from firing twice after approve
  const createCalledRef = useRef(false)

  const { refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, FLARE_ADDRESS] : undefined,
    chainId: ACTIVE_CHAIN_ID,
    query: { enabled: !!address },
  })

  const { writeContract: approveWrite, data: approveTx, isPending: approvePending, reset: approveReset } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveTx })

  const { writeContract: createWrite, data: createTx, isPending: createPending, reset: createReset } = useWriteContract()
  const { isLoading: createConfirming, isSuccess: createSuccess } = useWaitForTransactionReceipt({ hash: createTx })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = useCallback(async (): Promise<string> => {
    if (!imageFile) return ''
    const jwt = import.meta.env.VITE_PINATA_JWT as string | undefined
    if (!jwt) { toast.error('Image upload not configured'); return '' }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', imageFile, imageFile.name)
      const res = await fetch('https://uploads.pinata.cloud/v3/files', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + jwt },
        body: form,
      })
      const data = await res.json() as { data?: { cid?: string }; error?: unknown }
      if (!res.ok || !data.data?.cid) {
        toast.error('Image upload failed: ' + res.status)
        return ''
      }
      return 'https://gateway.pinata.cloud/ipfs/' + data.data.cid
    } catch (err) {
      toast.error('Image upload error')
      console.error('[upload]', err)
      return ''
    } finally {
      setUploading(false)
    }
  }, [imageFile])

  const saveMetadata = useCallback(async (imageUrl: string) => {
    try {
      await fetch('/api/metadata/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, twitter, telegram, website, image_url: imageUrl }),
      })
    } catch { /* non-critical */ }
  }, [description, twitter, telegram, website])

  const doCreate = useCallback(async () => {
    if (createCalledRef.current) return
    createCalledRef.current = true
    setStep('creating')
    const imageUrl = await uploadImage()
    void saveMetadata(imageUrl)
    const feeBps = BigInt(Math.round(Math.min(10, Math.max(0, parseFloat(creatorFee) || 0)) * 100))
    const feeWallet = (address ?? '0x0000000000000000000000000000000000000000')
    createWrite({
      address: FLARE_ADDRESS,
      abi: FLARE_ABI,
      functionName: 'createToken',
      args: [name.trim(), symbol.trim().toUpperCase(), imageUrl, feeBps, feeWallet],
    })
  }, [uploadImage, createWrite, saveMetadata, name, symbol, creatorFee, address])

  // After approve TX confirmed → trigger create
  useEffect(() => {
    if (!approveSuccess || step !== 'approving') return
    void refetchAllowance().then(() => doCreate())
  }, [approveSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setStep('form')
    setName(''); setSymbol(''); setDescription('')
    setTwitter(''); setTelegram(''); setWebsite('')
    setImageFile(null); setImagePreview('')
    createCalledRef.current = false
    approveReset(); createReset()
    onClose()
  }

  // After create TX confirmed → done
  useEffect(() => {
    if (!createSuccess || step !== 'creating') return
    queueMicrotask(() => {
      setStep('done')
      toast.success(symbol.toUpperCase() + ' launched!')
      setTimeout(() => { onCreated(); handleClose() }, 1500)
    })
  }, [createSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async () => {
    if (!address || step !== 'form') return
    if (wrongChain) { switchChain({ chainId: ACTIVE_CHAIN_ID }); return }
    if (!name.trim() || !symbol.trim()) { toast.error('Name and ticker are required'); return }

    const { data: freshAllowance } = await refetchAllowance()
    const hasAllowance = freshAllowance !== undefined && freshAllowance >= CREATION_FEE

    if (!hasAllowance) {
      setStep('approving')
      approveWrite({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [FLARE_ADDRESS, CREATION_FEE * 10n],
      })
    } else {
      await doCreate()
    }
  }, [address, step, wrongChain, switchChain, name, symbol, refetchAllowance, approveWrite, doCreate])

  const isBusy = step !== 'form' && step !== 'done'
  const canSubmit = !!address && name.trim().length > 0 && symbol.trim().length > 0 && !isBusy

  const buttonLabel = () => {
    if (step === 'done') return <span className="flex items-center justify-center gap-2"><Check className="size-4" /> Launched!</span>
    if (step === 'approving') {
      if (approvePending) return <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> Confirm in wallet...</span>
      if (approveConfirming) return <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> Approving USDC...</span>
    }
    if (step === 'creating') {
      if (uploading) return <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> Uploading image...</span>
      if (createPending) return <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> Confirm in wallet...</span>
      if (createConfirming) return <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> Launching...</span>
    }
    if (wrongChain) return 'Switch to Arc Mainnet'
    if (!address) return 'Connect wallet'
    return 'Launch token — 1 USDC'
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <motion.section
            className="relative w-full max-w-lg overflow-hidden rounded-t-3xl"
            style={{ background: 'var(--bg-secondary)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid var(--border)', maxHeight: '92dvh', overflowY: 'auto' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={springs.sheet}
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1" style={{ background: spectral }} />
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-black/10" />
            </div>

            <div className="px-5 pb-8 pt-3">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>Launch a token</h2>
                <button onClick={handleClose} className="rounded-full p-1.5 transition-colors hover:bg-black/5">
                  <X className="size-4" style={{ color: 'var(--muted)' }} />
                </button>
              </div>

              {/* Step indicator */}
              {isBusy && (
                <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'var(--surface-muted)' }}>
                  <div className={`flex size-6 items-center justify-center rounded-full text-xs font-bold text-white ${step === 'approving' ? 'bg-blue-500' : 'bg-green-500'}`}>
                    {step === 'approving' ? '1' : <Check className="size-3" />}
                  </div>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Approve USDC</span>
                  <div className="mx-2 h-px flex-1" style={{ background: 'var(--border)' }} />
                  <div className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${step === 'creating' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
                    style={step !== 'creating' ? { background: 'var(--border)' } : {}}>
                    {step === 'creating' ? <Loader2 className="size-3 animate-spin" /> : '2'}
                  </div>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Launch token</span>
                </div>
              )}

              <div className="mb-4 flex items-center gap-4">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={isBusy}
                  className="flex size-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors hover:border-blue-400 disabled:opacity-50"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}
                >
                  {imagePreview
                    ? <img src={imagePreview} alt="" className="size-full object-cover" />
                    : <Upload className="size-5" style={{ color: 'var(--subtle)' }} />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Token image</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Square, up to 5 MB</p>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>NAME</label>
                  <input
                    value={name} onChange={e => setName(e.target.value)} maxLength={32}
                    placeholder="Flarc Coin" disabled={isBusy}
                    className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all disabled:opacity-50"
                    style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                  />
                  <p className="mt-0.5 text-right text-xs" style={{ color: 'var(--subtle)' }}>{name.length}/32</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>TICKER</label>
                  <input
                    value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} maxLength={10}
                    placeholder="FLARC" disabled={isBusy}
                    className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all disabled:opacity-50"
                    style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                  />
                  <p className="mt-0.5 text-right text-xs" style={{ color: 'var(--subtle)' }}>{symbol.length}/10</p>
                </div>
              </div>

              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>DESCRIPTION</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)} maxLength={256} rows={3}
                  placeholder="What is it, in a sentence or two." disabled={isBusy}
                  className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none transition-all disabled:opacity-50"
                  style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                />
              </div>

              <div className="mb-5 grid grid-cols-1 gap-2">
                {([
                  { label: 'X / TWITTER', value: twitter, set: setTwitter, placeholder: '@handle or post' },
                  { label: 'TELEGRAM', value: telegram, set: setTelegram, placeholder: 'username or t.me/...' },
                  { label: 'WEBSITE', value: website, set: setWebsite, placeholder: 'https://' },
                ] as const).map(({ label, value, set, placeholder }) => (
                  <div key={label}>
                    <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{label}</label>
                    <input
                      value={value} onChange={e => set(e.target.value)}
                      placeholder={placeholder} disabled={isBusy}
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all disabled:opacity-50"
                      style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                    />
                  </div>
                ))}
              </div>

              {/* Creator fee + Opening buy */}
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>CREATOR FEE %
                    <span className="ml-1 font-normal" style={{ color: 'var(--subtle)' }}>(max 10%)</span>
                  </label>
                  <div className="flex items-center rounded-xl px-3 py-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <input
                      type="number" min="0" max="10" step="0.5"
                      value={creatorFee} onChange={e => setCreatorFee(e.target.value)}
                      disabled={isBusy}
                      className="w-full bg-transparent text-sm font-medium outline-none disabled:opacity-50"
                      style={{ color: 'var(--ink)' }}
                    />
                    <span className="text-sm font-semibold" style={{ color: 'var(--subtle)' }}>%</span>
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--subtle)' }}>Goes to your wallet</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>OPENING BUY
                    <span className="ml-1 font-normal" style={{ color: 'var(--subtle)' }}>(optional)</span>
                  </label>
                  <div className="flex items-center rounded-xl px-3 py-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <input
                      type="number" min="0" step="1"
                      value={openingBuy} onChange={e => setOpeningBuy(e.target.value)}
                      placeholder="0" disabled={isBusy}
                      className="w-full bg-transparent text-sm font-medium outline-none disabled:opacity-50"
                      style={{ color: 'var(--ink)' }}
                    />
                    <span className="text-sm font-semibold" style={{ color: 'var(--subtle)' }}>USDC</span>
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--subtle)' }}>Buy at launch</p>
                </div>
              </div>

              <div className="mb-5 rounded-2xl px-4 py-3" style={{ background: 'var(--surface-muted)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--muted)' }}>Launch fee</span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>1 USDC</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span style={{ color: 'var(--muted)' }}>Creator fee</span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>{creatorFee || '0'}%</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span style={{ color: 'var(--muted)' }}>Initial supply</span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>1,000,000,000</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span style={{ color: 'var(--muted)' }}>Graduates at</span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>69,000 USDC</span>
                </div>
              </div>

              <button
                disabled={!canSubmit && !isBusy}
                onClick={() => { void handleSubmit() }}
                className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                {buttonLabel()}
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
