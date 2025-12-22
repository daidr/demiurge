import { ref, shallowRef } from 'vue'

export const showInstallButton = ref(false)
export const installFunction = shallowRef<() => void>(() => { })

export function init() {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault()
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return e.preventDefault()
    }
    else {
      showInstallButton.value = true
      installFunction.value = () => e.prompt()
      return e.preventDefault()
    }
  })
}
