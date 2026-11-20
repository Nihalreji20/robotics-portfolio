import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {runInNewContext} from 'node:vm'

test('discovery combines search, category and status, then resets to featured order',async()=>{
 const old={dataset:{search:'robot simulation pybullet',category:'Robotics',status:'Simulation',date:'2025-01-01'}}
 const recent={dataset:{search:'controller esp32',category:'Electronics',status:'Prototype',date:'2026-01-01'}}
 const handlers={}
 const elements=Object.fromEntries(['q','category','status','sort'].map(name=>[name,{value:''}]))
 const form={elements,addEventListener(name,handler){handlers[name]=handler}}
 const grid={children:[old,recent],append(card){this.children=this.children.filter(x=>x!==card).concat(card)}}
 const result={}
 const nodes={'#filters':form,'#project-grid':grid,'#results':result}
 const document={querySelector:selector=>nodes[selector]}
 runInNewContext(await readFile('public/filters.js','utf8'),{document,requestAnimationFrame:callback=>callback()})
 assert.equal(result.textContent,'2 projects')
 elements.q.value='robot pybullet'
 elements.status.value='Simulation'
 handlers.input()
 assert.equal(old.hidden,false)
 assert.equal(recent.hidden,true)
 elements.category.value='Electronics'
 handlers.input()
 assert.match(result.textContent,/No projects match/)
 for(const control of Object.values(elements)) control.value=''
 elements.sort.value='recent'
 handlers.input()
 assert.equal(grid.children[0],recent)
 elements.sort.value=''
 handlers.reset()
 assert.equal(grid.children[0],old)
 assert.equal(result.textContent,'2 projects')
})

