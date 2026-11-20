import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemas} from './schema.js'
import {ProjectPreview} from './preview.jsx'

const caseStudyTemplate = {
 id:'engineering-case-study',
 title:'Engineering case study outline',
 schemaType:'project',
 value:{
  status:'Idea',
  body:['Problem and objective','System overview','Design and implementation','Testing and evidence','Challenges and iterations','Limitations and next steps','References and acknowledgements'].map((text,index)=>({
   _type:'block', _key:'section-'+index, style:'h2',
   children:[{_type:'span',_key:'title-'+index,text,marks:[]}], markDefs:[]
  }))
 }
}

export default defineConfig({
 name:'portfolio',
 title:'Portfolio editor',
 projectId:process.env.SANITY_STUDIO_PROJECT_ID,
 dataset:process.env.SANITY_STUDIO_DATASET,
 plugins:[structureTool({
  structure:S=>S.list().title('Portfolio').items([
    S.listItem().id('portfolio').title('Portfolio settings').child(S.document().schemaType('profile').documentId('portfolio')),
    S.documentTypeListItem('project').title('Projects'),
    S.documentTypeListItem('certificate').title('Certificates')
  ]),
  defaultDocumentNode:(S,{schemaType})=>S.document().views(schemaType==='project'
    ? [S.view.form(),S.view.component(ProjectPreview).title('Draft preview')]
    : [S.view.form()])
 })],
 schema:{types:schemas,templates:items=>[...items.filter(x=>x.schemaType!=='profile'),caseStudyTemplate]},
 document:{actions:(actions,{schemaType})=>schemaType==='profile'
  ? actions.filter(x=>!['delete','duplicate','unpublish'].includes(x.action))
  : actions}
})

