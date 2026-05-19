import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook de polling "en tiempo real".
 * Llama a `fn` cada `intervalMs` milisegundos mientras el componente esté montado.
 * También vuelve a correr cuando el usuario vuelve a poner el foco en la pestaña (visibilitychange).
 *
 * @param fn        - Función async a ejecutar repetidamente (debe ser estable, useCallback)
 * @param intervalMs - Intervalo en ms (default 5000 = 5 s)
 * @param enabled   - Si es false no hace polling (útil cuando el user no está autenticado)
 */
export function usePolling(
  fn: () => Promise<void> | void,
  intervalMs = 5000,
  enabled = true
) {
  const savedFn = useRef(fn)

  // Siempre mantén la referencia actualizada sin reiniciar el intervalo
  useEffect(() => {
    savedFn.current = fn
  }, [fn])

  const tick = useCallback(async () => {
    await savedFn.current()
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Primera carga inmediata
    tick()

    const id = setInterval(tick, intervalMs)

    // Recarga cuando el usuario vuelve a la pestaña
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled, intervalMs, tick])
}
