import LegalLayout, { Section, Callout } from '@/components/LegalLayout';

const SECTIONS = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'eligibility', title: '2. Eligibility' },
    { id: 'platform', title: '3. Independent Platform' },
    { id: 'availability', title: '4. Availability, Maintenance & Changes' },
    { id: 'matchmaking', title: '5. Matchmaking, Room Posting & Claims' },
    { id: 'conduct', title: '6. User Conduct & Account Security' },
    { id: 'community', title: '7. Community Content & Moderation' },
    { id: 'content-license', title: '8. Your Content & License to Us' },
    { id: 'squad-evaluation', title: '9. Squad Evaluation, EXP & the Troll Counter' },
    { id: 'username-policy', title: '10. Username Policy' },
    { id: 'data-privacy', title: '11. Data Collection & Privacy' },
    { id: 'termination', title: '12. Termination' },
    { id: 'disclaimer', title: '13. Disclaimer of Warranties' },
    { id: 'liability', title: '14. Limitation of Liability' },
    { id: 'indemnification', title: '15. Indemnification' },
    { id: 'governing-law', title: '16. Governing Law & Disputes' },
    { id: 'dmca', title: '17. Copyright Complaints' },
    { id: 'general', title: '18. General Provisions' },
    { id: 'changes', title: '19. Changes to Terms' },
    { id: 'contact', title: '20. Contact' },
];

