export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
            <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using CTR – Claim The Room ("the Service"), you agree to be bound by these Terms of Service.
                        If you do not agree, you may not use the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">2. Independent Platform</h2>
                    <p>
                        CTR is an independent, fan‑made matchmaking tool for eFootball™ players.
                        We are <strong>not affiliated, endorsed, or sponsored by Konami Group Corporation</strong>.
                        All game‑related trademarks, names, and logos are the property of their respective owners.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">3. User Conduct</h2>
                    <p>You agree to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li>Use your <strong>real eFootball username</strong> – not an ID, not someone else’s name.</li>
                        <li>Not impersonate another player, a CTR team member, or any official entity.</li>
                        <li>Not use offensive, hateful, obscene, or otherwise inappropriate language in your username.</li>
                        <li>Not upload tampered, doctored, or misleading screenshots for squad evaluation.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">4. Squad Evaluation</h2>
                    <p>
                        When you submit a screenshot for squad evaluation, you guarantee that it is <strong>authentic and unedited</strong>.
                        We reserve the right to reject, flag, or ban accounts that submit false information.
                        Squad strength, rank, and other metrics are evaluated solely by our team based on the provided screenshot.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">5. Username Policy</h2>
                    <p>
                        Your username must comply with our content policy. We reserve the right to reject any username that:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li>Contains offensive or hate‑speech terms.</li>
                        <li>Attempts to impersonate CTR staff or official game representatives.</li>
                        <li>Is deliberately misleading or harmful to the community.</li>
                    </ul>
                    <p className="mt-2">
                        Changing your username after initial setup is a manual process – you must submit a request and provide proof that your in‑game name has changed.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">6. Data Collection & Privacy</h2>
                    <p>
                        We only store your eFootball username and your chosen avatar. Your sign‑in credentials (email) are managed
                        entirely by our authentication provider and are never stored on our servers.
                        Please see our <strong>Privacy Policy</strong> for full details.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">7. Termination</h2>
                    <p>
                        We may suspend or terminate your access to the Service at any time, without prior notice, for any violation
                        of these terms or for any other reason at our sole discretion.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">8. Disclaimer of Warranties</h2>
                    <p>
                        The Service is provided "as is" and "as available" without warranties of any kind, either express or implied.
                        We do not guarantee uninterrupted access or error‑free operation.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">9. Limitation of Liability</h2>
                    <p>
                        In no event shall CTR be liable for any indirect, incidental, or consequential damages arising out of your use
                        of the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">10. Changes to Terms</h2>
                    <p>
                        We may modify these Terms at any time. Continued use of the Service after changes means you accept the new terms.
                        We will notify users of material changes via the News page.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">11. Contact</h2>
                    <p>
                        For questions about these Terms, please reach us through the Settings page or via email at support@ctr-app.com.
                    </p>
                </section>

                <p className="text-gray-500 text-xs mt-8">Last updated: 6th August 2026</p>
            </div>
        </div>
    );
}