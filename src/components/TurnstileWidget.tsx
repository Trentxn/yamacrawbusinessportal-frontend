import { forwardRef, useEffect, useImperativeHandle, useRef, useCallback } from 'react'

const SITE_KEY = '0x4AAAAAAACxHB6tyAbHEoOVe'

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

    const renderWidget = useCallback(() => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme: 'light',
        callback: (token: string) => onSuccess(token),
        'error-callback': () => onError?.(),
        'expired-callback': () => onExpire?.(),
      })
    }, [onSuccess, onError, onExpire])

    useEffect(() => {
      // Wait for the turnstile script to load
      if (window.turnstile) {
        renderWidget()
        return
      }

      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval)
          renderWidget()
        }
      }, 100)

      return () => {
        clearInterval(interval)
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }
      }
    }, [renderWidget])

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