export default function TermsPage() {
    return (
        <LegalLayout title="Terms of Service" lastUpdated="9th August 2026" sections={SECTIONS}>
            <Section id="acceptance" title="1. Acceptance of Terms">
                <p>
                    CTR – Claim The Room ("CTR", "the Service", "we", "us") is a product operated
                    under <strong>HBOOKS</strong>. By accessing or using CTR, you agree to be
                    bound by these Terms of Service ("Terms"). If you do not agree, you may not use the
                    Service.
                </p>
            </Section>

            <Section id="eligibility" title="2. Eligibility">
                <p>
                    You must be at least 13 years old to use CTR. If you are under 18, you may only use
                    the Service with the involvement and consent of a parent or legal guardian, who must
                    read and agree to these Terms on your behalf. Because a person under 18 may not be
                    able to enter into a fully binding contract under English law, where you are under 18
                    your parent or guardian is treated as accepting these Terms and is responsible for
                    your compliance with them. By using CTR, you (or your parent/guardian, if you're
                    under 18) represent that you meet these requirements.
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

            <Section id="availability" title="4. Availability, Maintenance & Changes">
                <p>
                    CTR is provided free of charge and on a best‑efforts basis. We reserve the right to
                    temporarily suspend access to all or part of the Service for maintenance, updates, or
                    technical reasons ("Maintenance Mode"), and to modify, add, or remove features at our
                    discretion. We'll try to keep disruption to a minimum but don't guarantee uninterrupted
                    availability. If you use a native/PWA version of the app, you may occasionally need to
                    update it, or use the official download page, to keep accessing the Service.
                </p>
            </Section>

            <Section id="matchmaking" title="5. Matchmaking, Room Posting & Claims">
                <p>
                    CTR lets you post match rooms and claim rooms posted by other users. Claims are
                    handled on a <strong>first‑come, first‑served</strong> basis: once a room is
                    claimed, it's locked to that user for the duration of the match. Unclaimed or
                    unresolved claims and locks <strong>expire automatically</strong> after a set period
                    (see Section 8, Data Retention, in our Privacy Policy for current timings), after
                    which the room becomes available again. We may cancel a claim, reassign a room, or
                    remove a posted room where we reasonably suspect abuse, a fake or duplicate posting,
                    or a breach of these Terms. We don't guarantee that a posted room will be claimed, or
                    that a claimed match will actually take place — CTR only facilitates the connection
                    between players.
                </p>
            </Section>

            <Section id="conduct" title="6. User Conduct & Account Security">
                <p>You agree to:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Use your <strong>real eFootball username</strong> – not an ID, not someone else's name.</li>
                    <li>Never share your Konami/eFootball ID, password, or other account credentials with CTR or with other users — we will never ask for it.</li>
                    <li>Keep your CTR sign‑in credentials confidential and secure, and tell us promptly at legal@hpbooks.uk if you suspect unauthorized access to your account.</li>
                    <li>Not impersonate another player, a CTR team member, or any official entity.</li>
                    <li>Not use offensive, hateful, obscene, or otherwise inappropriate language in your username, posts, or comments.</li>
                    <li>Not upload tampered, doctored, or misleading screenshots for squad evaluation or match results.</li>
                    <li>Not use the Service for any unlawful purpose, or to harass, threaten, or abuse other users.</li>
                    <li>Not attempt to interfere with, disrupt, or gain unauthorized access to the Service or its infrastructure.</li>
                </ul>
                <p className="mt-2">
                    You're responsible for activity that happens under your account where it results from
                    you failing to keep your credentials secure, except to the extent that's caused by our
                    own failure to keep the Service reasonably secure.
                </p>
            </Section>

            <Section id="community" title="7. Community Content & Moderation">
                <p>
                    CTR includes features that let users post and comment (the "Community Features"). As
                    a provider of a user‑to‑user service with links to the UK, we have duties under the
                    Online Safety Act 2023 to assess and manage the risk of illegal content, and to
                    protect users — including children — from harm. In line with this, we:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Prohibit illegal content and content that promotes harm, harassment, hate speech, or exploitation of minors on the Community Features.</li>
                    <li>Let you flag content or behaviour you believe is illegal, harmful, or breaches these Terms via the Contact Us form on your Profile, or by emailing legal@hpbooks.uk.</li>
                    <li>Operate a complaints procedure: if you report content, or if content you've posted is removed or actioned, you can use the same channel to ask us to review that decision.</li>
                    <li>May review, moderate, remove, or restrict access to content, and may suspend or terminate accounts, where we reasonably believe this is necessary to comply with the law or these Terms.</li>
                </ul>
                <p className="mt-2">
                    This section doesn't limit your right to freedom of expression; we aim to take
                    moderation action that is proportionate to the harm involved.
                </p>
            </Section>

            <Section id="content-license" title="8. Your Content & License to Us">
                <p>
                    "Your Content" means anything you submit to CTR, including your username, chosen
                    avatar, squad‑evaluation screenshots, and any community posts or comments. You retain
                    ownership of Your Content. By submitting it, you grant CTR a non‑exclusive, worldwide,
                    royalty‑free license to host, store, display, and reproduce Your Content solely for
                    the purpose of operating and displaying the Service (for example, showing your profile
                    and avatar to other users, displaying your community posts, or reviewing a submitted
                    screenshot for evaluation). To the extent permitted by the Copyright, Designs and
                    Patents Act 1988, you waive any moral rights in Your Content to the extent necessary
                    for us to operate the Service as described in these Terms (for example, displaying
                    your username alongside your posts rather than a separate "authorship" credit).
                </p>
                <p className="mt-2">
                    You are solely responsible for Your Content and confirm you have the rights necessary
                    to submit it (for example, that a screenshot is one you took yourself), and that it
                    doesn't infringe anyone else's rights or break the law.
                </p>
            </Section>

            <Section id="squad-evaluation" title="9. Squad Evaluation, EXP & the Troll Counter">
                <p>
                    When you submit a screenshot for squad evaluation, you guarantee that it is{' '}
                    <strong>authentic and unedited</strong>. We reserve the right to reject, flag, or ban
                    accounts that submit false information. Squad strength, rank, and other metrics are
                    evaluated manually by our team (assisted by automated image‑analysis tools) based on
                    the provided screenshot, and results are given at our reasonable discretion.
                </p>
                <p className="mt-2">
                    Your <strong>EXP and player rank</strong> are updated automatically based on your
                    match results and our anti‑fraud heuristics. The exact formula is proprietary and may
                    include a random or variable component as part of our anti‑manipulation measures.
                </p>
                <p className="mt-2">
                    Repeated fake, tampered, or otherwise inappropriate submissions or claims will increase
                    your <strong>Troll Counter</strong>, a visible flag on your profile. A high Troll
                    Counter may affect your ability to matchmake or claim rooms, and repeated violations
                    may result in suspension or termination of your account under Section 12.
                </p>
            </Section>

            <Section id="username-policy" title="10. Username Policy">
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

            <Section id="data-privacy" title="11. Data Collection & Privacy">
                <p>
                    We collect the data described in our{' '}
                    <a href="/privacy" className="text-[#1E90FF] underline underline-offset-2 hover:text-blue-400 transition">Privacy Policy</a>,
                    including your eFootball username, avatar, game stats, and any community content you
                    submit. Your sign‑in credentials (email) are managed entirely by our authentication
                    provider and are never stored on our servers. Please see our{' '}
                    <a href="/privacy" className="text-[#1E90FF] underline underline-offset-2 hover:text-blue-400 transition">Privacy Policy</a> for full details.
                </p>
            </Section>

            <Section id="termination" title="12. Termination">
                <p>
                    We may suspend or terminate your access to the Service at any time, without prior
                    notice, for violation of these Terms or for any other reasonable operational or legal
                    reason. You may close your account at any time via the Settings page; this is separate
                    from, and doesn't affect, your data protection rights described in our Privacy Policy.
                    Upon termination, your right to use the Service ends immediately; sections of these
                    Terms that by their nature should survive termination (including Sections 14, 15, and
                    16) will continue to apply.
                </p>
            </Section>

            <Section id="disclaimer" title="13. Disclaimer of Warranties">
                <p>
                    The Service is provided <strong>"as is"</strong> and <strong>"as available"</strong>.
                    To the extent permitted by law, we exclude all warranties, whether express or implied,
                    other than those which cannot lawfully be excluded. We do not guarantee uninterrupted
                    access, error‑free operation, or that squad evaluations will be free of human error.
                </p>
            </Section>

            <Section id="liability" title="14. Limitation of Liability">
                <p>
                    Nothing in these Terms excludes or limits our liability for death or personal injury
                    caused by our negligence, for fraud or fraudulent misrepresentation, or for any other
                    liability that cannot be excluded or limited under English law (including your
                    statutory rights under the Consumer Rights Act 2015, where applicable to you as a
                    consumer).
                </p>
                <p className="mt-2">
                    Subject to that, and to the maximum extent permitted by law, CTR and its team will not
                    be liable for any indirect, incidental, special, or consequential loss arising out of
                    or relating to your use of the Service. Because CTR is provided free of charge, our
                    total liability for any claim relating to the Service is limited to fifty pounds
                    sterling (£50) or the amount (if any) you have paid us in the twelve months before the
                    claim arose, whichever is greater.
                </p>
                <Callout tone="warning">
                    If you're a consumer, nothing in this section affects your statutory rights, and some
                    of the limitations above may not apply to the extent local law doesn't permit them.
                </Callout>
            </Section>

            <Section id="indemnification" title="15. Indemnification">
                <p>
                    You agree to indemnify and hold CTR and its team harmless from any claims, damages,
                    losses, or reasonable expenses (including legal fees) arising out of your breach of
                    these Terms, your misuse of the Service, or Your Content, except to the extent caused
                    by our own breach of these Terms, negligence, or wrongful act. If you're a consumer,
                    this section doesn't require you to indemnify us for losses caused by our own fault,
                    and is not intended to limit any right you have under the Consumer Rights Act 2015.
                </p>
            </Section>

            <Section id="governing-law" title="16. Governing Law & Disputes">
                <p>
                    These Terms, and any dispute or claim arising out of or in connection with them, are
                    governed by the laws of <strong>England and Wales</strong>. The courts of England and
                    Wales will have exclusive jurisdiction, except that if you are a consumer living
                    elsewhere in the UK, you may also bring proceedings in the courts of your home
                    jurisdiction, and if you're a consumer resident outside the UK, any mandatory consumer
                    protections of your country of residence are not affected by this clause. Before
                    filing a formal claim, you agree to first contact us so we can try to resolve the
                    issue informally.
                </p>
            </Section>

            <Section id="dmca" title="17. Copyright Complaints">
                <p>
                    If you believe content on CTR infringes your copyright under the Copyright, Designs
                    and Patents Act 1988 or otherwise, contact us at{' '}
                    <strong>support@hpbooks.uk</strong> with a description of the work, its location on
                    the Service, and your contact information, and we will investigate promptly and remove
                    or disable access to infringing content where appropriate.
                </p>
            </Section>

            <Section id="general" title="18. General Provisions">
                <p>
                    If any provision of these Terms is found unenforceable, the remaining provisions
                    remain in full effect. These Terms, together with our Privacy Policy, are the entire
                    agreement between you and CTR regarding the Service. Nothing in these Terms affects
                    any statutory rights you have as a consumer that cannot lawfully be excluded or
                    limited. We may assign these Terms in connection with a merger, acquisition, or sale
                    of assets; you may not assign your rights under these Terms without our consent.
                </p>
            </Section>

            <Section id="changes" title="19. Changes to Terms">
                <p>
                    We may modify these Terms at any time. Where changes are material, we'll give
                    reasonable notice (for example, via the News page) before they take effect. Continued
                    use of the Service after changes take effect means you accept the new Terms; if you
                    don't agree, you should stop using the Service and may close your account.
                </p>
            </Section>

            <Section id="contact" title="20. Contact">
                <p>
                    For questions about these Terms, please reach us through the Settings page or via email at{' '}
                    legal@hpbooks.uk.
                </p>
            </Section>
        </LegalLayout>
    );
}