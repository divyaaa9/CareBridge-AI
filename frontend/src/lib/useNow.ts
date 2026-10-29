import { useEffect, useState } from 'react'
/** Re-renders every `ms` so countdowns ("in 25 min") stay fresh. */
export function useNow(ms = 30000) { const [n, setN] = useState(() => new Date()); useEffect(() => { const id = window.setInterval(() => setN(new Date()), ms); return () => clearInterval(id) }, [ms]); return n }
