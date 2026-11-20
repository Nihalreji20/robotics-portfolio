import React from 'react'
import {useClient} from 'sanity'
import {e, image, paragraphs, renderBody} from '../render.mjs'

export function ProjectPreview({document}){
 const client=useClient({apiVersion:'2025-02-19'})
 const {projectId,dataset}=client.config()
 const value=document.displayed || {}
 const cdn='https://cdn.sanity.io/'
 function asset(reference,kind){
   const match=(reference?._ref || '').match(kind==='images'
     ? /^image-([a-z0-9]+)-(\d+x\d+)-([a-z0-9]+)$/
     : /^file-([a-z0-9]+)-([a-z0-9]+)$/)
   if(!match) return ''
   const filename=kind==='images'?match[1]+'-'+match[2]+'.'+match[3]:match[1]+'.'+match[2]
   return cdn+kind+'/'+projectId+'/'+dataset+'/'+filename
 }
 const photo=x=>x?{...x,url:asset(x.asset,'images')}:undefined
 const body=(value.body || []).map(x=>({...x,image:photo(x.image),images:x.images?.map(photo),url:x._type==='fileBlock'?asset(x.file?.asset,'files'):x.url}))
 return <iframe title="Current project draft" sandbox="allow-popups" style={{width:'100%',height:'85vh',border:0}} srcDoc={
   '<meta charset="utf-8"><style>body{font:16px/1.6 system-ui;margin:24px;color:#18212b}img{max-width:100%;height:auto}figure{margin:16px 0}pre{overflow:auto}iframe{width:100%;aspect-ratio:16/9;border:0}</style><p>Studio preview</p><h1>'+
   e(value.title || 'Untitled project')+'</h1><p>'+e(value.status)+'</p>'+paragraphs(value.summary)+image(photo(value.coverImage))+renderBody(body)
 }/>
}

