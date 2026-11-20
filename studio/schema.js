import {defineType,defineField} from 'sanity'

const field=(name,type,extra={})=>defineField({name,type,...extra})
const req=rule=>rule.required()
const str=(name,required=false)=>field(name,'string',required?{validation:req}:{})
const txt=(name,required=false)=>field(name,'text',required?{validation:req}:{})
const link=(name,required=false)=>field(name,'url',{validation:r=>(required?r.required():r).uri({scheme:['https']})})
const flag=(name,initialValue=false)=>field(name,'boolean',{initialValue})
const arr=(name,...of)=>field(name,'array',{of})
const strings=name=>arr(name,{type:'string'})
const object=(name,title,fields,preview)=>defineType({name,title,type:'object',fields,...(preview?{preview:{select:preview}}:{})})
const ref={type:'reference',to:[{type:'project'}],weak:true}
const media=(name,required=false)=>field(name,'image',{fields:[str('alt',true),str('caption')],...(required?{validation:req}:{})})
const file=(name,required=false)=>field(name,'file',required?{validation:req}:{})
const status=['Idea','In Progress','Simulation','Prototype','Completed','Archived']
const blocks=[
 object('figureBlock','Image',[media('image',true)],{title:'image.alt',media:'image'}),
 object('diagramBlock','Diagram',[media('image',true)],{title:'image.alt',media:'image'}),
 object('galleryBlock','Gallery',[arr('images',media('image'))]),
 object('videoBlock','Video',[str('title',true),link('url',true),txt('summary',true)],{title:'title',subtitle:'url'}),
 object('fileBlock','Download',[str('title',true),file('file',true)],{title:'title'}),
 object('codeBlock','Code',[str('language',true),txt('code',true)],{title:'language',subtitle:'code'}),
 object('tableBlock','Table',[str('title',true),strings('headers'),arr('rows',{type:'tableRow'})],{title:'title'}),
 object('metricsBlock','Metrics',[str('title',true),arr('metrics',{type:'fact'})],{title:'title'}),
 object('calloutBlock','Quote or note',[str('title',true),txt('text',true),str('attribution')],{title:'title',subtitle:'text'}),
 object('timelineBlock','Timeline',[str('title',true),arr('entries',{type:'milestone'})],{title:'title'}),
 object('linkBlock','External link',[str('title',true),link('url',true)],{title:'title',subtitle:'url'}),
 object('equationBlock','Equation',[str('title',true),txt('notation',true),txt('explanation')],{title:'title',subtitle:'notation'})
]
const richText={type:'block',styles:[{title:'Normal',value:'normal'},{title:'Heading 2',value:'h2'},{title:'Heading 3',value:'h3'},{title:'Quote',value:'blockquote'}],marks:{decorators:[{title:'Bold',value:'strong'},{title:'Italic',value:'em'},{title:'Inline code',value:'code'}],annotations:[{name:'link',type:'object',fields:[link('href',true)]}]}}
export const schemas=[
 object('fact','Fact',[str('label',true),str('value',true)],{title:'label',subtitle:'value'}),
 object('tableRow','Row',[strings('cells')]),
 object('milestone','Milestone',[str('period'),str('title',true),txt('description')],{title:'title',subtitle:'period'}),
 object('skillGroup','Skill group',[str('title',true),strings('items'),strings('preview'),arr('projects',ref)],{title:'title'}),
 object('historyEntry','Education or experience',[field('kind','string',{options:{list:['Education','Experience']},validation:req}),str('title',true),str('organization',true),str('period'),txt('description'),flag('showOnHome',true)],{title:'title',subtitle:'organization'}),
 ...blocks,
 defineType({name:'profile',title:'Portfolio settings',type:'document',fields:[
  str('name',true),str('descriptor',true),txt('intro',true),media('photo'),arr('facts',{type:'fact'}),txt('homeAbout'),txt('about'),
  arr('skills',{type:'skillGroup'}),arr('history',{type:'historyEntry'}),arr('featuredProjects',ref),txt('projectsIntro'),
  file('resumeFile'),link('resumeUrl'),str('resumeLabel'),txt('contactIntro'),str('location'),flag('showLocation',true),
  field('email','email'),flag('showEmail',true),str('phone'),flag('showPhone'),link('github'),flag('showGithub',true),link('linkedin'),flag('showLinkedin',true),str('footer')
 ]}),
 defineType({name:'certificate',title:'Certificate',type:'document',fields:[
  str('title',true),str('issuer',true),field('date','date'),link('credentialUrl'),file('supportingFile'),field('sortOrder','number')
 ],preview:{select:{title:'title',subtitle:'issuer'}}}),
 defineType({name:'project',title:'Project case study',type:'document',fields:[
  str('title',true),field('slug','slug',{options:{source:'title'},validation:r=>r.required().custom(value=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value?.current || '')||'Use lowercase letters, numbers, and hyphens.')}),field('summary','text',{validation:r=>r.required().max(300)}),
  field('status','string',{options:{list:status},initialValue:'Idea',validation:req}),str('primaryCategory',true),strings('tags'),media('coverImage',true),
  flag('isFeatured'),field('sortOrder','number'),field('startDate','date'),field('endDate','date'),field('lastUpdated','date'),
  str('role'),str('teamContext'),field('evidence','string',{options:{list:['Proposal','Simulation','Bench testing','Field testing']}}),
  strings('hardware'),strings('software'),link('repositoryUrl'),link('demoUrl'),link('reportUrl'),
  arr('body',richText,...blocks.map(({name})=>({type:name}))),arr('relatedProjects',ref),
  str('seoTitle'),txt('seoDescription'),media('socialImage')
 ],preview:{select:{title:'title',subtitle:'status',media:'coverImage'}}})
]

