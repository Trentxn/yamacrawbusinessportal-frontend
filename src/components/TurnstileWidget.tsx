import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const SITE_KEY = '0x4AAAAAACxHB6tyAbHEoOVe'

export interface TurnstileWidgetRef {
  reset: () => void
}

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void
  onError?: () => void
  onExpire?: () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ onSuccess, onError, onExpire }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const callbacksRef = useRef({ onSuccess, onError, onExpire })

    // Keep refs up to date without re-triggering the effect
    callbacksRef.current = { onSuccess, onError, onExpire }

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const renderWidget = () => {
        if (widgetIdRef.current || !window.turnstile) return

        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: SITE_KEY,
          theme: 'light',
          callback: (token: string) => callbacksRef.current.onSuccess(token),
          'error-callback': () => callbacksRef.current.onError?.(),
          'expired-callback': () => callbacksRef.current.onExpire?.(),
        })
      }

      if (window.turnstile) {
        renderWidget()
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval)
            renderWidget()
          }
        }, 100)
        return () => clearInterval(interval)
      }

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }
      }
    }, [])

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current)
        }
      },
    }))

    return <div ref={containerRef} className="flex justify-center" />
  }
)

TurnstileWidget.displayName = 'TurnstileWidget'

export default TurnstileWidget
