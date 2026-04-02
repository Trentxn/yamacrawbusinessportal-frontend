import { useState, useCallback } from 'react'
import type { Step, EventData } from 'react-joyride'

const TOUR_STORAGE_KEY = 'ybp_dashboard_tour_completed'

export function useDashboardTour() {
  const hasCompleted = localStorage.getItem(TOUR_STORAGE_KEY) === 'true'
  const [run, setRun] = useState(!hasCompleted)

  const steps: Step[] = [
    {
      target: '[data-tour="sidebar"]',
      content: 'This is your sidebar navigation. Use it to move between different sections of your dashboard.',
      placement: 'right',
      skipBeacon: true,
    },
    {
      target: '[data-tour="overview"]',
      content: 'The Overview page gives you a quick snapshot of your listings and inquiries at a glance.',
      placement: 'right',
    },
    {
      target: '[data-tour="listings"]',
      content: 'My Listings is where you create and manage your business or contractor listings. You can have up to 5 active listings.',
      placement: 'right',
    },
    {
      target: '[data-tour="inquiries"]',
      content: 'Inquiries shows messages from people interested in your services. You can view and reply to them here.',
      placement: 'right',
    },
    {
      target: '[data-tour="reviews"]',
      content: 'Reviews shows feedback and ratings left by customers on your listings.',
      placement: 'right',
    },
    {
      target: '[data-tour="notifications"]',
      content: 'The notification bell keeps you informed about listing approvals, new inquiries, and other important updates.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="back-home"]',
      content: 'You can always return to the main portal from here.',
      placement: 'right',
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
