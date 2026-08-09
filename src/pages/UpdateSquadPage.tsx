import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import {
    ArrowLeft,
    FileImage,
    CheckCircle,
    XCircle,
    Eye,
    Shield,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const CLO_PUSH_URL = `${BASE_URL}/Clo-push`;

const REFERENCE_SCREENSHOT_URL =
    'https://res.cloudinary.com/ctr-cloud/image/upload/v1786289547/jl5lylxi6gqpc6daryf4.jpg';

export default function UpdateSquadPage() {
    const { user, isAuthenticated } = useKindeAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [successModal, setSuccessModal] = useState(false);
    const [showReference, setShowReference] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Collapsible state
    const [refOpen, setRefOpen] = useState(false);
    const [warnOpen, setWarnOpen] = useState(false);

    // Drop zone error state
    const [dropError, setDropError] = useState<string | null>(null);

    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Reset error
        setDropError(null);

        // Client-side validation
        if (selectedFile.size > 700 * 1024) {
            setDropError('File must be 700 KB or less.');
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
            setDropError('Only JPEG, PNG, and WebP images are allowed.');
            return;
        }

        // Valid file
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    };

    const handleSubmit = async () => {
        if (!file || !user) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user.id);

        try {
            const res = await fetch(CLO_PUSH_URL, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (res.ok) {
                setSuccessModal(true);
                toast.success('Screenshot submitted!');
            } else {
                // Show backend error inside drop zone
                setDropError(data.error || 'Upload failed');
                setFile(null);
                setPreview(null);
            }
        } catch {
            setDropError('Network error – please try again.');
            setFile(null);
            setPreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    // Determine drop zone styling based on state
    const dropZoneClasses = () => {
        if (dropError) {
            return 'border-red-500 bg-red-500/10';
        }
        if (file) {
            return 'border-green-500 bg-green-500/10';
        }
        return 'border-gray-700 hover:border-[#1E90FF] bg-[#1A1A1A]';
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Back arrow */}
            <button
                onClick={() => navigate('/profile')}
                className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
            >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
            </button>

            <h1 className="text-2xl font-bold mb-2">Squad Evaluation</h1>
            <p className="text-sm text-gray-400 mb-6">
                Submit a screenshot of your <strong>best squad lineup</strong>. Our team will review it and update your squad
                strength, rank, and player rank accordingly. Evaluation usually takes 10–50 minutes.
            </p>

            {/* Collapsible: Tampered screenshots warning */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl mb-6 overflow-hidden">
                <button
                    onClick={() => setWarnOpen(!warnOpen)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-red-500/20 transition"
                >
                    <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-red-400" />
                        <span className="text-sm font-semibold text-red-300">Tampered screenshots are not allowed</span>
                    </div>
                    {warnOpen ? (
                        <ChevronUp className="h-5 w-5 text-red-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-red-400" />
                    )}
                </button>
                <div
                    className={`transition-all duration-300 ${warnOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0 overflow-hidden'
                        }`}
                >
                    <div className="px-4">
                        <p className="text-xs text-red-400/80">
                            Uploading edited, fake, or irrelevant images will increase your{' '}
                            <strong>Troll Counter</strong>. When your counter gets too high, other players will avoid matchmaking with you. Play fair.
                        </p>
                    </div>
                </div>
            </div>

            {/* Collapsible: Reference Screenshot */}
            <div className="bg-[#1A1A1A] rounded-2xl border border-gray-800 mb-4 overflow-hidden">
                <button
                    onClick={() => setRefOpen(!refOpen)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#222] transition"
                >
                    <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-[#1E90FF]" />
                        <span className="text-sm font-semibold">Reference Screenshot</span>
                    </div>
                    {refOpen ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                </button>
                <div
                    className={`transition-all duration-300 ${refOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0 overflow-hidden'
                        }`}
                >
                    <div className="px-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <p className="text-xs text-gray-400 mb-3">
                                    Please upload <strong>exactly this type of screenshot</strong> – showing your full squad players & substitutes visible.
                                    Any other image will be rejected and will increase your Troll Counter.
                                </p>
                                <button
                                    onClick={() => setShowReference(true)}
                                    className="text-sm text-[#1E90FF] hover:text-blue-400 transition inline-flex items-center gap-1"
                                >
                                    <Eye className="h-3 w-3" />
                                    View example
                                </button>
                            </div>
                            <div
                                className="w-20 h-20 rounded-xl overflow-hidden bg-[#0A0A0A] cursor-pointer flex-shrink-0"
                                onClick={() => setShowReference(true)}
                            >
                                <img src={REFERENCE_SCREENSHOT_URL} alt="Reference" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Drop zone */}
            <div
                onClick={() => {
                    // Clear error when user clicks to select new file
                    setDropError(null);
                    fileInputRef.current?.click();
                }}
                className={`border-2 border-dashed rounded-3xl p-8 mb-6 text-center cursor-pointer transition-colors ${dropZoneClasses()}`}
                style={{
                    animation: dropError ? 'shake 0.5s ease-in-out' : 'none',
                }}
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
                            onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                                setPreview(null);
                                setDropError(null);
                            }}
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
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {/* File info */}
            {file && !dropError && (
                <div className="bg-[#1A1A1A] rounded-xl p-4 mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-300">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
            )}

            {/* Submit button */}
            <button
                onClick={handleSubmit}
                disabled={!file || isUploading || !!dropError}
                className={`w-full py-3 rounded-xl font-semibold transition ${file && !dropError
                        ? 'bg-[#1E90FF] hover:bg-blue-600 text-white'
                        : 'bg-[#1A1A1A] text-gray-500 cursor-not-allowed'
                    }`}
            >
                {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                    </span>
                ) : (
                    'Submit for Evaluation'
                )}
            </button>

            {/* Reference image modal */}
            {showReference && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="relative bg-[#1A1A1A] rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full max-h-[90vh]">
                        <button
                            onClick={() => setShowReference(false)}
                            className="absolute top-4 right-4 bg-black/60 p-1 rounded-full text-white z-10"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                        <img src={REFERENCE_SCREENSHOT_URL} alt="Reference screenshot example" className="w-full h-auto" />
                        <div className="p-4 text-center text-sm text-gray-400">
                            Your screenshot should look like this, full squad players & substitutes visible.
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {successModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1A1A1A] rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Thank you!</h2>
                        <p className="text-gray-300 text-sm mb-6">
                            We have received your screenshot. Your squad will be evaluated within 10–50 minutes. You will be notified
                            when the process is complete.
                        </p>
                        <button
                            onClick={() => {
                                setSuccessModal(false);
                                navigate('/profile');
                            }}
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