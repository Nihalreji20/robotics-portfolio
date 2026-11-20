const form = document.querySelector('#filters')
const grid = document.querySelector('#project-grid')
const result = document.querySelector('#results')
const cards = [...grid.children]
const controls = form.elements
function update(){
  const terms = controls.q.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const matches = card => (!controls.category.value || card.dataset.category === controls.category.value) &&
    (!controls.status.value || card.dataset.status === controls.status.value) &&
    terms.every(term => card.dataset.search.includes(term))
  const ordered = controls.sort.value === 'recent'
    ? [...cards].sort((a,b) => b.dataset.date.localeCompare(a.dataset.date))
    : cards
  let count = 0
  for(const card of ordered){
    card.hidden = !matches(card)
    if(!card.hidden) count++
    grid.append(card)
  }
  result.textContent = count ? count + (count === 1 ? ' project' : ' projects') : 'No projects match these filters. Try clearing the filters.'
}
form.hidden = false
form.addEventListener('input',update)
form.addEventListener('reset',()=>requestAnimationFrame(update))
form.addEventListener('submit',event=>event.preventDefault())
update()

