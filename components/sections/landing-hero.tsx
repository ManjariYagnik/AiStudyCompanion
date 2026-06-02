'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Globe, ArrowRight, Instagram, Twitter, Brain } from 'lucide-react'

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4'

const FADE_MS = 500
// Begin the fade-out this many seconds before the clip ends.
const FADE_OUT_LEAD = 0.55

export function LandingHero() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number | null>(null)
  // Guards against re-triggering the fade-out from repeated timeupdate events.
  const fadingOutRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const cancelFade = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    // rAF-driven opacity tween. Resumes from the current opacity so a new
    // fade never snaps, and cancels any in-flight frame to avoid competing
    // animations.
    const fade = (target: number) => {
      cancelFade()
      const from = parseFloat(video.style.opacity || '0')
      const start = performance.now()

      const step = (now: number) => {
        const t = Math.min((now - start) / FADE_MS, 1)
        video.style.opacity = String(from + (target - from) * t)
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          rafRef.current = null
        }
      }

      rafRef.current = requestAnimationFrame(step)
    }

    const handleLoaded = () => {
      video.style.opacity = '0'
      video.play().catch(() => {})
      fade(1)
    }

    const handleTimeUpdate = () => {
      if (!video.duration) return
      const remaining = video.duration - video.currentTime
      if (remaining <= FADE_OUT_LEAD && !fadingOutRef.current) {
        fadingOutRef.current = true
        fade(0)
      }
    }

    const handleEnded = () => {
      cancelFade()
      video.style.opacity = '0'
      // Brief beat at zero opacity, then seamlessly restart and fade back in.
      setTimeout(() => {
        video.currentTime = 0
        video.play().catch(() => {})
        fadingOutRef.current = false
        fade(1)
      }, 100)
    }

    video.style.opacity = '0'
    // Cover the case where the video is already buffered before listeners attach.
    if (video.readyState >= 2) handleLoaded()

    video.addEventListener('loadeddata', handleLoaded)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      cancelFade()
      video.removeEventListener('loadeddata', handleLoaded)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#010828]">
      {/* Full-screen background video, shifted down so the lower frame shows. */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full translate-y-[17%] object-cover"
        style={{ opacity: 0 }}
        muted
        autoPlay
        playsInline
        preload="auto"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* Foreground UI */}
      <div className="relative flex min-h-screen flex-col">
        {/* Navigation */}
        <nav className="relative z-20 py-6 pl-6 pr-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between rounded-full px-6 py-3">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl liquid-glass">
                  <Brain size={18} className="text-neon" />
                </span>
                <span className="font-display text-xl tracking-wide text-white">Study Companion</span>
              </div>
              <div className="hidden items-center gap-8 md:flex">
                <a
                  href="#features"
                  className="text-sm font-medium text-white/80 transition-colors hover:text-neon"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-sm font-medium text-white/80 transition-colors hover:text-neon"
                >
                  Pricing
                </a>
                <a
                  href="#about"
                  className="text-sm font-medium text-white/80 transition-colors hover:text-neon"
                >
                  About
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm font-medium text-white">
                Sign Up
              </Link>
              <Link
                href="/dashboard"
                className="liquid-glass rounded-full px-6 py-2 text-sm font-medium text-white"
              >
                Login
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero content */}
        <main className="relative z-10 flex flex-1 -translate-y-[20%] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="relative mb-8">
            <span className="font-condiment absolute -top-7 right-2 rotate-[-8deg] text-3xl text-neon mix-blend-screen select-none md:right-6 md:text-4xl">
              study smarter
            </span>
            <h1 className="font-display text-5xl text-white md:text-6xl lg:text-7xl">
              Built for the curious
            </h1>
          </div>

          <div className="w-full max-w-xl space-y-4">
            <form
              className="liquid-glass flex items-center gap-3 rounded-full py-2 pl-6 pr-2"
              onSubmit={(e) => {
                e.preventDefault()
                router.push('/dashboard')
              }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/40"
              />
              <button
                type="submit"
                aria-label="Submit email"
                className="flex items-center justify-center rounded-full bg-neon p-3 text-[#010828] transition-transform hover:scale-105"
              >
                <ArrowRight size={20} />
              </button>
            </form>

            <p className="px-4 text-sm leading-relaxed text-white">
              Stay updated with the latest news and insights. Subscribe to our
              newsletter today and never miss out on exciting updates.
            </p>

            <div className="flex justify-center">
              <button className="liquid-glass rounded-full px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5">
                Manifesto
              </button>
            </div>
          </div>
        </main>

        {/* Social footer */}
        <footer className="relative z-10 flex justify-center gap-4 pb-12">
          <button
            aria-label="Instagram"
            className="liquid-glass rounded-full p-4 text-white/80 transition-all hover:bg-white/5 hover:text-white"
          >
            <Instagram size={20} />
          </button>
          <button
            aria-label="Twitter"
            className="liquid-glass rounded-full p-4 text-white/80 transition-all hover:bg-white/5 hover:text-white"
          >
            <Twitter size={20} />
          </button>
          <button
            aria-label="Website"
            className="liquid-glass rounded-full p-4 text-white/80 transition-all hover:bg-white/5 hover:text-white"
          >
            <Globe size={20} />
          </button>
        </footer>
      </div>
    </div>
  )
}
