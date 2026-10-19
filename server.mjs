import http from 'node:http';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join,dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {empty,validate,callTool,toolDefinitions} from './planner.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const VERSION='2025-11-25';
export async function createApp({persist=false,dataDir=join(root,'data')}={}){
 let state=empty(),queue=Promise.resolve();const sessions=new Map();
 if(persist){try{state=validate(JSON.parse(await readFile(join(dataDir,'workspace.json'),'utf8')));}catch(e){if(e.code!=='ENOENT')throw Error('Saved workspace is invalid; preserve it for recovery rather than silently reset.');}}
 const save=async s=>{if(persist){await mkdir(dataDir,{recursive:true});const target=join(dataDir,'workspace.json');await writeFile(target+'.tmp',JSON.stringify(s,null,2));await rename(target+'.tmp',target);}};
 const server=http.createServer(async(req,res)=>{
  const send=(code,body,extra={})=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra});res.end(body===undefined?'':JSON.stringify(body));};
  const host=req.headers.host||'';if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host))return send(403,{error:'Invalid host'});
  const origin=req.headers.origin;if(origin&&origin!==`http://${host}`)return send(403,{error:'Origin denied'});
  if(req.url==='/mcp'){
   if(req.method==='GET')return send(405,{error:'Server-sent stream not offered'},{Allow:'POST, DELETE'});
   const sid=req.headers['mcp-session-id'];
   if(req.method==='DELETE'){if(!sid||!sessions.has(sid))return send(404,{error:'Unknown session'});sessions.delete(sid);return send(200,{closed:true});}
   if(req.method!=='POST')return send(405,{error:'Use POST'},{Allow:'POST, GET, DELETE'});
   if(!(req.headers['content-type']||'').startsWith('application/json'))return send(415,{error:'JSON required'});
   if(!req.headers.accept?.includes('application/json')||!req.headers.accept?.includes('text/event-stream'))return send(406,{error:'Accept application/json and text/event-stream'});
   let message;try{let body='';for await(const part of req){body+=part;if(Buffer.byteLength(body)>65536)return send(413,{error:'Request too large'});}message=JSON.parse(body);}catch{return send(400,{jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid JSON'}});}
   if(!message||Array.isArray(message)||message.jsonrpc!=='2.0'||typeof message.method!=='string')return send(400,{jsonrpc:'2.0',id:message?.id??null,error:{code:-32600,message:'Invalid request'}});
   const reply=result=>send(200,{jsonrpc:'2.0',id:message.id,result});
   const error=(code,msg)=>send(200,{jsonrpc:'2.0',id:message.id??null,error:{code,message:msg}});
   if(message.method==='initialize'){
    if(!Object.hasOwn(message,'id')||typeof message.params?.protocolVersion!=='string')return error(-32602,'Initialization parameters required');
    if(sessions.size>=100)return send(503,{error:'Too many local sessions. Restart the server.'});
    const id=randomUUID();sessions.set(id,{initialized:false});return send(200,{jsonrpc:'2.0',id:message.id,result:{protocolVersion:VERSION,capabilities:{tools:{listChanged:false}},serverInfo:{name:'StudyRelay',version:'0.1.0'},instructions:'Single-user local simulation. Tools modify only a local workspace and simulated calendar. No live Alexa or cloud connection.'}},{'MCP-Session-Id':id});
   }
   if(!sid)return send(400,{error:'MCP session required'});if(!sessions.has(sid))return send(404,{error:'Unknown session'});
   if(req.headers['mcp-protocol-version']!==VERSION)return send(400,{error:'Use negotiated MCP-Protocol-Version2025-11-25'});
   if(message.method==='notifications/initialized'){sessions.get(sid).initialized=true;return send(202);}
   if(!Object.hasOwn(message,'id'))return send(202);
   if(message.method==='ping')return reply({});
   if(!sessions.get(sid).initialized)return error(-32000,'Send initialized notification first');
   if(message.method==='tools/list')return reply({tools:toolDefinitions});
   if(message.method==='tools/call'){
    const params=message.params;if(!params||typeof params.name!=='string')return error(-32602,'Tool name required');
    if(!toolDefinitions.some(t=>t.name===params.name))return error(-32602,'Unknown tool');
    const job=queue.then(async()=>{try{const {state:next,result}=callTool(state,params.name,params.arguments||{});if(params.name!=='get_workspace'){await save(next);state=next;}return {content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result,isError:false};}catch(e){return {content:[{type:'text',text:e.message}],isError:true};}});queue=job.catch(()=>{});return reply(await job);
   }
   return error(-32601,'Method not found');
  }
  const assets={'/':['index.html','text/html'],'/styles.css':['styles.css','text/css'],'/app.js':['app.js','text/javascript']};const asset=assets[req.url];
  if(!asset)return send(404,{error:'Not found'});if(!['GET','HEAD'].includes(req.method))return send(405,{error:'Use GET'});
  try{const data=await readFile(join(root,'public',asset[0]));res.writeHead(200,{'Content-Type':asset[1]+'; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'",'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);}catch{send(500,{error:'Asset missing'});}
 });return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const s=await createApp({persist:true});s.listen(4174,'127.0.0.1',()=>console.log('StudyRelay:http://127.0.0.1:4174 — single-user local simulation'));}
