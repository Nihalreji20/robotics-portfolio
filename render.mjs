export const e = (value='')=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
export const paragraphs = text=>text ? text.trim().split(/\n\s*\n/).map(p=>'<p>'+e(p)+'</p>').join('') : ''

export function url(value){
 try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}
}
export function imageTag(x,cls='',priority=false,localSrc=''){
 const src=localSrc || url(x?.url)
 if(!src) return ''
 const width = Math.min(x.width || 1200,cls==='cover'?720:1200)
 const height = Math.round(width*(x.height || 800)/(x.width || 1200))
 const u = localSrc ? null : new URL(src)
 if(u?.hostname==='cdn.sanity.io'){u.searchParams.set('w',width);u.searchParams.set('auto','format')}
 return '<img src="'+e(u?.href || src)+'" alt="'+e(x.alt)+'" width="'+width+'" height="'+height+'" '+(priority?'fetchpriority="high"':'loading="lazy"')+' decoding="async">'
}
export function image(x,cls='',priority=false,localSrc=''){
 const tag=imageTag(x,cls,priority,localSrc)
 return tag?'<figure class="'+cls+'">'+tag+(x.caption?'<figcaption>'+e(x.caption)+'</figcaption>':'')+'</figure>':''
}
function link(href,label){
 return url(href)?'<a href="'+e(url(href))+'" target="_blank" rel="noopener noreferrer">'+e(label)+'</a>':''
}
function video(x){
 const href=url(x.url)
 if(!href) return paragraphs(x.summary)
 const u=new URL(href)
 const id=u.hostname==='youtu.be'?u.pathname.slice(1):['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)?u.searchParams.get('v'):''
 const player=/^[\w-]{11}$/.test(id || '')?
   '<iframe src="https://www.youtube-nocookie.com/embed/'+id+'" title="'+e(x.title)+'" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>':''
 return '<section><h2>'+e(x.title)+'</h2>'+paragraphs(x.summary)+player+link(href,player?'Watch on YouTube ↗':'Watch on the video platform ↗')+'</section>'
}
function spans(block){
 return (block.children || []).map(span=>{
  let value=e(span.text).replace(/\n/g,'<br>')
  for(const mark of span.marks || []){
   if(['strong','em','code'].includes(mark)) value='<'+mark+'>'+value+'</'+mark+'>'
   else {
    const href=url(block.markDefs?.find(def=>def._key===mark)?.href)
    if(href) value='<a href="'+e(href)+'">'+value+'</a>'
   }
  }
  return value
 }).join('')
}
function renderBlock(x,localMedia){
 switch(x._type){
  case 'block':{
   const tag=['h2','h3','blockquote'].includes(x.style)?x.style:'p'
   return '<'+tag+'>'+spans(x)+'</'+tag+'>'
  }
  case 'figureBlock': case 'diagramBlock': return image(x.image,'',false,localMedia(x.image?.file))
  case 'galleryBlock': return '<div class="gallery">'+(x.images || []).map(item=>image(item)).join('')+'</div>'
  case 'videoBlock': return video(x)
  case 'fileBlock': {
   const source=localMedia(x.localFile)
   return source?'<p><a href="'+e(source)+'" download>'+e(x.title)+'</a></p>':'<p>'+link(x.url,x.title)+'</p>'
  }
  case 'linkBlock': return '<p>'+link(x.url,x.title)+'</p>'
  case 'codeBlock': return '<figure><figcaption>'+e(x.language)+'</figcaption><pre tabindex="0"><code>'+e(x.code)+'</code></pre></figure>'
  case 'tableBlock':{
   const headers=x.headers || []
   return '<div class="table-scroll" tabindex="0" role="region" aria-label="'+e(x.title)+'"><table><caption>'+e(x.title)+'</caption><thead><tr>'+headers.map(h=>'<th scope="col">'+e(h)+'</th>').join('')+'</tr></thead><tbody>'+(x.rows || []).map(r=>'<tr>'+headers.map((_,i)=>'<td>'+e(r.cells?.[i])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'
  }
  case 'metricsBlock': return '<h2>'+e(x.title)+'</h2><dl class="project-facts">'+(x.metrics || []).map(m=>'<div><dt>'+e(m.label)+'</dt><dd>'+e(m.value)+'</dd></div>').join('')+'</dl>'
  case 'calloutBlock': return '<figure><blockquote><strong>'+e(x.title)+'</strong>'+paragraphs(x.text)+'</blockquote>'+(x.attribution?'<figcaption>'+e(x.attribution)+'</figcaption>':'')+'</figure>'
  case 'timelineBlock': return '<h2>'+e(x.title)+'</h2><ol class="timeline">'+(x.entries || []).map(m=>'<li><p class="mono">'+e(m.period)+'</p><h3>'+e(m.title)+'</h3>'+paragraphs(m.description)+'</li>').join('')+'</ol>'
  case 'equationBlock': return '<h2>'+e(x.title)+'</h2><pre tabindex="0">'+e(x.notation)+'</pre>'+paragraphs(x.explanation)
  default:return ''
 }
}
export function renderBody(blocks,localMedia=()=>''){
 let markup='',list=''
 for(const x of blocks || []){
  const type=x._type==='block' && x.listItem?(x.listItem==='number'?'ol':'ul'):''
  if(list!==type){
   if(list) markup+='</'+list+'>'
   if(type) markup+='<'+type+'>'
   list=type
  }
  markup+=type?'<li>'+spans(x)+'</li>':renderBlock(x,localMedia)
 }
 return markup+(list?'</'+list+'>':'')
}



