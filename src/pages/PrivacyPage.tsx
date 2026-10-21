export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 animate-slide-up">
      <h1 className="display text-3xl font-bold mb-2" style={{ color: 'var(--ink)' }}>Privacy Policy</h1>
      <p className="text-sm mb-10" style={{ color: 'var(--muted)' }}>Last updated: October 2026</p>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>1. Overview</h2>
          <p>Flarc is a noncustodial interface. Because all interactions happen directly between your wallet and smart contracts on the Arc blockchain, Flarc does not collect, store, or process personal data in the traditional sense. This policy explains what minimal data we do encounter and how we handle it.</p>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>2. Data We Do Not Collect</h2>
          <ul className="list-disc ml-5 space-y-1">
            <li>We do not require account registration</li>
            <li>We do not collect names, email addresses, or phone numbers</li>
            <li>We do not store private keys or seed phrases</li>
            <li>We do not track you across other websites</li>
          </ul>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>3. Onchain Data</h2>
          <p>All transactions, token creations, and trade histories are recorded on the Arc blockchain. This data is public, permanent, and not controlled by Flarc. Your wallet address is pseudonymous but publicly visible on the blockchain.</p>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>4. Token Metadata</h2>
          <p>Token names, descriptions, images, and social links you submit when creating a token are stored on IPFS (a decentralized storage network). This data is publicly accessible and cannot be deleted by Flarc once pinned.</p>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>5. Third-Party Services</h2>
          <p>Flarc uses the following third-party services that may process limited technical data:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Pinata</strong> — IPFS pinning for token images and metadata</li>
            <li><strong>Arc / Circle RPC</strong> — Blockchain node infrastructure</li>
            <li><strong>Vercel</strong> — Frontend hosting and CDN</li>
          </ul>
          <p className="mt-2">Each service operates under its own privacy policy.</p>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>6. Cookies</h2>
          <p>Flarc uses minimal local storage to remember your theme preference (dark/light mode). No advertising or tracking cookies are used.</p>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>7. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Continued use of the Platform after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>8. Contact</h2>
          <p>For privacy-related questions, contact <a href="mailto:privacy@flarc.fun" style={{ color: 'var(--accent)' }} className="hover:text-[var(--accent-hover)] transition-colors">privacy@flarc.fun</a></p>
        </section>
      </div>
    </div>
  )
}
