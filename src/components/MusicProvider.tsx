import { useEffect, useRef } from 'react'

const FEMU_URL = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/Femu`
const FALLBACK_TRACK = 'https://rmc.hpbooks.uk/Haunting_Me.mp3'
const FETCH_TIMEOUT_MS = 3500
const RESHUFFLE_COOLDOWN_MS = 20_000
const FADE_MS = 800
const DEFAULT_VOLUME = 0.25
const LS_ENABLED = 'cmued'
const LS_VOLUME = 'cmuvlme'

interface Track {
    id: number | string
    title: string
    url: string
}

function readEnabled(): boolean {
    try {
        return localStorage.getItem(LS_ENABLED) !== '0'
    } catch {
        return true
    }
}

function readVolume(): number {
    try {
        const v = localStorage.getItem(LS_VOLUME)
        if (v === null) return DEFAULT_VOLUME
        const n = Number(v)
        return isNaN(n) ? DEFAULT_VOLUME : Math.max(0, Math.min(1, n / 100))
    } catch {
        return DEFAULT_VOLUME
    }
}

function shuffle<T>(arr: T[]): T[] {
    const out = [...arr]
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const queueRef = useRef<Track[]>([])
    const currentRef = useRef<Track | null>(null)
    const lastReshuffleRef = useRef<number>(0)
    const startedRef = useRef<boolean>(false)
    const fadeRafRef = useRef<number | null>(null)

    // ---- Fade helpers ----
    const fadeTo = (target: number, ms: number, onDone?: () => void) => {
        const audio = audioRef.current
        if (!audio) return
        if (fadeRafRef.current !== null) cancelAnimationFrame(fadeRafRef.current)
        const start = audio.volume
        const delta = target - start
        const t0 = performance.now()
        const step = (now: number) => {
            const t = Math.min(1, (now - t0) / ms)
            audio.volume = Math.max(0, Math.min(1, start + delta * t))
            if (t < 1) {
                fadeRafRef.current = requestAnimationFrame(step)
            } else {
                fadeRafRef.current = null
                onDone?.()
            }
        }
        fadeRafRef.current = requestAnimationFrame(step)
    }

    // ---- Play a specific track from 0 with fade-in ----
    const playTrack = (track: Track, fadeIn = true) => {
        const audio = audioRef.current
        if (!audio) return
        currentRef.current = track
        audio.src = track.url
        audio.volume = fadeIn ? 0 : readVolume()
        audio.play().then(() => {
            if (fadeIn) fadeTo(readVolume(), FADE_MS)
        }).catch((err) => {
            console.warn('[Music] play() blocked or failed:', err)
        })
    }

    // ---- Pick next track from queue; refill when empty ----
    const playNext = () => {
        if (queueRef.current.length === 0) {
            // refill
            if (queueRef.current.length === 0 && currentRef.current) {
                // we lost the original list; just replay what's left
            }
        }
        const next = queueRef.current.shift()
        if (next) {
            playTrack(next, true)
        }
    }

    // ---- Reshuffle remaining queue; hard-transition current ----
    const reshuffleNow = (reason: string) => {
        const now = Date.now()
        if (now - lastReshuffleRef.current < RESHUFFLE_COOLDOWN_MS) {
            console.log(`[Music] Reshuffle skipped (cooldown) — ${reason}`)
            return
        }
        lastReshuffleRef.current = now
        console.log(`[Music] Reshuffling — ${reason}`)

        const audio = audioRef.current
        if (!audio || !currentRef.current) return

        // We need the full track pool. Cache it once it's fetched.
        const pool = (window as any).__ctrMusicPool as Track[] | undefined
        if (!pool || pool.length === 0) return

        // Exclude current track from the front of the new queue to avoid immediate repeat
        const others = pool.filter((t) => t.url !== currentRef.current?.url)
        const newQueue = shuffle(others.length > 0 ? others : pool)
        queueRef.current = newQueue

        // Fade current down, then swap
        fadeTo(0, FADE_MS, () => {
            audio.pause()
            const next = queueRef.current.shift()
            if (next) playTrack(next, true)
        })
    }

    // ---- Boot: build audio element + fetch playlist ----
    useEffect(() => {
        const audio = new Audio()
        audio.preload = 'auto'
        audio.volume = 0
        audioRef.current = audio

        audio.addEventListener('ended', () => {
            const next = queueRef.current.shift()
            if (next) {
                playTrack(next, true)
            } else {
                // refill from pool
                const pool = (window as any).__ctrMusicPool as Track[] | undefined
                if (pool && pool.length > 0) {
                    queueRef.current = shuffle(pool)
                    const n = queueRef.current.shift()
                    if (n) playTrack(n, true)
                }
            }
        })

        // Fetch playlist (with timeout + fallback)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

        fetch(FEMU_URL, { signal: controller.signal })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((data: { tracks: Track[] }) => {
                clearTimeout(timeout)
                const tracks = Array.isArray(data?.tracks) ? data.tracks : []
                if (tracks.length > 0) {
                    ; (window as any).__ctrMusicPool = tracks
                    queueRef.current = shuffle(tracks)
                    console.log(`[Music] Loaded ${tracks.length} tracks from Femu`)
                } else {
                    throw new Error('Empty playlist')
                }
            })
            .catch((err) => {
                clearTimeout(timeout)
                console.warn('[Music] Femu fetch failed, using fallback:', err)
                const fallback: Track = { id: 'fallback', title: 'Fallback', url: FALLBACK_TRACK }
                    ; (window as any).__ctrMusicPool = [fallback]
                queueRef.current = [fallback]
            })

        return () => {
            audio.pause()
            audio.src = ''
            if (fadeRafRef.current !== null) cancelAnimationFrame(fadeRafRef.current)
        }
    }, [])

    // ---- First user interaction → start playback ----
    useEffect(() => {
        const start = () => {
            if (startedRef.current) return
            if (!readEnabled()) return
            if (!audioRef.current) return
            if (queueRef.current.length === 0) return
            startedRef.current = true
            const first = queueRef.current.shift()
            if (first) {
                playTrack(first, true)
                console.log('[Music] Started after first interaction')
            }
            remove()
        }
        const remove = () => {
            document.removeEventListener('click', start)
            document.removeEventListener('touchstart', start)
            document.removeEventListener('keydown', start)
        }
        document.addEventListener('click', start, { once: false })
        document.addEventListener('touchstart', start, { once: false })
        document.addEventListener('keydown', start, { once: false })
        return remove
    }, [])

    // ---- Listen for settings events ----
    useEffect(() => {
        const onEnabled = (e: Event) => {
            const detail = (e as CustomEvent).detail as { enabled: boolean }
            const audio = audioRef.current
            if (!audio) return
            if (detail.enabled) {
                if (!startedRef.current && queueRef.current.length > 0) {
                    startedRef.current = true
                    const first = queueRef.current.shift()
                    if (first) playTrack(first, true)
                } else if (audio.paused && currentRef.current) {
                    audio.play().then(() => fadeTo(readVolume(), FADE_MS)).catch(() => { })
                } else {
                    fadeTo(readVolume(), FADE_MS)
                }
            } else {
                fadeTo(0, FADE_MS, () => audio.pause())
            }
        }

        const onVolume = (e: Event) => {
            const detail = (e as CustomEvent).detail as { volume: number }
            const audio = audioRef.current
            if (!audio) return
            if (audio.volume > 0) audio.volume = Math.max(0, Math.min(1, detail.volume))
        }

        const onReshuffle = (e: Event) => {
            const detail = (e as CustomEvent).detail as { reason?: string } | undefined
            reshuffleNow(detail?.reason ?? 'event')
        }

        window.addEventListener('ctr:music:enabled', onEnabled)
        window.addEventListener('ctr:music:volume', onVolume)
        window.addEventListener('ctr:music:reshuffle', onReshuffle)

        return () => {
            window.removeEventListener('ctr:music:enabled', onEnabled)
            window.removeEventListener('ctr:music:volume', onVolume)
            window.removeEventListener('ctr:music:reshuffle', onReshuffle)
        }
    }, [])

    return <>{children}</>
}