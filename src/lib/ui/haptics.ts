/**
 * JHPCS HAPTIC FEEDBACK UTILITY (Edge Mobile)
 * Provê microvibrações hápticas táteis para confirmação de ações na borda da piscina,
 * mesmo com luvas de borracha, dedos molhados ou em movimento sob sol forte.
 */

export type HapticPattern = 
  | 'light'     // Toques rápidos, seleção de abas, toggles (15ms)
  | 'medium'    // Confirmação de dosagem, preenchimento de teste (30ms)
  | 'heavy'     // Conclusão de laudo, checklist concluído (50ms)
  | 'success'   // Sucesso em transmissão, validação pericial ([25, 40, 35]ms)
  | 'warning'   // Alerta climático, parâmetros fora da faixa ([40, 50, 40]ms)
  | 'error'     // Trava de geofencing ultrapassada, erro crítico ([80, 60, 80]ms);

export function triggerHaptic(pattern: HapticPattern = 'light'): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      switch (pattern) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(30);
          break;
        case 'heavy':
          navigator.vibrate(55);
          break;
        case 'success':
          navigator.vibrate([25, 30, 45]);
          break;
        case 'warning':
          navigator.vibrate([40, 40, 40]);
          break;
        case 'error':
          navigator.vibrate([70, 40, 90]);
          break;
        default:
          navigator.vibrate(20);
      }
      return true;
    }
  } catch (err) {
    // Falha silenciosa em navegadores/dispositivos sem hardware vibratório
  }

  return false;
}

