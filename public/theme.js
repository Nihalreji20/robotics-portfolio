(() => {
  const root = document.documentElement
  const system = matchMedia('(prefers-color-scheme: dark)')
  const key = 'portfolio-theme'
  let preference
  try {
    const saved = localStorage.getItem(key)
    if (saved === 'light' || saved === 'dark') preference = saved
  } catch {}

  const applyTheme = () => {
    root.dataset.theme = preference ?? (system.matches ? 'dark' : 'light')
  }
  applyTheme()

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.theme-toggle')
    const syncButton = () => button.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'))
    syncButton()
    button.hidden = false
    button.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark'
      applyTheme()
      syncButton()
      try {
        localStorage.setItem(key, preference)
      } catch {}
    })
    system.addEventListener('change', () => {
      applyTheme()
      syncButton()
    })
  })
})()
