import LegalLayout, { Section, Callout } from '@/components/LegalLayout';

const SECTIONS = [
    { id: 'information-we-collect', title: '1. Information We Collect' },
    { id: 'how-we-use', title: '2. How We Use Your Information' },
    { id: 'cookies', title: '3. Cookies & Local Storage' },
    { id: 'sharing', title: '4. Data Sharing' },
    { id: 'retention', title: '5. Data Retention' },
    { id: 'your-rights', title: '6. Your Rights' },
    { id: 'international', title: '7. International Data Transfers' },
    { id: 'security', title: '8. Security' },
    { id: 'third-party', title: '9. Third‑Party Services' },
    { id: 'children', title: '10. Children\u2019s Privacy' },
    { id: 'changes', title: '11. Changes to This Policy' },
    { id: 'contact', title: '12. Contact' },
];

export default function PrivacyPage() {
    return (
        <LegalLayout title="Privacy Policy" lastUpdated="9th August 2026" sections={SECTIONS}>
            <Section id="information-we-collect" title="1. Information We Collect">
                <p>When you create a CTR (ClaimTheRoom) profile, we collect and store:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Your <strong>eFootball username</strong> (as provided by you).</li>
                    <li>Your chosen <strong>avatar</strong> (a DiceBear or Cloudinary image URL).</li>
                    <li>Game‑related statistics you voluntarily submit (squad strength, ranks, screenshots).</li>
                </ul>
                <p className="mt-2">
                    We <strong>do not</strong> collect your eFootball ID, password, or any other personal
                    information beyond what's listed above. Sign‑in is handled entirely by Kinde (our
                    authentication provider), which stores your email and authentication tokens on our behalf as a
                    data processor – please refer to Kinde's privacy policy for details on how it handles that data.
                </p>
            </Section>

            <Section id="how-we-use" title="2. How We Use Your Information">
                <p>Your data is used solely to:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Display your public profile (username, avatar, game stats) to other users.</li>
                    <li>Facilitate matchmaking and room claims.</li>
                    <li>Evaluate squad strength based on submitted screenshots — this review is done manually by our team, not by an automated decision‑making system.</li>
                </ul>
            </Section>

            <Section id="cookies" title="3. Cookies & Local Storage">
                <p>
                    CTR itself does not use advertising or tracking cookies. Our authentication provider, Kinde,
                    sets a session cookie and may use browser storage to keep you signed in and to detect and
                    prevent fraudulent sign‑ins; this is essential to how sign‑in works and isn't used for
                    advertising. Some app‑level preferences may also be kept in your browser's local storage. You
                    can clear these at any time through your browser settings, though doing so will sign you out.
                </p>
                <p className="mt-2 text-gray-400">
                    We do not currently respond to "Do Not Track" browser signals, as there is no accepted
                    industry standard for how sites should respond to them.
                </p>
            </Section>

            <Section id="sharing" title="4. Data Sharing">
                <p>
                    We do <strong>not</strong> sell or rent your personal data to third parties. Your username and
                    avatar are visible to other CTR users as part of the matchmaking experience. We may disclose
                    information if required by law, to enforce our Terms of Service, or to protect the rights,
                    property, or safety of CTR, our users, or the public.
                </p>
            </Section>

            <Section id="retention" title="5. Data Retention">
                <p>
                    Your profile data is stored as long as your account exists. If you wish to delete your data,
                    contact us through the Settings page. We will remove your profile within 7 business days,
                    except where we're required to retain certain records for a longer period by law.
                </p>
            </Section>

            <Section id="your-rights" title="6. Your Rights">
                <p>
                    Depending on where you live, you may have rights over your personal data, which can include the
                    right to access the data we hold about you, correct it, request its deletion, or ask us to
                    limit how we use it (for example, under GDPR in the EU/UK or CCPA in California). To exercise
                    any of these rights, contact us at legal@hpbooks.uk or through the Settings page — we'll
                    respond within a reasonable time and in line with applicable law.
                </p>
            </Section>

            <Section id="international" title="7. International Data Transfers">
                <p>
                    Our service providers (including Kinde and Supabase) may process and store data in countries
                    other than your own. Where this happens, we rely on those providers' own safeguards for
                    international data transfers, as described in their respective privacy policies.
                </p>
            </Section>

            <Section id="security" title="8. Security">
                <p>
                    We implement reasonable technical and organisational measures to protect your data. However, no
                    method of electronic storage is 100% secure, and we cannot guarantee absolute security.
                </p>
                <Callout>
                    If we become aware of a data breach affecting your personal information, we will notify
                    affected users and relevant authorities as required by applicable law.
                </Callout>
            </Section>

            <Section id="third-party" title="9. Third‑Party Services">
                <p>CTR uses the following third‑party services, each governed by their own privacy policies:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Kinde – authentication and user management.</li>
                    <li>Supabase – database and edge functions.</li>
                    <li>DiceBear – avatar generation.</li>
                    <li>Cloudinary – image hosting (if custom uploads are enabled).</li>
                </ul>
            </Section>

            <Section id="children" title="10. Children's Privacy">
                <p>
                    The Service is not intended for users under 13 years of age, and users between 13 and the age
                    of majority should only use it with a parent or guardian's involvement. We do not knowingly
                    collect data from children under 13. If we learn that we've inadvertently collected data from a
                    child under 13, we will delete it promptly <strong>Contact us at support@hpbooks.uk</strong> if you believe
                    this has happened.
                </p>
            </Section>

            <Section id="changes" title="11. Changes to This Policy">
                <p>
                    We may update this Privacy Policy from time to time. Changes will be posted on this page and,
                    if significant, communicated via the News page.
                </p>
            </Section>

            <Section id="contact" title="12. Contact">
                <p>
                    For privacy concerns or data requests, contact us at legal@hpbooks.uk or through the
                    Settings page.
                </p>
            </Section>
        </LegalLayout>
    );
}