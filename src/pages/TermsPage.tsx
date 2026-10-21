export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 animate-slide-up">
      <h1 className="display text-3xl font-bold mb-2" style={{ color: 'var(--ink)' }}>Terms of Use</h1>
      <p className="text-sm mb-10" style={{ color: 'var(--muted)' }}>Last updated: October 2026</p>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>1. Acceptance of Terms</h2>
          <p>By accessing or using Flarc ("the Platform"), you agree to be bound by these Terms of Use. If you do not agree, do not use the Platform. These terms may be updated at any time; continued use constitutes acceptance of any revised terms.</p>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>2. Nature of the Platform</h2>
          <p>Flarc is a noncustodial, decentralized software interface that enables users to interact with smart contracts deployed on the Arc blockchain. Flarc does not:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Hold, custody, or control your digital assets or private keys</li>
            <li>Execute, initiate, or reverse transactions on your behalf</li>
            <li>Act as a bank, broker, dealer, exchange, custodian, or investment adviser</li>
            <li>Endorse, rate, or recommend any token listed on the Platform</li>
          </ul>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>3. Risk Disclosure</h2>
          <p>Digital assets are highly speculative and volatile. By using Flarc, you acknowledge and accept that:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Tokens launched on Flarc may lose all of their value</li>
            <li>Token liquidity is not guaranteed at any time</li>
            <li>Smart contracts may contain bugs or vulnerabilities</li>
            <li>Blockchain transactions are irreversible</li>
            <li>You may lose all funds you invest or deploy</li>
          </ul>
          <p className="mt-2">Nothing on this Platform constitutes financial, investment, legal, or tax advice.</p>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>4. User Responsibilities</h2>
          <p>You are solely responsible for:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Safeguarding your private keys and wallet credentials</li>
            <li>All transactions you submit through the Platform</li>
            <li>Compliance with all laws and regulations applicable in your jurisdiction</li>
            <li>Any content (token names, images, descriptions) you submit to the Platform</li>
          </ul>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>5. Prohibited Use</h2>
          <p>You may not use Flarc to:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Engage in market manipulation, wash trading, or pump-and-dump schemes</li>
            <li>Launch tokens designed to defraud other users (rug pulls)</li>
            <li>Violate any applicable law or regulation</li>
            <li>Infringe intellectual property rights of any third party</li>
          </ul>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>6. Restricted Regions</h2>
          <p>The Platform is not available to users in jurisdictions where such services are prohibited, including but not limited to OFAC-sanctioned countries. By using the Platform, you represent that you are not located in or a resident of any such jurisdiction.</p>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>7. Disclaimer of Warranties</h2>
          <p>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. FLARC EXPRESSLY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>8. Limitation of Liability</h2>
          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, FLARC AND ITS CONTRIBUTORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR DIGITAL ASSETS, ARISING FROM YOUR USE OF THE PLATFORM.</p>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>9. Changes and Termination</h2>
          <p>Flarc reserves the right to modify or discontinue the Platform at any time without notice. We reserve the right to restrict access to any user at our sole discretion.</p>
        </section>

        <section>
          <h2 className="display text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>10. Contact</h2>
          <p>For questions regarding these Terms, contact us at <a href="mailto:legal@flarc.fun" className="hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--accent)' }}>legal@flarc.fun</a></p>
        </section>
      </div>
    </div>
  )
}
