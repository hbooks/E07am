import LegalLayout, { Section, Callout } from '@/components/LegalLayout';

const SECTIONS = [
    { id: 'who-we-are', title: '1. Who We Are' },
    { id: 'information-we-collect', title: '2. Information We Collect' },
    { id: 'legal-basis', title: '3. Our Legal Basis for Processing' },
    { id: 'how-we-use', title: '4. How We Use Your Information' },
    { id: 'cookies', title: '5. Cookies & Local Storage' },
    { id: 'sharing', title: '6. How We Share Your Information' },
    { id: 'third-party', title: '7. Third‑Party Services' },
    { id: 'retention', title: '8. Data Retention' },
    { id: 'your-rights', title: '9. Your Rights' },
    { id: 'international', title: '10. International Data Transfers' },
    { id: 'security', title: '11. Security' },
    { id: 'children', title: '12. Children\u2019s Privacy' },
    { id: 'changes', title: '13. Changes to This Policy' },
    { id: 'contact', title: '14. Contact & Complaints' },
];

export default function PrivacyPage() {
    return (
        <LegalLayout title="Privacy Policy" lastUpdated="9th August 2026" sections={SECTIONS}>
            <Section id="who-we-are" title="1. Who We Are">
                <p>
                    CTR – Claim The Room ("CTR", "we", "us", "our") is a product operated under{' '}
                    <strong>HBOOKS</strong> ("HBOOKS", trading name of the business that also
                    develops other creative software) For the purposes of the UK
                    General Data Protection Regulation ("UK GDPR") and the Data Protection Act 2018, HBOOKS is the{' '}
                    <strong>data controller</strong> for the personal data described in this policy.
                </p>
                <Callout>
                    Fill in the correspondence address above. If HBOOKS is registered as a limited
                    company, add its company number and keep the registered‑office wording; if it's
                    trading as a sole trader/partnership under a business name, drop the "company
                    number" fragment and just give the correspondence address the business is
                    licensed/registered to.
                </Callout>
            </Section>

            <Section id="information-we-collect" title="2. Information We Collect">
                <p>When you create and use a CTR profile, we collect and store:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Your <strong>eFootball username</strong> (as provided by you).</li>
                    <li>Your chosen <strong>avatar</strong> (a DiceBear‑generated image, or a Cloudinary‑hosted image URL if you upload a custom picture).</li>
                    <li>Game‑related statistics you voluntarily submit (squad strength, squad rank, player rank).</li>
                    <li><strong>Squad‑evaluation screenshots</strong> — held temporarily on our image CDN while your submission is reviewed (see Section 8, Data Retention).</li>
                    <li><strong>Match‑result screenshots</strong> — used only at the point of submission to update your stats; these are <strong>not stored</strong>, only the resulting stat change is saved.</li>
                    <li>Match, room and claim details you create or interact with (for matchmaking and claim history).</li>
                    <li>Notifications sent to you within the app.</li>
                    <li>Community posts and comments you choose to submit.</li>
                    <li>Basic technical/service logs (e.g. timestamps, error and admin‑status logs) generated automatically to keep the Service running securely.</li>
                </ul>
                <p className="mt-2">
                    We <strong>do not</strong> collect your eFootball ID, your password, or any personal
                    information beyond what's listed above. Sign‑in is handled entirely by Kinde (our
                    authentication provider), which stores your email address and authentication tokens
                    on our behalf as our <strong>data processor</strong> – please refer to Kinde's own
                    privacy policy for details of how it handles that data.
                </p>
            </Section>

            <Section id="legal-basis" title="3. Our Legal Basis for Processing">
                <p>Under the UK GDPR, we only process your personal data where we have a valid legal basis. In summary:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li><strong>Performance of a contract</strong> – processing your username, avatar, match and claim data to provide the core matchmaking Service you've signed up for.</li>
                    <li><strong>Legitimate interests</strong> – processing screenshots and related metadata for anti‑fraud checks (the Troll Counter and squad verification), and keeping technical logs to secure and maintain the Service, provided this doesn't override your own rights and interests.</li>
                    <li><strong>Legal obligation</strong> – where we need to retain or disclose information to comply with the law.</li>
                    <li><strong>Consent</strong> – for anything not covered above (for example, optional communications), we'll ask for your consent and you can withdraw it at any time.</li>
                </ul>
            </Section>

            <Section id="how-we-use" title="4. How We Use Your Information">
                <p>Your data is used solely to:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Display your public profile (username, avatar, game stats) to other users.</li>
                    <li>Facilitate matchmaking, room posting, and room claims.</li>
                    <li>Evaluate squad strength based on submitted screenshots — this review is carried out manually by our team, not by a fully automated decision‑making system, and does not produce a decision with legal or similarly significant effects on you within the meaning of Article 22 UK GDPR.</li>
                    <li>Operate community features such as posts and comments.</li>
                    <li>Maintain, secure, and troubleshoot the Service (including via service logs).</li>
                </ul>
            </Section>

            <Section id="cookies" title="5. Cookies & Local Storage">
                <p>
                    CTR itself does not use advertising or tracking cookies. Our authentication provider,
                    Kinde, sets a session cookie and may use browser storage to keep you signed in and to
                    detect and prevent fraudulent sign‑ins; this is <strong>strictly necessary</strong> to
                    how sign‑in works and isn't used for advertising, so under the Privacy and Electronic
                    Communications Regulations (PECR) it does not require separate cookie consent. Some
                    app‑level preferences and a Redis‑backed session/performance cache may also be kept to
                    support the app and its offline/PWA functionality. You can clear cookies and local
                    storage at any time through your browser settings, though doing so will sign you out.
                </p>
                <p className="mt-2 text-gray-400">
                    We do not currently respond to "Do Not Track" browser signals, as there is no accepted
                    industry standard for how sites should respond to them.
                </p>
            </Section>

            <Section id="sharing" title="6. How We Share Your Information">
                <p>
                    We do <strong>not</strong> sell or rent your personal data to third parties. Your
                    username, avatar and game stats are visible to other CTR users as part of the
                    matchmaking and community experience. Community posts and comments you submit are
                    visible to other users and may be moderated or removed in line with our{' '}
                    <a href="/terms" className="text-[#1E90FF] underline underline-offset-2 hover:text-blue-400 transition">Terms of Service</a>{' '}
                    and our obligations under the Online Safety Act 2023 (see Section 7 of our Terms for
                    how to report content or raise a complaint). We may disclose information where
                    required by law, to enforce our Terms of Service, or to protect the rights, property,
                    or safety of CTR, our users, or the public.
                </p>
            </Section>

            <Section id="third-party" title="7. Third‑Party Services">
                <p>CTR uses the following third‑party services, each acting as a data processor on our behalf (or, where noted, as an independent controller) and governed by their own privacy policies:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li><strong>Kinde</strong> – authentication and user management (stores your email and auth tokens).</li>
                    <li><strong>Supabase, Neon & Upstash</strong> – our database and Cache storage, storage, and serverless‑function backend (stores account, match, claim, notification and log data).</li>
                    <li><strong>DiceBear</strong> – generates default avatar images from a non‑identifying seed value.</li>
                    <li><strong>Cloudinary</strong> – hosts custom‑uploaded profile images and squad‑evaluation screenshots.</li>
                    <li><strong>Vision/AI image‑analysis service</strong> – squad‑evaluation screenshots may be sent to an automated image‑analysis provider to assist our manual review and anti‑fraud checks. Screenshots are used only for this purpose.</li>
                    <li><strong>Scheduling/task service</strong> – triggers scheduled background jobs on our servers; it does not itself receive your personal data.</li>
                    <li><strong>Hosting/CDN provider</strong> – serves the CTR website and app.</li>
                </ul>
            </Section>

            <Section id="retention" title="8. Data Retention">
                <p>We keep personal data only for as long as it's needed for the purposes above:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li><strong>Squad‑evaluation screenshots</strong> are deleted from storage once verification is complete.</li>
                    <li><strong>Match‑result screenshots</strong> are never stored — we process them at submission only to increment your stats, then discard the image.</li>
                    <li><strong>Notifications and room claims</strong> are deleted approximately 24 hours after they're created or resolved.</li>
                    <li><strong>Match/room locks</strong> are released automatically once a match is completed or the claim expires.</li>
                    <li><strong>Profile data</strong> (username, avatar, stats, community posts) is kept for as long as your account exists.</li>
                    <li><strong>Service and admin logs</strong> are kept for a limited period for security and troubleshooting purposes before routine deletion.</li>
                </ul>
                <p className="mt-2">
                    If you ask us to delete your account via the Settings page, we aim to remove your
                    profile data within 7 business days as a matter of practice. Where you make a formal
                    request under UK GDPR (e.g. erasure, access, or objection), we will respond within one
                    calendar month as required by law, except where we're required to retain certain
                    records for longer (for example, to comply with a legal obligation or resolve a
                    dispute).
                </p>
            </Section>

            <Section id="your-rights" title="9. Your Rights">
                <p>
                    Under the UK GDPR, you have a number of rights over your personal data, including the
                    right to: access the data we hold about you; have inaccurate data corrected; request
                    erasure; restrict or object to certain processing; and data portability, where
                    applicable. Where our processing relies on your consent, you can withdraw that consent
                    at any time. To exercise any of these rights, contact us at legal@hpbooks.uk or through
                    the Settings page — we'll respond within one calendar month, as required by law.
                </p>
                <p className="mt-2">
                    If you're not satisfied with how we've handled your data, you also have the right to
                    lodge a complaint with the UK's data protection regulator, the{' '}
                    <strong>Information Commissioner's Office (ICO)</strong>, at{' '}
                    <a href="https://ico.org.uk" className="text-[#1E90FF] underline underline-offset-2 hover:text-blue-400 transition" target="_blank" rel="noreferrer">ico.org.uk</a>{' '}
                    or on 0303 123 1113. If you are located outside the UK, you may also have the right to
                    complain to your local data protection authority.
                </p>
            </Section>

            <Section id="international" title="10. International Data Transfers">
                <p>
                    Some of our service providers (including Kinde, Supabase, our image‑hosting and
                    vision‑analysis providers) may process and store data outside the UK, including in the
                    United States. Where this happens, we ensure an appropriate safeguard is in place
                    before the transfer occurs — such as the provider being covered by UK adequacy
                    regulations, or the transfer being subject to the UK International Data Transfer
                    Agreement (IDTA) or the UK Addendum to the EU Standard Contractual Clauses. You can
                    request more detail on the safeguards used for a specific provider by contacting us.
                </p>
            </Section>

            <Section id="security" title="11. Security">
                <p>
                    We implement appropriate technical and organisational measures to protect your data,
                    consistent with our obligations under Article 32 UK GDPR. However, no method of
                    electronic storage or transmission is 100% secure, and we cannot guarantee absolute
                    security.
                </p>
                <Callout>
                    If we become aware of a personal data breach that's likely to result in a risk to your
                    rights and freedoms, we will notify the ICO within 72 hours where required, and will
                    notify affected users without undue delay where the breach is likely to result in a
                    high risk to them, in line with our obligations under the UK GDPR.
                </Callout>
            </Section>

            <Section id="children" title="12. Children's Privacy">
                <p>
                    The Service is not intended for users under 13 years of age. Under the Data Protection
                    Act 2018, a child in the UK can generally consent to information society services from
                    age 13; users between 13 and the age of majority should only use CTR with a parent or
                    guardian's involvement, and by using CTR you (or, if you're under 18, your parent or
                    guardian on your behalf) confirm you meet this requirement. We do not knowingly collect
                    data from children under 13, and where community or matchmaking features are used by
                    younger teenage users, we apply the content‑moderation and reporting safeguards
                    described in our Terms of Service in line with the Online Safety Act 2023. If we learn
                    that we've inadvertently collected data from a child under 13, we will delete it
                    promptly. <strong>Contact us at support@hpbooks.uk</strong> if you believe this has
                    happened.
                </p>
            </Section>

            <Section id="changes" title="13. Changes to This Policy">
                <p>
                    We may update this Privacy Policy from time to time to reflect changes in our
                    practices or the law. Changes will be posted on this page with an updated "last
                    updated" date and, if significant, communicated via the News page or another
                    reasonable method.
                </p>
            </Section>

            <Section id="contact" title="14. Contact & Complaints">
                <p>
                    For privacy concerns or to exercise your data protection rights, contact us at{' '}
                    <strong>legal@hpbooks.uk</strong> or through the Settings page. If
                    you're unhappy with our response, you can complain to the ICO as set out in Section 9
                    above.
                </p>
            </Section>
        </LegalLayout>
    );
}