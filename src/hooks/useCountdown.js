import { useState, useEffect } from 'react'

export function useCountdown(weddingDate) {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    if (!weddingDate) return

    // Parse as local date to avoid timezone offset
    const [y, m, d] = weddingDate.split('-').map(Number)
    const target = new Date(y, m - 1, d)

    function calculate() {
      const diff = target - new Date()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, past: true })
        return
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        past: false,
      })
    }

    calculate()
    const id = setInterval(calculate, 1000)
    return () => clearInterval(id)
  }, [weddingDate])

  return timeLeft
}
