for(const player of document.querySelectorAll('details[data-video]')){
 player.hidden = false
 player.addEventListener('toggle',()=>{
  if(!player.open || player.querySelector('iframe')) return
  const frame = document.createElement('iframe')
  frame.src = 'https://www.youtube-nocookie.com/embed/' + player.dataset.video
  frame.title = player.dataset.title
  frame.referrerPolicy = 'strict-origin-when-cross-origin'
  frame.allowFullscreen = true
  player.append(frame)
 })
}

