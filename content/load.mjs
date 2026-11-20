import {readFile} from 'node:fs/promises'

const img = '{alt,caption,"url":asset->url,"width":asset->metadata.dimensions.width,"height":asset->metadata.dimensions.height}'
const query = '{' +
 '"profile":*[_id=="portfolio" && _type=="profile"][0]{...,photo'+img+',resumeFile{"url":asset->url}},' +
 '"certificates":*[_type=="certificate"]|order(coalesce(sortOrder,999),title){...,supportingFile{"url":asset->url}},' +
 '"projects":*[_type=="project"]|order(isFeatured desc,coalesce(sortOrder,999),_updatedAt desc){...,"slug":slug.current,"lastUpdated":coalesce(lastUpdated,_updatedAt),coverImage'+img+',socialImage'+img+',body[]{...,_type in ["figureBlock","diagramBlock"]=>{image'+img+'},_type=="galleryBlock"=>{images[]'+img+'},_type=="fileBlock"=>{"url":file.asset->url}}}}'

export async function loadContent(env=process.env, request=fetch){
 const {SANITY_PROJECT_ID:id,SANITY_DATASET:dataset,SANITY_READ_TOKEN:token,REQUIRE_CMS}=env
 if(!id && !dataset && !token && REQUIRE_CMS!=='1'){
   const profile=JSON.parse(await readFile(new URL('./profile.json',import.meta.url),'utf8'))
   const projects=JSON.parse(await readFile(new URL('./projects.json',import.meta.url),'utf8'))
   return {profile,projects,certificates:[{title:'Digital Image Processing Workshop',issuer:'IEEE RAS'}],local:true}
 }
 if(!/^[a-z0-9]+$/.test(id || '') || !/^[a-z0-9_-]+$/.test(dataset || '')) throw Error('Set SANITY_PROJECT_ID, SANITY_DATASET')
 const endpoint=new URL('https://'+id+'.api.sanity.io/v2025-02-19/data/query/'+dataset)
 endpoint.search=new URLSearchParams({query,perspective:'published'})
 const response=await request(endpoint,{headers:token?{Authorization:'Bearer '+token}:{},signal:AbortSignal.timeout(20000),redirect:'error'})
 if(!response.ok) throw Error('Sanity published-content request failed (HTTP '+response.status+')')
 const {result}=await response.json()
 if(!result?.profile?.name) throw Error('Publish the Portfolio settings document before building')
 const slugs=new Set()
 for(const project of result.projects){
   const {slug,_id}=project
   if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '') || slugs.has(slug) || /^(drafts|versions)\./.test(_id)) throw Error('Invalid published project slug or ID')
   slugs.add(slug)
 }
 return {...result,local:false}
}


