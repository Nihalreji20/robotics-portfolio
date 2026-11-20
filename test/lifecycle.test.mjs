import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,readFile,writeFile,cp,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {execFileSync} from 'node:child_process'

test('published projects get stable HTML routes, and successful rebuilds remove unpublished routes',async()=>{
 const folder=await mkdtemp(join(process.cwd(),'.test-build-'))
 try {
  for(const source of ['public','content','build.mjs','render.mjs']) await cp(source,join(folder,source),{recursive:true})
  const env={...process.env,SANITY_PROJECT_ID:'abc',SANITY_DATASET:'production',SANITY_READ_TOKEN:'',SITE_ORIGIN:'https://example.com',BASE_PATH:'/portfolio'}
  await writeFile(join(folder,'mock.mjs'),"import {readFile} from 'node:fs/promises'; globalThis.fetch=async () => new Response(await readFile('mock.json'),{headers:{'Content-Type':'application/json'}})")
  const profile=JSON.parse(await readFile('content/profile.json','utf8'))
  const project={_id:'test',slug:'fixture',title:'Rendering fixture',summary:'First published revision.',primaryCategory:'Test',status:'Simulation',isFeatured:true,body:[{_type:'equationBlock',title:'Notation',notation:'x = 1'}]}
  const publish=async projects=>{
   await writeFile(join(folder,'mock.json'),JSON.stringify({result:{profile,projects,certificates:[]}}))
   execFileSync(process.execPath,['--import','./mock.mjs','build.mjs'],{cwd:folder,env})
  }
  const read=file=>readFile(join(folder,'dist',file),'utf8')
  await publish([project])
  assert.match(await read('index.html'),/Selected projects/)
  assert.match(await read('projects/index.html'),/data-status="Simulation"/)
  assert.match(await read('projects/fixture/index.html'),/First published revision/)
  assert.match(await read('projects/fixture/index.html'),/https:\/\/example.com\/portfolio\/projects\/fixture\//)
  assert.match(await read('projects/fixture/index.html'),/x = 1/)
  await assert.rejects(read('media/resume.pdf'),{code:'ENOENT'})
  await publish([{...project,summary:'Second published revision.'}])
  assert.match(await read('projects/fixture/index.html'),/Second published revision/)
  await publish([])
  await assert.rejects(read('projects/fixture/index.html'),{code:'ENOENT'})
  assert.doesNotMatch(await read('sitemap.xml'),/fixture/)
 }finally{await rm(folder,{recursive:true,force:true})}
})

