import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import 'flag-icons/css/flag-icons.min.css'
import './index.css'
import App from './App.tsx'

function DisablePinchZoom() {
  useEffect(() => {
    const preventGestureZoom = (event: Event) => {
      event.preventDefault()
    }

    const preventPinchZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    }

    document.addEventListener('gesturestart', preventGestureZoom)
    document.addEventListener('gesturechange', preventGestureZoom)
    document.addEventListener('gestureend', preventGestureZoom)
    document.addEventListener('touchmove', preventPinchZoom, { passive: false })

    return () => {
      document.removeEventListener('gesturestart', preventGestureZoom)
      document.removeEventListener('gesturechange', preventGestureZoom)
      document.removeEventListener('gestureend', preventGestureZoom)
      document.removeEventListener('touchmove', preventPinchZoom)
    }
  }, [])

  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DisablePinchZoom />
    <App />
  </StrictMode>,
)
