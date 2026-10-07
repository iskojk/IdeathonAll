import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import { useIdeathonConfig, useIdeathon } from '@/context/IdeathonContext'

const HIDDEN_PAGES = ['/basvuru', '/login', '/register', '/girisimciler']
const EXACT_HIDDEN = ['/']

function injectFlyAnimations() {
  if (document.getElementById('fab-fly-keyframes')) return
  const style = document.createElement('style')
  style.id = 'fab-fly-keyframes'
  style.textContent = `
    @keyframes fab-bubble-pop {
      0%   { transform: translate(-50%,-50%) scale(1); opacity: 1; }
      100% { transform: translate(-50%,-50%) scale(2.8); opacity: 0; }
    }
    @keyframes fab-burst-out {
      0%   { transform: translate(-50%,-50%) scale(1); opacity: 1; }
      100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
    }
    @keyframes fab-glow-fade {
      0%   { opacity: 0.5; transform: translate(-50%,-50%) scale(1); }
      100% { opacity: 0;   transform: translate(-50%,-50%) scale(3.5); }
    }
    @keyframes fab-screen-flash {
      0%   { opacity: 0; }
      50%  { opacity: 0.15; }
      100% { opacity: 0; }
    }
  `
  document.head.appendChild(style)
}

function spawnBubble(container, x, y) {
  const bubble = document.createElement('div')
  const size = 6 + Math.random() * 20
  const ox = (Math.random() - 0.5) * 44
  const oy = (Math.random() - 0.5) * 44
  const hue = 210 + Math.random() * 30
  const alpha = 0.35 + Math.random() * 0.45
  const dur = 500 + Math.random() * 300

  bubble.style.cssText = `
    position:absolute; left:${x + ox}px; top:${y + oy}px;
    width:${size}px; height:${size}px; border-radius:50%;
    background:radial-gradient(circle at 35% 35%,
      hsla(${hue},92%,68%,${alpha}),
      hsla(${hue},80%,50%,${alpha * 0.4}));
    box-shadow: 0 0 ${size}px hsla(${hue},90%,60%,0.35);
    pointer-events:none;
    animation: fab-bubble-pop ${dur}ms ease-out forwards;
  `
  container.appendChild(bubble)
  setTimeout(() => bubble.remove(), dur)
}

function spawnBurst(container, x, y, count = 12) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    const size = 4 + Math.random() * 10
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const dist = 25 + Math.random() * 55
    p.style.cssText = `
      position:absolute; left:${x}px; top:${y}px;
      width:${size}px; height:${size}px; border-radius:50%;
      background:radial-gradient(circle, rgba(37,99,235,0.85), rgba(96,165,250,0.4));
      box-shadow: 0 0 8px rgba(37,99,235,0.4);
      pointer-events:none;
      --tx:${Math.cos(angle) * dist}px; --ty:${Math.sin(angle) * dist}px;
      animation: fab-burst-out 550ms ease-out forwards;
    `
    container.appendChild(p)
    setTimeout(() => p.remove(), 550)
  }
}

function spawnGlow(container, x, y) {
  const g = document.createElement('div')
  g.style.cssText = `
    position:absolute; left:${x}px; top:${y}px;
    width:28px; height:28px; border-radius:50%;
    background:radial-gradient(circle, rgba(37,99,235,0.35), transparent 70%);
    pointer-events:none;
    animation: fab-glow-fade 450ms ease-out forwards;
  `
  container.appendChild(g)
  setTimeout(() => g.remove(), 450)
}

