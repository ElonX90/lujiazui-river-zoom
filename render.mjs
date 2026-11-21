import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)), frames=path.join(dir,'frames');
fs.mkdirSync(frames,{recursive:true});
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost').pathname.slice(1);
 const root=url.startsWith('node_modules/')?process.cwd():dir;
 const file=path.resolve(root,url||'scene.html');
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
 fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try {
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH || undefined,args:['--use-angle=d3d11','--enable-unsafe-swiftshader']});
 const page=await browser.newPage();
 page.on('pageerror',e=>console.error(e));page.on('console',m=>{if(m.type()==='error') console.error(m.text());});
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.waitForFunction(()=>window.ready===true,null,{timeout:120000});
 const proof=process.argv.includes('--proof');
 const frameIds=proof?[0,75,168,240,300]:Array.from({length:600},(_,i)=>i);
 for(const i of frameIds){
  const data=await page.evaluate(i=>{window.renderFrame(i);return film.toDataURL('image/jpeg',.965).split(',')[1];},proof?i:i/2);
  fs.writeFileSync(path.join(proof?dir:frames,(proof?'proof':'')+String(i).padStart(4,'0')+'.jpg'),Buffer.from(data,'base64'));
  if(!proof&&i%60===0)console.log(i+'/600');
 }
}finally{await browser?.close();server.close();}
