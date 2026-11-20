const menu = document.querySelector('.menu-toggle')
const nav = document.querySelector('#main-nav')
menu.hidden = false
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true'
  menu.setAttribute('aria-expanded', String(!open))
  menu.textContent = open ? 'Menu' : 'Close menu'
})
document.addEventListener('keydown', event => {
  if(event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true' && menu.getClientRects().length){
    menu.click()
    menu.focus()
  }
})
nav.classList.add('enhanced')