export default function FloatingApplyButton() {
  const { isAuthenticated } = useAuth()
  const config = useIdeathonConfig()
  const { hasSlug } = useIdeathon()
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)
  const btnRef = useRef(null)

  useEffect(() => {
    const isHiddenPage = HIDDEN_PAGES.some(p => router.pathname.startsWith(p)) || EXACT_HIDDEN.includes(router.pathname)
    const shouldShow = hasSlug && !config.loading && config.applicationOpen && !isHiddenPage
    setVisible(shouldShow)
  }, [isAuthenticated, hasSlug, config.loading, config.applicationOpen, router.pathname])

  const handleClick = useCallback((e) => {
    e.preventDefault()
    if (animating) return

    if (isAuthenticated) {
      router.push('/basvuru')
      return
    }

    setAnimating(true)

    const btn = btnRef.current
    if (!btn) return

    injectFlyAnimations()

    const contentEl = btn.querySelector('.floating-apply-content')
    const iconEl = btn.querySelector('.floating-apply-content i')
    if (!contentEl || !iconEl) return

    const iconRect = iconEl.getBoundingClientRect()
    const contentRect = contentEl.getBoundingClientRect()

    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;overflow:hidden;'
    document.body.appendChild(overlay)

    const cx = contentRect.left + contentRect.width / 2
    const cy = contentRect.top + contentRect.height / 2
    spawnBurst(overlay, cx, cy, 10)

    setTimeout(() => {
      contentEl.style.transition = 'all 0.3s ease'
      contentEl.style.opacity = '0'
      contentEl.style.transform = 'scale(0.6)'
    }, 80)

    const flyIcon = document.createElement('div')
    flyIcon.innerHTML = '<i class="bi bi-send-fill"></i>'
    flyIcon.style.cssText = `
      position:absolute; z-index:10; pointer-events:none;
      left:${iconRect.left + iconRect.width / 2}px;
      top:${iconRect.top + iconRect.height / 2}px;
      font-size:26px; color:white;
      transform:translate(-50%,-50%);
      filter: drop-shadow(0 0 18px rgba(37,99,235,0.9))
              drop-shadow(0 0 45px rgba(59,130,246,0.5));
    `
    overlay.appendChild(flyIcon)

    const startX = iconRect.left + iconRect.width / 2
    const startY = iconRect.top + iconRect.height / 2
    const endX = window.innerWidth / 2
    const endY = -40
    const duration = 1050
    let lastBubble = 0
    let startTime = null

    const animate = (now) => {
      if (!startTime) startTime = now
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)

      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2

      const curveX = Math.sin(t * Math.PI) * (window.innerWidth * 0.14)
      const x = startX + (endX - startX) * eased + curveX
      const y = startY + (endY - startY) * eased

      const scale = 1 + t * 0.7
      const rotate = t * 30

      flyIcon.style.left = x + 'px'
      flyIcon.style.top = y + 'px'
      flyIcon.style.transform = `translate(-50%,-50%) scale(${scale}) rotate(${rotate}deg)`

      if (elapsed - lastBubble > 40) {
        lastBubble = elapsed
        spawnBubble(overlay, x, y)
        if (elapsed % 80 < 42) spawnGlow(overlay, x, y)
      }

      if (t > 0.75) {
        flyIcon.style.opacity = String(1 - (t - 0.75) / 0.25)
      }

      if (t < 1) {
        requestAnimationFrame(animate)
      } else {
        spawnBurst(overlay, x, y, 14)

        const flash = document.createElement('div')
        flash.style.cssText = `
          position:fixed; inset:0;
          background:radial-gradient(circle at 50% 0%, rgba(37,99,235,0.12), transparent 60%);
          animation: fab-screen-flash 600ms ease-out forwards;
          pointer-events:none;
        `
        overlay.appendChild(flash)

        setTimeout(() => {
          overlay.remove()
          router.push('/register?animate=1')
        }, 350)
      }
    }

    setTimeout(() => requestAnimationFrame(animate), 120)
  }, [animating, isAuthenticated, router])

  if (!visible) return null

  return (
    <>
      <a
        href={isAuthenticated ? '/basvuru' : '/register'}
        className="floating-apply-btn"
        aria-label="Başvuru Yap"
        ref={btnRef}
        onClick={handleClick}
      >
        <span className="floating-apply-pulse"></span>
        <div className="floating-apply-content">
          <i className="bi bi-send-fill"></i>
          <span className="floating-apply-text">{isAuthenticated ? 'Başvuru Yap' : 'Başvur'}</span>
        </div>
      </a>

      <style jsx global>{`
        .floating-apply-btn {
          position: fixed;
          bottom: 32px;
          left: 32px;
          z-index: 9990;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none !important;
          border: none;
          cursor: pointer;
          animation: fab-floatIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .floating-apply-content {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 28px;
          background: linear-gradient(135deg, #042070 0%, #0092f3 100%);
          color: white;
          border-radius: 50px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.3px;
          box-shadow:
            0 8px 32px rgba(4, 32, 112, 0.4),
            0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .floating-apply-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.6s;
        }

        .floating-apply-btn:hover .floating-apply-content {
          transform: translateY(-3px);
          box-shadow:
            0 12px 40px rgba(4, 32, 112, 0.5),
            0 4px 12px rgba(0, 0, 0, 0.15);
          color: white;
        }

        .floating-apply-btn:hover .floating-apply-content::before {
          left: 100%;
        }

        .floating-apply-content i {
          font-size: 18px;
          transition: transform 0.3s ease;
        }

        .floating-apply-btn:hover .floating-apply-content i {
          transform: translateX(2px);
        }

        .floating-apply-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50px;
          background: linear-gradient(135deg, #042070 0%, #0092f3 100%);
          animation: fab-pulse 2.5s ease-out infinite;
          opacity: 0;
          top: 0;
          left: 0;
          pointer-events: none;
        }

        @keyframes fab-pulse {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        @keyframes fab-floatIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 768px) {
          .floating-apply-btn {
            bottom: 20px;
            left: 20px;
          }

          .floating-apply-content {
            padding: 14px 22px;
            font-size: 14px;
            gap: 8px;
          }

          .floating-apply-content i {
            font-size: 16px;
          }
        }

        @media (max-width: 400px) {
          .floating-apply-text {
            display: none;
          }

          .floating-apply-content {
            padding: 16px;
            border-radius: 50%;
            width: 56px;
            height: 56px;
            justify-content: center;
          }

          .floating-apply-content i {
            font-size: 22px;
          }
        }
      `}</style>
    </>
  )
}
