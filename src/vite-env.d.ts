////// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_KINDE_CLIENT_ID: string;
    readonly VITE_KINDE_DOMAIN: string;
    readonly VITE_KINDE_REDIRECT_URI: string;
    readonly VITE_KINDE_LOGOUT_REDIRECT_URI: string;
    readonly VITE_SUPABASE_FUNCTIONS_URL: string;
    // add any other VITE_ variables you use here
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
