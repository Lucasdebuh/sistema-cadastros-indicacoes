import { useEffect, useState } from 'react'

/**
 * Observa a classe .dark no <html>.
 * Necessário porque os gráficos (SVG) recebem cores por atributo,
 * e não por CSS.
 */
export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const el = document.documentElement
    const update = () => setIsDark(el.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return isDark
}

/**
 * Cores dos gráficos.
 * Série única em azul institucional, validada para contraste >= 3:1
 * contra a superfície de cada tema.
 */
export function useChartTheme() {
  const isDark = useIsDark()
  return {
    isDark,
    series: isDark ? '#3987e5' : '#1d4ed8',
    surface: isDark ? '#161b26' : '#ffffff',
    grid: isDark ? '#232937' : '#eef0f4',
    axis: isDark ? '#98a1b2' : '#6b7488',
    tooltipBg: isDark ? '#0b1220' : '#ffffff',
    tooltipBorder: isDark ? '#3a4152' : '#dfe3ea',
    tooltipText: isDark ? '#eef0f4' : '#161b26',
  }
}
