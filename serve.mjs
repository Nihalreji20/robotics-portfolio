import {createServer} from 'node:http'
import {readFile} from 'node:fs/promises'
import {resolve, extname, sep} from 'node:path'
const root = resolve('dist')
const base = process.env.BASE_PATH?.replace(/\/$/, '') || ''
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.pdf':'application/pdf','.xml':'application/xml','.txt':'text/plain'}
createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname)
    if (!pathname.startsWith(base + '/')) throw Error('outside preview')
    const path = pathname.slice(base.length)
    const file = resolve(root, '.' + path + (path.endsWith('/') ? 'index.html' : ''))
    if (!file.startsWith(root + sep)) throw Error('outside preview')
    const data = await readFile(file)
    res.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream'}).end(data)
  } catch {
    res.writeHead(404, {'Content-Type':types['.html']}).end(await readFile(resolve(root,'404.html')))
  }
}).listen(4173,'127.0.0.1',() => console.log('http://127.0.0.1:4173'+base+'/'))

