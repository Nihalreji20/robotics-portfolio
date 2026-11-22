import {access,writeFile,mkdir,cp,mkdtemp,rm,rename} from 'node:fs/promises'
import {dirname,join} from 'node:path'
import {loadContent} from './content/load.mjs'
import {e, paragraphs, url, image, imageTag, renderBody, icon} from './render.mjs'

if (!process.env.SANITY_PROJECT_ID && !process.env.SANITY_DATASET) {
 try {
  process.loadEnvFile('studio/.env')
  process.env.SANITY_PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID
  process.env.SANITY_DATASET = process.env.SANITY_STUDIO_DATASET
 } catch (error) {
  if (error.code !== 'ENOENT') throw error
 }
}

const base = (process.env.BASE_PATH || '').replace(/\/$/, '')
if (base && !/^\/[a-zA-Z0-9._-]+$/.test(base)) throw Error('Invalid BASE_PATH')
const path = route => base + route
const site = process.env.SITE_ORIGIN ? new URL(process.env.SITE_ORIGIN).origin : ''
const {profile:p, projects, certificates, local} = await loadContent()
const alternateNames = ['Nihal Reji','Nihal R','Nihal'].filter(name=>name!==p.name)
const nav = [['/','Home'],['/about/','About'],['/projects/','Projects'],['/skills/','Skills & Tools'],['/education-experience/','Education & Experience'],['/certificates/','Certificates'],['/resume/','Resume'],['/contact/','Contact']]
const a = (route,label,cls='',symbol='') => '<a class="'+cls+'" href="'+e(path(route))+'">'+(symbol?icon(symbol):'')+e(label)+'</a>'
const external = (href,label,cls='') => href ? '<a class="'+cls+'" href="'+e(href)+'">'+e(label)+'</a>' : ''
const links = [
  [p.showEmail && p.email ? 'mailto:'+p.email : '', 'Email'],
  [p.showGithub && url(p.github),'GitHub'],
  [p.showLinkedin && url(p.linkedin),'LinkedIn'],
  [p.showPhone && p.phone ? 'tel:'+p.phone.replace(/[^\d+]/g,'') : '', 'Phone']
]
const socials = links.map(([href,label])=>external(href,label)).join('')
const portrait = p.photo ? imageTag(p.photo,'portrait',true) : local ? '<img class="portrait" src="'+path('/media/portrait.jpg')+'" alt="'+e(p.photoAlt)+'" width="768" height="1000" fetchpriority="high">' : ''
const hasLocalResume = local && await access('public/media/resume.pdf').then(()=>true,()=>false)
const resume = url(p.resumeFile?.url) || url(p.resumeUrl) || (hasLocalResume ? path('/media/resume.pdf') : '')
const resumeDownload = resume && (()=>{
 if(hasLocalResume) return '<a class="button primary" href="'+e(resume)+'" download>Download resume (PDF)</a>'
 const download=new URL(resume)
 if(download.hostname==='cdn.sanity.io') download.searchParams.set('dl','resume.pdf')
 return external(download.href,'Download resume (PDF)','button primary')
})()
const list = (items=[]) => '<ul class="tags">'+items.map(x=>'<li>'+e(x)+'</li>').join('')+'</ul>'
const heading = (num,title,intro='') => '<header class="page-head"><p class="eyebrow">'+e(num)+'</p><h1>'+e(title)+'</h1>'+paragraphs(intro)+'</header>'
const section = (num,title,body,cta='') => '<section class="section"><div class="section-head"><div><p class="eyebrow">'+num+'</p><h2>'+e(title)+'</h2></div>'+cta+'</div>'+body+'</section>'
const skillIcons = new Map([
 ['Robotics & Simulation','scan'],
 ['CAD & Mechanical Design','box'],
 ['Embedded Systems & Electronics','board'],
 ['Programming, Vision & Tools','code']
])
const skillGrid = preview => '<div class="skill-grid">'+(p.skills || []).filter(g=>!preview || g.preview?.length).map(g=>'<article><span class="skill-icon">'+icon(skillIcons.get(g.title) || 'folder')+'</span><h'+(preview?3:2)+'>'+e(g.title)+'</h'+(preview?3:2)+'>'+list(preview ? g.preview : g.items)+(preview?'':(g.projects || []).map(x=>projectLink(x)).join(' '))+'</article>').join('')+'</div>'
const history = (preview,level=preview?3:2) => '<ol class="timeline">'+(p.history || []).filter(x=>!preview || x.showOnHome).map(x=>'<li><p class="mono">'+e([x.kind,x.period].filter(Boolean).join(' / '))+'</p><h'+level+'>'+e(x.title)+'</h'+level+'><p>'+e(x.organization)+'</p>'+(preview?'':paragraphs(x.description))+'</li>').join('')+'</ol>'
const projectRoute = x=>'/projects/'+x.slug+'/'
const localMedia = file=>local && file ? path('/media/projects/'+file) : ''
const projectLink = id=>{const x=projects.find(item=>item._id===(id._ref || id));return x?a(projectRoute(x),x.title):''}
function card(x, level){
 const search = [x.title,x.summary,x.primaryCategory,...(x.tags||[]),...(x.hardware||[]),...(x.software||[])].join(' ').toLowerCase()
 const cover = image(x.coverImage,'cover',false,localMedia(x.coverImage?.file)) || '<div class="cover cover-empty" aria-hidden="true">Project field notes</div>'
 return `<article class="project" data-category="${e(x.primaryCategory)}" data-status="${e(x.status)}" data-date="${e(x.lastUpdated)}" data-search="${e(search)}">
   ${cover}
   <div class="card-body">
    <p class="mono">${e(x.primaryCategory)} <span class="status">${e(x.status)}</span></p>
    <h${level}>${e(x.title)}</h${level}>
    <p>${e(x.summary)}</p>
    ${list((x.tags||[]).slice(0,3))}
    ${a(projectRoute(x),'View project →')}
   </div>
 </article>`
}
const grid = (xs,level=2)=>'<div class="project-grid" id="project-grid">'+xs.map(x=>card(x,level)).join('')+'</div>'
const preferred = (p.featuredProjects || []).map(ref=>projects.find(x=>x._id===ref._ref)).filter(Boolean)
const featured = (preferred.length ? preferred : projects.filter(x=>x.isFeatured)).slice(0,3)
const home = '<section class="hero'+(portrait?'':' no-photo')+'"><div><p class="eyebrow">Personal portfolio</p><h1>'+e(p.name)+'</h1><p class="descriptor">'+e(p.descriptor)+'</p><div class="lead">'+paragraphs(p.intro)+'</div><div class="actions">'+a('/projects/','Explore projects','button primary','folder')+(resume?a('/resume/','View resume','button','file'):'')+'</div>'+(p.showGithub?external(url(p.github),'GitHub ↗','quiet'):'')+'</div>'+(portrait?'<figure class="portrait-frame">'+portrait+'<figcaption><span>01 / Profile</span><span>'+e(p.showLocation?p.location:'')+'</span></figcaption></figure>':'')+'</section>'+
((p.facts||[]).length?'<section class="glance" aria-labelledby="glance"><h2 id="glance" class="eyebrow">At a glance</h2><dl>'+p.facts.filter(f=>p.showLocation || f.value!==p.location).map(f=>'<div><dt>'+e(f.label)+'</dt><dd>'+e(f.value)+'</dd></div>').join('')+'</dl></section>':'')+
(p.homeAbout?section('01 / Profile','About me','<div class="reading">'+paragraphs(p.homeAbout)+'</div>',a('/about/','More about me →')):'')+
((p.skills||[]).some(g=>g.preview?.length)?section('02 / Toolkit','Skills & tools',skillGrid(true),a('/skills/','All skills →')):'')+
((p.history||[]).some(x=>x.showOnHome)?section('03 / Background','Education & experience',history(true),a('/education-experience/','Full background →')):'')+
(featured.length?section('04 / Case studies','Selected projects',grid(featured,3),a('/projects/','View all projects →')):'')+
(resume?'<section class="resume-band"><div><p class="eyebrow">Resume / PDF</p><h2>Education, experience & skills</h2></div>'+a('/resume/','View resume →','button')+'</section>':'')
const options = (label,all,values)=>'<label>'+label+'<select name="'+label.toLowerCase()+'"><option value="">'+all+'</option>'+[...new Set(values)].sort().map(v=>'<option>'+e(v)+'</option>').join('')+'</select></label>'
const filters = '<form id="filters" class="filters" hidden><label>Search<input type="search" name="q" placeholder="Title, technology or keyword"></label>'+options('Category','All categories',projects.map(x=>x.primaryCategory))+options('Status','All statuses',projects.map(x=>x.status))+'<label>Sort<select name="sort"><option value="">Featured / relevance</option><option value="recent">Recently updated</option></select></label><button class="button" type="reset">Clear filters</button></form>'
const pages = [
  ['/','Home',p.intro,home,p.photo?.url || (local?path('/media/portrait.jpg'):'')],
  ['/about/','About '+p.name,p.homeAbout,heading('01 / Profile','About '+p.name)+'<div class="reading"><p>Also known as '+e(alternateNames.join(' and '))+'.</p>'+paragraphs(p.about)+'<div class="actions">'+socials+(resume?a('/resume/','View resume →'):'')+'</div></div>'],
  ['/projects/','Projects',p.projectsIntro,heading('02 / Project library','Projects',p.projectsIntro)+(projects.length?filters+'<p id="results" role="status"></p>'+grid(projects)+'<script defer src="'+path('/filters.js')+'"></script>':'<section class="empty"><p class="eyebrow">Project library</p><h2>No projects published yet</h2><p>Case studies will appear here as they’re published.</p>'+a('/skills/','Explore skills & tools →')+'</section>')],
  ['/skills/','Skills & tools','Engineering skills and tools',heading('03 / Toolkit','Skills & tools')+skillGrid(false)],
  ['/education-experience/','Education & experience','Education and technical experience',heading('04 / Background','Education & experience')+history(false)],
  ['/certificates/','Certificates','Certificates and workshops',heading('05 / Credentials','Certificates')+'<div class="timeline">'+certificates.map(c=>'<article><p class="mono">'+e(c.issuer)+'</p><h2>'+e(c.title)+'</h2>'+paragraphs(c.date)+external(url(c.credentialUrl),'View credential ↗')+' '+external(url(c.supportingFile?.url),'Download supporting file')+'</article>').join('')+(certificates.length?'':'<p>No certificates published yet.</p>')+'</div>'],
  ['/resume/','Resume','Resume and professional summary',heading('06 / Resume','Resume',p.resumeLabel)+(resume?'<div class="actions">'+resumeDownload+external(resume,'Open PDF')+'</div>':'<p>A resume PDF is currently unavailable.</p>')+'<div class="reading">'+paragraphs(p.homeAbout)+'</div>'+history(true,2)],
  ['/contact/','Contact',p.contactIntro,heading('07 / Contact','Contact',p.contactIntro)+'<div class="contact-links">'+links.filter(([href])=>href).map(([href,label])=>external(href,label==='Email'?p.email:label==='Phone'?p.phone:label+' ↗','button')).join('')+'</div>'+paragraphs(p.showLocation?p.location:'')],
  ['/404.html','Page not found','Page not found',heading('404 / Page not found','This page is unavailable','The address may have changed, or the page may have been unpublished.')+'<div class="actions">'+a('/','Back to home','button primary')+a('/projects/','Browse projects','button')+'</div>']
]
for(const x of projects){
  const meta = [['Role',x.role],['Team',x.teamContext],['Evidence',x.evidence],['Hardware',x.hardware?.join(', ')],['Software',x.software?.join(', ')],['Period',[x.startDate,x.endDate].filter(Boolean).join(' – ')],['Updated',x.lastUpdated?.slice(0,10)]]
  const related=(x.relatedProjects||[]).map(projectLink).filter(Boolean)
  pages.push([projectRoute(x),x.title,x.seoDescription||x.summary,'<p class="crumb">'+a('/projects/','← All projects')+'</p>'+heading(x.primaryCategory+' / '+x.status,x.title,x.summary)+image(x.coverImage,'project-hero',true,localMedia(x.coverImage?.file))+
  '<div class="actions">'+external(url(x.repositoryUrl),'Repository ↗','button')+external(url(x.demoUrl),'Demo ↗','button')+external(url(x.reportUrl),'Report ↗','button')+'</div><dl class="project-facts">'+meta.filter(([,v])=>v).map(([k,v])=>'<div><dt>'+e(k)+'</dt><dd>'+e(v)+'</dd></div>').join('')+'</dl><div class="reading article">'+renderBody(x.body,localMedia)+(related.length?'<h2>Related projects</h2><ul>'+related.map(link=>'<li>'+link+'</li>').join('')+'</ul>':'')+'</div>',x.socialImage?.url||x.coverImage?.url||localMedia(x.coverImage?.file),x.seoTitle])
}
function layout(route,title,description,body,socialImage,seoTitle){
 const isHome = route==='/'
 const fullTitle = isHome ? p.name+' | Robotics & Embedded Systems Portfolio' : (seoTitle || title)+' | '+p.name
 const pageDescription = isHome ? 'Robotics, embedded systems, and simulation projects by '+p.name+' ('+alternateNames[0]+').' : description
 const canonical = site && route !== '/404.html' ? site+path(route) : ''
 const social = socialImage && site ? new URL(socialImage,site).href : ''
 const sameAs = links.filter(([,label])=>label==='GitHub' || label==='LinkedIn').map(([href])=>href).filter(Boolean)
 const structuredProfile = isHome && canonical ? '<script type="application/ld+json">'+JSON.stringify({
   '@context':'https://schema.org','@type':'ProfilePage',url:canonical,
   mainEntity:{
    '@type':'Person','@id':canonical+'#nihal',name:p.name,alternateName:alternateNames,
    description:p.descriptor,url:canonical,
    ...(social?{image:social}:{}),...(sameAs.length?{sameAs}:{})
   }
 }).replaceAll('<','\\u003c')+'</script>' : ''
 const navLinks = nav.map(([href,label])=>'<a href="'+path(href)+'"'+(route===href || (href==='/projects/'&&route.startsWith(href))?' aria-current="'+(route===href?'page':'location')+'"':'')+'>'+e(label)+'</a>').join('')
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+e(fullTitle)+'</title><meta name="description" content="'+e(pageDescription)+'"><meta property="og:type" content="website"><meta property="og:title" content="'+e(fullTitle)+'"><meta property="og:description" content="'+e(pageDescription)+'">'+(canonical?'<link rel="canonical" href="'+e(canonical)+'"><meta property="og:url" content="'+e(canonical)+'">':'')+(social?'<meta property="og:image" content="'+e(social)+'">':'')+structuredProfile+(route==='/404.html'?'<meta name="robots" content="noindex">':'')+'<script src="'+path('/theme.js')+'"></script><link rel="stylesheet" href="'+path('/site.css')+'"><script defer src="'+path('/menu.js')+'"></script></head><body><a class="skip" href="#main">Skip to content</a><header class="site-header"><div class="wrap header-row">'+a('/',p.name,'wordmark')+'<button class="button theme-toggle" type="button" aria-pressed="false" hidden>Dark mode</button><button class="button menu-toggle" type="button" aria-controls="main-nav" aria-expanded="false" hidden>Menu</button><nav id="main-nav" aria-label="Main navigation">'+navLinks+'</nav></div></header><main id="main" class="wrap" tabindex="-1">'+body+'</main><footer><div class="wrap footer-row"><div><strong>'+e(p.name)+'</strong><p>'+e(p.footer)+'</p><small>© '+new Date().getUTCFullYear()+' '+e(p.name)+'</small></div><nav aria-label="Footer navigation">'+a('/projects/','Projects')+a('/resume/','Resume')+a('/contact/','Contact')+socials+'</nav></div></footer></body></html>'
}
const stage = await mkdtemp('.build-')
try {
 await cp('public',stage,{recursive:true,filter:src=>local || !/[\\/]media(?:[\\/]|$)/.test(src)})
 for(const page of pages){
   const route = page[0]
   const file = join(stage,route.slice(1)+(route.endsWith('/')?'index.html':''))
   await mkdir(dirname(file),{recursive:true})
   await writeFile(file,layout(...page))
 }
 await writeFile(join(stage,'.nojekyll'),'')
 await writeFile(join(stage,'robots.txt'),'User-agent: *\nAllow: /\n'+(site?'Sitemap: '+site+path('/sitemap.xml')+'\n':''))
 if(site) await writeFile(join(stage,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+pages.filter(([r])=>r!=='/404.html').map(([r])=>'<url><loc>'+e(site+path(r))+'</loc></url>').join('')+'</urlset>')
 await rm('dist',{recursive:true,force:true})
 await rename(stage,'dist')
 console.log('Built '+pages.length+' pages from '+(local?'local content':'published CMS content'))
} finally {await rm(stage,{recursive:true,force:true})}




