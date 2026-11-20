import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

function luminance(hex){
 const [r,g,b]=hex.match(/../g).map(pair=>{
  const value=Number.parseInt(pair,16)/255
  return value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4
 })
 return 0.2126*r+0.7152*g+0.0722*b
}

test('text, link, and focus colors meet the required contrast on their surfaces',async()=>{
 const css=await readFile('public/site.css','utf8')
 const color=token=>luminance(css.match(new RegExp('--color-'+token+':#([a-f0-9]{6})','i'))[1])
 for(const [foreground,background,minimum] of [
  ['text','page',4.5],['text-muted','page',4.5],['text-muted','surface-muted',4.5],
  ['primary','page',4.5],['primary','surface',4.5],['primary-hover','surface',4.5],
  ['signal','page',4.5],['dark-text','dark',4.5],['primary','surface-muted',3]
 ]){
  const colors=[color(foreground),color(background)].sort((a,b)=>b-a)
  assert.ok((colors[0]+0.05)/(colors[1]+0.05)>=minimum,foreground+' on '+background)
 }
})

