import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { forwardRef, useImperativeHandle, useRef } from 'react'

const SITE_KEY = '0x4AAAAAAACxDuxXgqwTr8jde'

export interface TurnstileWidgetRef {
  reset: () => void
}

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void
  onError?: () => void
  onExpire?: () => void
}

const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ onSuccess, onError, onExpire }, ref) => {
    const turnstileRef = useRef<TurnstileInstance>(null)

    useImperativeHandle(ref, () => ({
      reset: () => turnstileRef.current?.reset(),
    }))

    if (!SITE_KEY) return null

    return (
      <div className="flex justify-center">
        <Turnstile
          ref={turnstileRef}
          siteKey={SITE_KEY}
          onSuccess={onSuccess}
          onError={onError}
          onExpire={onExpire}
          options={{
            theme: 'light',
            size: 'normal',
          }}
        />
      </div>
    )
  }
)

TurnstileWidget.displayName = 'TurnstileWidget'

export default TurnstileWidget
