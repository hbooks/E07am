import { useEffect, useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION;

export default function VersionCheck() {
    const [updateRequired, setUpdateRequired] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<{
        message: string;
        downloadUrl: string;
    } | null>(null);

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const res = await fetch('/version.json', { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                if (data.minRequiredVersion && data.minRequiredVersion !== CURRENT_VERSION) {
                    setUpdateInfo({
                        message: data.message || 'A new version is available. Please update to continue.',
                        downloadUrl: data.downloadUrl || '/',
                    });
                    setUpdateRequired(true);
                }
            } catch {
                // ignore version check errors
            }
        };
        checkVersion();
    }, []);

    if (!updateRequired) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#141414] rounded-3xl w-full max-w-sm p-6 border border-white/10 shadow-2xl text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20">
                    <RefreshCw className="h-7 w-7 text-yellow-500" />
                </div>
                <h2 className="text-lg font-bold mb-2">Update Required</h2>
                <p className="text-sm text-gray-300 mb-6">{updateInfo?.message}</p>
                <a
                    href={updateInfo?.downloadUrl}
                    className="block w-full bg-emerald-600 hover:brightness-110 text-white py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                >
                    <Download className="h-5 w-5" />
                    Download Update
                </a>
            </div>
        </div>
    );
}