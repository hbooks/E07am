import LegalLayout, { Section, Callout } from '@/components/LegalLayout';

const SECTIONS = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'eligibility', title: '2. Eligibility' },
    { id: 'platform', title: '3. Independent Platform' },
    { id: 'conduct', title: '4. User Conduct' },
    { id: 'content-license', title: '5. Your Content & License to Us' },
    { id: 'squad-evaluation', title: '6. Squad Evaluation' },
    { id: 'username-policy', title: '7. Username Policy' },
    { id: 'data-privacy', title: '8. Data Collection & Privacy' },
    { id: 'termination', title: '9. Termination' },
    { id: 'disclaimer', title: '10. Disclaimer of Warranties' },
    { id: 'liability', title: '11. Limitation of Liability' },
    { id: 'indemnification', title: '12. Indemnification' },
    { id: 'governing-law', title: '13. Governing Law & Disputes' },
    { id: 'dmca', title: '14. Copyright Complaints' },
    { id: 'general', title: '15. General Provisions' },
    { id: 'changes', title: '16. Changes to Terms' },
    { id: 'contact', title: '17. Contact' },
];

export default function TermsPage() {
    return (
        <LegalLayout title="Terms of Service" lastUpdated="9th August 2026" sections={SECTIONS}>
            <Section id="acceptance" title="1. Acceptance of Terms">
                <p>
                    By accessing or using CTR – Claim The Room ("CTR", "the Service", "we", "us"), you agree to be
                    bound by these Terms of Service ("Terms"). If you do not agree, you may not use the Service.
                </p>
            </Section>

            <Section id="eligibility" title="2. Eligibility">
                <p>
                    You must be at least 13 years old to use CTR. If you are between 13 and the age of majority in
                    your jurisdiction, you may only use the Service with the involvement and consent of a parent or
                    legal guardian. By using CTR, you represent that you meet these requirements.
                </p>
            </Section>

            <Section id="platform" title="3. Independent Platform">
                <p>
                    CTR is an independent, fan‑made matchmaking tool for eFootball™ players. We are{' '}
                    <strong>not affiliated, endorsed, or sponsored by Konami Group Corporation</strong>. All
                    game‑related trademarks, names, and logos are the property of their respective owners and are
                    used here only to describe the Service. You may not use CTR's name, logo, or branding to imply
                    an affiliation with Konami or any official eFootball product.
                </p>
            </Section>

            <Section id="conduct" title="4. User Conduct">
                <p>You agree to:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Use your <strong>real eFootball username</strong> – not an ID, not someone else's name.</li>
                    <li>Not impersonate another player, a CTR team member, or any official entity.</li>
                    <li>Not use offensive, hateful, obscene, or otherwise inappropriate language in your username.</li>
                    <li>Not upload tampered, doctored, or misleading screenshots for squad evaluation.</li>
                    <li>Not use the Service for any unlawful purpose, or to harass, threaten, or abuse other users.</li>
                    <li>Not attempt to interfere with, disrupt, or gain unauthorized access to the Service or its infrastructure.</li>
                </ul>
            </Section>

            <Section id="content-license" title="5. Your Content & License to Us">
                <p>
                    "Your Content" means anything you submit to CTR, including your username, chosen avatar, and
                    squad evaluation screenshots. You retain ownership of Your Content. By submitting it, you grant
                    CTR a non‑exclusive, worldwide, royalty‑free license to host, store, display, and reproduce Your
                    Content solely for the purpose of operating and displaying the Service (for example, showing
                    your profile and avatar to other users, or reviewing a submitted screenshot for evaluation).
                </p>
                <p className="mt-2">
                    You are solely responsible for Your Content and confirm you have the rights necessary to submit
                    it (for example, that a screenshot is one you took yourself).
                </p>
            </Section>

            <Section id="squad-evaluation" title="6. Squad Evaluation">
                <p>
                    When you submit a screenshot for squad evaluation, you guarantee that it is{' '}
                    <strong>authentic and unedited</strong>. We reserve the right to reject, flag, or ban accounts
                    that submit false information. Squad strength, rank, and other metrics are evaluated manually by
                    our team based on the provided screenshot, and results are given at our reasonable discretion.
                </p>
            </Section>

            <Section id="username-policy" title="7. Username Policy">
                <p>Your username must comply with our content policy. We reserve the right to reject any username that:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Contains offensive or hate‑speech terms.</li>
                    <li>Attempts to impersonate CTR staff or official game representatives.</li>
                    <li>Is deliberately misleading or harmful to the community.</li>
                </ul>
                <p className="mt-2">
                    Changing your username after initial setup is a manual process – you must submit a request and
                    provide proof that your in‑game name has changed.
                </p>
            </Section>

            <Section id="data-privacy" title="8. Data Collection & Privacy">
                <p>
                    We only store your eFootball username and your chosen avatar. Your sign‑in credentials (email)
                    are managed entirely by our authentication provider and are never stored on our servers. Please
                    see our <a href="/privacy" className="text-[#1E90FF] underline underline-offset-2 hover:text-blue-400 transition">Privacy Policy</a> for full details.
                </p>
            </Section>

            <Section id="termination" title="9. Termination">
                <p>
                    We may suspend or terminate your access to the Service at any time, without prior notice, for
                    violation of these Terms or for any other reason at our sole discretion. Upon termination, your
                    right to use the Service ends immediately; sections of these Terms that by their nature should
                    survive termination (including Sections 11, 12, and 13) will continue to apply.
                </p>
            </Section>

            <Section id="disclaimer" title="10. Disclaimer of Warranties">
                <p>
                    The Service is provided <strong>"as is"</strong> and <strong>"as available"</strong> without
                    warranties of any kind, either express or implied, to the maximum extent permitted by law. We do
                    not guarantee uninterrupted access, error‑free operation, or that squad evaluations will be
                    free of human error.
                </p>
            </Section>

            <Section id="liability" title="11. Limitation of Liability">
                <p>
                    To the maximum extent permitted by law, CTR and its team will not be liable for any indirect,
                    incidental, special, or consequential damages arising out of or relating to your use of the
                    Service. Because CTR is provided free of charge, our total liability for any claim relating to
                    the Service is limited to fifty US dollars (US $50) or the amount (if any) you have paid us in
                    the twelve months before the claim arose, whichever is greater.
                </p>
                <Callout tone="warning">
                    Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the
                    limitations above may not apply to you.
                </Callout>
            </Section>

            <Section id="indemnification" title="12. Indemnification">
                <p>
                    You agree to indemnify and hold CTR and its team harmless from any claims, damages, losses, or
                    expenses (including reasonable legal fees) arising out of your violation of these Terms, your
                    misuse of the Service, or Your Content.
                </p>
            </Section>

            <Section id="governing-law" title="13. Governing Law & Disputes">
                <p>
                    These Terms are governed by the laws of <strong>United Kingdom</strong>,
                    without regard to conflict‑of‑law principles. Before filing a formal claim, you agree to first
                    contact us so we can try to resolve the issue informally.
                </p>
            </Section>

            <Section id="dmca" title="14. Copyright Complaints">
                <p>
                    If you believe content on CTR infringes your copyright, contact us at{' '}
                    <strong>support@hpbooks.uk</strong> with a description of the work,
                    its location on the Service, and your contact information, and we will investigate promptly.
                </p>
            </Section>

            <Section id="general" title="15. General Provisions">
                <p>
                    If any provision of these Terms is found unenforceable, the remaining provisions remain in full
                    effect. These Terms, together with our Privacy Policy, are the entire agreement between you and
                    CTR regarding the Service. We may assign these Terms in connection with a merger, acquisition,
                    or sale of assets; you may not assign your rights under these Terms without our consent.
                </p>
            </Section>

            <Section id="changes" title="16. Changes to Terms">
                <p>
                    We may modify these Terms at any time. Continued use of the Service after changes means you
                    accept the new Terms. We will notify users of material changes via the News page.
                </p>
            </Section>

            <Section id="contact" title="17. Contact">
                <p>
                    For questions about these Terms, please reach us through the Settings page or via email at{' '}
                    legal@hpbooks.uk.
                </p>
            </Section>
        </LegalLayout>
    );
}