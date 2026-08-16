import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import {
    ArrowLeft, FileImage, CheckCircle, XCircle, Eye, Shield, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const REEX_URL = `${BASE_URL}/Reex`;

const REFERENCE_SCREENSHOT_URL = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786883927/ldonek8temmnueaff3t5.jpg';

export default function ResultsPage() {
    const { user, isAuthenticated, login } = useKindeAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successModal, setSuccessModal] = useState(false);
    const [showReference, setShowReference] = useState(false);
    const [refOpen, setRefOpen] = useState(false);
    const [warnOpen, setWarnOpen] = useState(false);
    const [dropError, setDropError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white gap-4">
                <p>You must be signed in to submit results.</p>
                <button onClick={() => login()} className="bg-[#1E90FF] hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition">
                    Sign in with Kinde
                </button>
            </div>
        );
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        setDropError(null);

        if (selectedFile.size > 700 * 1024) {
            setDropError('File must be 700 KB or less.');
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
            setDropError('Only JPEG, PNG, and WebP images are allowed.');
            return;
        }

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    };

    const handleSubmit = async () => {
        if (!file || !user?.id) return;
        setIsSubmitting(true);

        try {
            const res = await fetch(REEX_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            const data = await res.json();

            if (res.ok) {
                setSuccessModal(true);
                toast.success('Result submitted successfully!');
            } else {
                toast.error(data.error || 'Failed to submit result');
            }
        } catch {
            toast.error('Network error – please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
      `}</style>

            <button onClick={() => navigate('/profile')} className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
                <ArrowLeft className="h-5 w-5" />
                Back to Profile
            </button>

            <h1 className="text-2xl font-bold mb-2">Submit Match Result</h1>
            <p className="text-sm text-gray-400 mb-6">
                Upload a screenshot of the final result. We verify it to update your EXP and stats.
            </p>

            {/* Collapsible: Reference Screenshot */}
            <div className="bg-[#141414] rounded-2xl border border-white/5 mb-4 overflow-hidden">
                <button onClick={() => setRefOpen(!refOpen)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#222] transition">
                    <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-[#1E90FF]" />
                        <span className="text-sm font-semibold">Reference Screenshot</span>
                    </div>
                    {refOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </button>
                <div className={`transition-all duration-300 ${refOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="px-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <p className="text-xs text-gray-400 mb-3">
                                    Upload a screenshot similar to this. It must clearly show the final score and match details.
                                </p>
                                <button onClick={() => setShowReference(true)} className="text-sm text-[#1E90FF] hover:text-blue-400 transition inline-flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    View example
                                </button>
                            </div>
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#0A0A0A] cursor-pointer flex-shrink-0" onClick={() => setShowReference(true)}>
                                <img src={REFERENCE_SCREENSHOT_URL} alt="Reference" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collapsible: Tampered warning */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl mb-6 overflow-hidden">
                <button onClick={() => setWarnOpen(!warnOpen)} className="w-full flex items-center justify-between p-4 text-left hover:bg-red-500/20 transition">
                    <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-red-400" />
                        <span className="text-sm font-semibold text-red-300">Tampered screenshots are not allowed</span>
                    </div>
                    {warnOpen ? <ChevronUp className="h-5 w-5 text-red-400" /> : <ChevronDown className="h-5 w-5 text-red-400" />}
                </button>
                <div className={`transition-all duration-300 ${warnOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="px-4">
                        <p className="text-xs text-red-400/80">
                            Uploading edited or fake results will increase your Troll Counter and may lead to account restriction.
                        </p>
                    </div>
                </div>
            </div>

            {/* Drop zone */}
            <div
                onClick={() => { setDropError(null); fileInputRef.current?.click(); }}
                className={`border-2 border-dashed rounded-3xl p-8 mb-6 text-center cursor-pointer transition-colors ${dropError ? 'border-red-500 bg-red-500/10' : file ? 'border-green-500 bg-green-500/10' : 'border-gray-700 hover:border-[#1E90FF] bg-[#141414]'
                    }`}
                style={{ animation: dropError ? 'shake 0.5s ease-in-out' : 'none' }}
            >
                {dropError ? (
                    <div className="space-y-3">
                        <AlertTriangle className="h-12 w-12 mx-auto text-red-400" />
                        <p className="text-red-400 text-sm">{dropError}</p>
                    </div>
                ) : preview ? (
                    <div className="relative">
                        <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-xl object-contain" />
                        <button
                            onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                            className="absolute top-2 right-2 bg-red-500 p-1 rounded-full text-white"
                        >
                            <XCircle className="h-5 w-5" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <FileImage className="h-12 w-12 mx-auto text-gray-500" />
                        <p className="text-gray-400 text-sm">Tap to select a screenshot (Max 700 KB, JPEG/PNG/WebP)</p>
                    </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} className="hidden" />
            </div>

            {file && !dropError && (
                <div className="bg-[#141414] rounded-xl p-4 mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-300">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={!file || isSubmitting || !!dropError}
                className={`w-full py-3 rounded-xl font-semibold transition ${file && !dropError ? 'bg-[#1E90FF] hover:bg-blue-600 text-white' : 'bg-[#1A1A1A] text-gray-500 cursor-not-allowed'
                    }`}
            >
                {isSubmitting ? 'Submitting...' : 'Submit Result'}
            </button>

            {/* Reference modal */}
            {showReference && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="relative bg-[#141414] rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full max-h-[90vh]">
                        <button onClick={() => setShowReference(false)} className="absolute top-4 right-4 bg-black/60 p-1 rounded-full text-white z-10">
                            <XCircle className="h-6 w-6" />
                        </button>
                        <img src={REFERENCE_SCREENSHOT_URL} alt="Reference" className="w-full h-auto" />
                        <div className="p-4 text-center text-sm text-gray-400">Your screenshot should look like this.</div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {successModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Result Submitted</h2>
                        <p className="text-gray-300 text-sm mb-6">
                            Your match result has been recorded. Stats and EXP updated. You are now free to create or claim other matches.
                        </p>
                        <button
                            onClick={() => { setSuccessModal(false); navigate('/profile'); }}
                            className="w-full bg-[#1E90FF] hover:bg-blue-600 text-white py-2 rounded-xl font-semibold transition"
                        >
                            Back to Profile
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
    
}

