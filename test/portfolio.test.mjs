import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,readFile,cp,rm} from 'node:fs/promises'
import {join} from 'node:path'

import {execFileSync} from 'node:child_process'
import {loadContent} from '../content/load.mjs'
import {image,renderBody,url} from '../render.mjs'

test('local content contains only the approved starter certificate and the four repository projects in display order',async()=>{
 const {projects,profile,certificates}=await loadContent({})
 assert.deepEqual(projects.map(project=>project.slug),['quadruped','vectordrive','geonavigator','odin'])
 assert.equal(profile.name,'Nihal R')
 assert.equal(profile.showPhone,false)
 assert.deepEqual(certificates,[{title:'Digital Image Processing Workshop',issuer:'IEEE RAS'}])
})
test('CMS builds request published content and fail when configuration or the API fails',async()=>{
 const env={SANITY_PROJECT_ID:'abc',SANITY_DATASET:'production',SANITY_READ_TOKEN:'test-only'}
 await assert.rejects(loadContent({REQUIRE_CMS:'1'}),/Set SANITY_PROJECT_ID/)
 await assert.rejects(loadContent(env,async()=>new Response(null,{status:503})),/503/)
 const response = async (endpoint,options)=>{
   assert.equal(endpoint.searchParams.get('perspective'),'published')
   assert.match(endpoint.searchParams.get('query'),/body\[\]/)
   assert.equal(options.headers.Authorization,'Bearer test-only')
   return Response.json({result:{profile:{name:'Test'},certificates:[],projects:[{_id:'a',slug:'case-study'}]}})
 }
 assert.equal((await loadContent(env,response)).projects[0].slug,'case-study')
 for(const project of [{_id:'drafts.a',slug:'case-study'},{_id:'a',slug:'../wrong'}]){
   await assert.rejects(loadContent(env,async()=>Response.json({result:{profile:{name:'Test'},projects:[project]}})),/Invalid published project/)
 }
})
test('technical blocks escape markup and provide video and table fallbacks',()=>{
 assert.equal(renderBody(null),'')
 assert.equal(url('javascript:alert(1)'),'')
 assert.equal(image({url:'data:image/png;base64,x'}),'')
 const result=renderBody([
  {_type:'block',style:'h2',children:[{text:'Test <diagram>'}]},
  {_type:'block',listItem:'bullet',children:[{text:'Sensor'}]},
  {_type:'block',listItem:'bullet',children:[{text:'Controller'}]},
  {_type:'tableBlock',title:'Measurements',headers:['Value'],rows:[{cells:['8']}]},
  {_type:'codeBlock',language:'XML',code:'<robot>'},
  {_type:'videoBlock',title:'Demo',summary:'Simulation clip',url:'https://youtu.be/abcdefghijk'}
 ])
 assert.match(result,/<h2>Test &lt;diagram&gt;<\/h2>/)
 assert.match(result,/<ul><li>Sensor<\/li><li>Controller<\/li><\/ul>/)
 assert.match(result,/<th scope="col">Value<\/th>/)
 assert.match(result,/<code>&lt;robot&gt;<\/code>/)
 assert.ok(result.includes('<iframe src="https://www.youtube-nocookie.com/embed/abcdefghijk"'))
 assert.match(result,/Watch on YouTube/)
})
test('root and repository-base builds generate local routes, assets, metadata and 404',async()=>{
 const folder=await mkdtemp(join(process.cwd(),'.test-build-'))
 try {
   for(const source of ['public','content','build.mjs','render.mjs']) await cp(source,join(folder,source),{recursive:true})
   const env={...process.env,BASE_PATH:'/portfolio',SITE_ORIGIN:'https://example.com',SANITY_PROJECT_ID:'',SANITY_DATASET:'',SANITY_READ_TOKEN:'',REQUIRE_CMS:''}
   const build=()=>execFileSync(process.execPath,['build.mjs'],{cwd:folder,env})
   build()
   const read=name=>readFile(join(folder,'dist',name),'utf8')
   const home=await read('index.html')
   const paths=['about','projects','skills','education-experience','certificates','resume','contact']
   for(const route of paths){
    assert.ok(home.includes('href="/portfolio/'+route+'/"'))
    assert.match(await read(route+'/index.html'),/<h1>/)
   }
   assert.match(home,/https:\/\/example\.com\/portfolio\//)
   assert.match(home,/Selected projects/)
   const projectIndex=await read('projects/index.html')
   for(const [slug,videoId] of [['vectordrive','B0RJNDL_aM8'],['geonavigator','wE72Vkd57ok'],['odin','w9DVEHxZn8Y']]){
    assert.ok(projectIndex.includes('href="/portfolio/projects/'+slug+'/"'))
    const detail=await read('projects/'+slug+'/index.html')
    assert.ok(detail.includes('src="/portfolio/media/projects/'+slug+'.jpg"'))
    assert.ok(detail.includes('<iframe src="https://www.youtube-nocookie.com/embed/'+videoId+'"'))
    assert.match(detail,/blob\/main\/README\.md/)
    assert.ok((await readFile(join(folder,'dist','media','projects',slug+'.jpg'))).length>0)
   }
   assert.ok(projectIndex.indexOf('/projects/quadruped/') < projectIndex.indexOf('/projects/vectordrive/'))
   assert.ok(home.includes('href="/portfolio/projects/quadruped/"'))
   assert.ok(home.indexOf('/projects/quadruped/') < home.indexOf('/projects/vectordrive/'))
   const quadruped=await read('projects/quadruped/index.html')
   const media=[...new Set([...quadruped.matchAll(/(?:src|href)="\/portfolio\/media\/projects\/quadruped\/([^"]+)"/g)].map(match=>match[1]))]
   assert.equal(media.length,15)
   for(const file of media) assert.ok((await readFile(join(folder,'dist','media','projects','quadruped',file))).length>0)
   assert.equal((quadruped.match(/href="https:\/\/drive\.google\.com\/file\/d\//g) || []).length,2)
   assert.match(await read('404.html'),/content="noindex"/)
   assert.match(await read('sitemap.xml'),/https:\/\/example\.com\/portfolio\/certificates\//)
   env.BASE_PATH=''
   build()
   assert.match(await read('index.html'),/href="\/site\.css"/)
 }finally{await rm(folder,{force:true,recursive:true})}
})



