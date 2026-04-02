import { useState, useCallback } from 'react'
import type { Step, EventData } from 'react-joyride'

const TOUR_STORAGE_KEY = 'ybp_account_tour_completed'

export function useAccountTour() {
  const hasCompleted = localStorage.getItem(TOUR_STORAGE_KEY) === 'true'
  const [run, setRun] = useState(!hasCompleted)

  const steps: Step[] = [
    {
      target: '[data-tour="account-sidebar"]',
      content: 'Welcome to your account! This sidebar helps you navigate between your inquiries and profile settings.',
      placement: 'right',
      skipBeacon: true,
    },
    {
      target: '[data-tour="account-inquiries"]',
      content: 'My Inquiries shows all the messages you have sent to businesses. You can track their status and see replies here.',
      placement: 'right',
    },
    {
      target: '[data-tour="account-profile"]',
      content: 'Profile lets you update your personal information and change your password.',
      placement: 'right',
    },
    {
      target: '[data-tour="account-notifications"]',
      content: 'Check the notification bell for updates on your inquiry replies and other important alerts.',
      placement: 'bottom',
    },
  ]

  const handleEvent = useCallback((data: EventData) => {
    if (data.status === 'finished' || data.status === 'skipped') {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      setRun(false)
    }
  }, [])

  return { run, steps, handleEvent, setRun }
}
