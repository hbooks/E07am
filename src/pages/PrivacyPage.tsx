export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
            <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h2>
                    <p>
                        When you create a CTR profile, we collect and store:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li>Your <strong>eFootball username</strong> (as provided by you).</li>
                        <li>Your chosen <strong>avatar</strong> (a DiceBear or Cloudinary image URL).</li>
                        <li>Game‑related statistics you voluntarily submit (squad strength, ranks, screenshots).</li>
                    </ul>
                    <p className="mt-2">
                        We <strong>do not</strong> collect your eFootball ID, password, email address, or any other personal information.
                        Sign‑in is handled entirely by Kinde (our authentication provider), which stores your email and authentication
                        tokens – please refer to Kinde’s privacy policy for details.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">2. How We Use Your Information</h2>
                    <p>Your data is used solely to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li>Display your public profile (username, avatar, game stats) to other users.</li>
                        <li>Facilitate matchmaking and room claims.</li>
                        <li>Evaluate squad strength based on submitted screenshots.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">3. Data Sharing</h2>
                    <p>
                        We do <strong>not</strong> sell, rent, or share your personal data with third parties.
                        Your username and avatar are visible to other CTR users as part of the matchmaking experience.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">4. Data Retention</h2>
                    <p>
                        Your profile data is stored as long as your account exists. If you wish to delete your data,
                        contact us through the Settings page. We will remove your profile within 7 business days.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">5. Security</h2>
                    <p>
                        We implement reasonable technical and organisational measures to protect your data.
                        However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">6. Third‑Party Services</h2>
                    <p>
                        CTR uses the following third‑party services, each governed by their own privacy policies:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li>Kinde – authentication and user management.</li>
                        <li>Supabase – database and edge functions.</li>
                        <li>DiceBear – avatar generation.</li>
                        <li>Cloudinary – image hosting (if custom uploads are enabled).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">7. Children’s Privacy</h2>
                    <p>
                        The Service is not intended for users under 13 years of age. We do not knowingly collect data from children.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">8. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. Changes will be posted on this page and, if significant,
                        communicated via the News page.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">9. Contact</h2>
                    <p>
                        For privacy concerns or data requests, contact us at privacy@ctr-app.com or through the Settings page.
                    </p>
                </section>

                <p className="text-gray-500 text-xs mt-8">Last updated: 6th August 2026</p>
            </div>
        </div>
    );
}