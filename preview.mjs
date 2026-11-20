import {cp, mkdir, readdir, readFile, writeFile} from 'node:fs/promises'
import {dirname, join, relative, resolve} from 'node:path'

const source = resolve('dist')
const destination = resolve('../portfolio-preview')

await mkdir(destination, {recursive:true})
await cp(source, destination, {recursive:true})

async function rewritePages(directory){
  for(const entry of await readdir(directory, {withFileTypes:true})){
    const file = join(directory, entry.name)
    if(entry.isDirectory()){
      await rewritePages(file)
    } else if(entry.name.endsWith('.html')){
      const html = await readFile(file, 'utf8')
      const preview = html.replace(/\b(href|src)="\/(?!\/)([^"]*)"/g, (_, attribute, route)=>{
        const target = join(destination, !route || route.endsWith('/') ? route+'index.html' : route)
        return attribute+'="'+relative(dirname(file), target).replaceAll('\\','/')+'"'
      })
      await writeFile(file, preview)
    }
  }
}

await rewritePages(destination)
console.log('Offline preview: '+join(destination, 'index.html'))
