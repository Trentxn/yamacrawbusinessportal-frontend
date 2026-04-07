import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { Step, EventData } from 'react-joyride'

const TOUR_STORAGE_PREFIX = 'ybp_dashboard_tour_completed'

function getTourKey(role?: string): string {
  if (role === 'contractor') return `${TOUR_STORAGE_PREFIX}_contractor`
  return `${TOUR_STORAGE_PREFIX}`
}

export function useDashboardTour(onTourEnd?: () => void) {
  const { user } = useAuth()
  const isContractor = user?.role === 'contractor'
  const tourKey = getTourKey(user?.role)
  const hasCompleted = localStorage.getItem(tourKey) === 'true'
  const [run, setRun] = useState(!hasCompleted)

  const steps: Step[] = isContractor
    ? [
        {
          target: '[data-tour="sidebar"]',
          content: 'Welcome to your Contractor Portal! This sidebar helps you navigate between different sections.',
          placement: 'right',
          skipBeacon: true,
        },
        {
          target: '[data-tour="overview"]',
          content: 'The Overview page gives you a quick snapshot of your services and client inquiries at a glance.',
          placement: 'right',
        },
        {
          target: '[data-tour="listings"]',
          content: 'My Services is where you create and manage the government contract services you provide. You can list up to 5 services.',
          placement: 'right',
        },
        {
          target: '[data-tour="inquiries"]',
          content: 'Client Inquiries shows messages from residents interested in your services. You can view and reply to them here.',
          placement: 'right',
        },
        {
          target: '[data-tour="reviews"]',
          content: 'Reviews shows feedback and ratings from clients who have used your services.',
          placement: 'right',
        },
        {
          target: '[data-tour="notifications"]',
          content: 'The notification bell keeps you informed about service approvals, new client inquiries, and other important updates.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="back-home"]',
          content: 'You can always return to the main portal from here.',
          placement: 'right',
        },
      ]
    : [
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
          content: 'My Listings is where you create and manage your business listings. You can have up to 5 active listings.',
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
      localStorage.setItem(tourKey, 'true')
      setRun(false)
      onTourEnd?.()
    }
  }, [tourKey, onTourEnd])

  return { run, steps, handleEvent, setRun }
}
