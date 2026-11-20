import {readFile} from 'node:fs/promises'
const profile=JSON.parse(await readFile(new URL('../content/profile.json',import.meta.url),'utf8'))
const facts=profile.facts.map((x,i)=>({...x,_type:'fact',_key:'fact'+i}))
const skills=profile.skills.map((x,i)=>({...x,_type:'skillGroup',_key:'skill'+i}))
const history=profile.history.map((x,i)=>({...x,_type:'historyEntry',_key:'entry'+i}))
const baseDocuments=[
 {...profile,_id:'portfolio',_type:'profile',facts,skills,history},
 {_id:'ieee-ras-digital-image-processing',_type:'certificate',title:'Digital Image Processing Workshop',issuer:'IEEE RAS'}
]
const projects=JSON.parse(await readFile(new URL('../content/projects.json',import.meta.url),'utf8'))
const asset=(kind,file)=>kind+'@'+new URL('../public/media/projects/'+file,import.meta.url).href
const image=({file,alt,caption})=>({_type:'image',alt,caption,_sanityAsset:asset('image',file)})
const projectDocuments=projects
 .filter(({slug})=>!process.argv[3] || slug===process.argv[3])
 .map(({slug,coverImage,body,...project})=>({
  ...project,
  slug:{_type:'slug',current:slug},
  coverImage:image(coverImage),
  body:body.map(({image:figure,localFile,...block})=>({
   ...block,
   ...(figure?{image:image(figure)}:{}),
   ...(localFile?{file:{_type:'file',_sanityAsset:asset('file',localFile)}}:{})
  }))
 }))
for(const doc of process.argv.includes('--projects') ? projectDocuments : baseDocuments) console.log(JSON.stringify(doc))
