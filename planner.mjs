import {randomUUID} from 'node:crypto';

export const minutes=s=>{if(typeof s!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))throw Error('Use a 24-hour time such as 19:15.');return Number(s.slice(0,2))*60+Number(s.slice(3));};
export const clock=n=>`${Math.floor(n/60).toString().padStart(2,'0')}:${(n%60).toString().padStart(2,'0')}`;
const integer=(v,min,max,name)=>{if(!Number.isInteger(v)||v<min||v>max)throw Error(`${name} must be a whole number from ${min} to ${max}.`);return v;};
const text=(v,max,name)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error(`${name} is required (maximum ${max} characters).`);return v.trim();};
export function empty(){return {version:1,revision:0,date:'2026-10-19',now:'19:15',end:'23:00',tasks:[],busy:[],plan:null,pending:null,calendar:[],trace:[],interruption:null,sample:false};}
export function example(){return {...empty(),sample:true,tasks:[{id:'graphs',title:'Graphs revision',remaining:60,deadline:'22:00',priority:3,note:'Resume at Dijkstra: trace the priority queue on one example.'},{id:'os',title:'Operating systems notes',remaining:45,deadline:'23:00',priority:2,note:'Compare mutex, semaphore and monitor with one use case each.'},{id:'seminar',title:'Seminar outline',remaining:45,deadline:'21:30',priority:3,note:'Draft the three-slide problem, method and limitation section.'}],busy:[{id:'dinner',title:'Dinner / family time',start:'20:15',end:'20:45'}]};}
export function validate(s){
 if(!s||s.version!==1)throw Error('Unsupported workspace.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s.date)||Number.isNaN(Date.parse(s.date)))throw Error('Invalid date.');
 if(minutes(s.end)<=minutes(s.now))throw Error('Study window must end after the current time.');
 if(!Array.isArray(s.tasks)||s.tasks.length>20||!Array.isArray(s.busy)||s.busy.length>30)throw Error('Workspace exceeds the supported size.');
 const ids=new Set();for(const t of s.tasks){text(t.title,120,'Task title');text(t.id,100,'Task ID');if(ids.has(t.id))throw Error('Duplicate task.');ids.add(t.id);integer(t.remaining,0,480,'Remaining minutes');integer(t.priority,1,3,'Priority');minutes(t.deadline);if(typeof t.note!=='string'||t.note.length>1500)throw Error('Invalid resume note.');}
 for(const b of s.busy){text(b.title,120,'Calendar title');if(minutes(b.end)<=minutes(b.start))throw Error('Calendar event must end after its start.');}
 return s;
}
const overlap=(a,b)=>a.start<b.end&&a.end>b.start;
export function planDay(state){
 validate(state);const start=minutes(state.now),end=minutes(state.end),blocked=state.busy.map(b=>({start:minutes(b.start),end:minutes(b.end)}));
 const tasks=state.tasks.map(t=>({...t,left:t.remaining}));const blocks=[];let cursor=start,streak=0;
 while(cursor<end){
  const collision=blocked.find(b=>b.start<=cursor&&b.end>cursor);if(collision){cursor=collision.end;streak=0;continue;}
  if(streak>=45){cursor+=5;streak=0;continue;}
  const nextBusy=Math.min(end,...blocked.filter(b=>b.start>cursor).map(b=>b.start));
  const available=tasks.filter(t=>t.left>0&&minutes(t.deadline)>cursor).sort((a,b)=>minutes(a.deadline)-minutes(b.deadline)||b.priority-a.priority||a.title.localeCompare(b.title));
  if(!available.length)break;const t=available[0];const size=Math.min(15,t.left,nextBusy-cursor,minutes(t.deadline)-cursor,45-streak);
  if(size<=0){cursor=nextBusy;streak=0;continue;}
  const last=blocks.at(-1);if(last&&last.taskId===t.id&&minutes(last.end)===cursor){last.end=clock(cursor+size);last.minutes+=size;}else blocks.push({taskId:t.id,title:t.title,start:clock(cursor),end:clock(cursor+size),minutes:size,resumeNote:t.note});
  t.left-=size;cursor+=size;streak+=size;
 }
 const deferred=tasks.filter(t=>t.left>0).map(t=>({taskId:t.id,title:t.title,minutes:t.left,reason:minutes(t.deadline)<=start?'Deadline has passed.':'Not enough feasible time before the deadline; never silently claimed complete.'}));
 return {id:randomUUID(),revision:state.revision,blocks,deferred,total:blocks.reduce((a,b)=>a+b.minutes,0),requested:tasks.reduce((a,b)=>a+b.remaining,0),explanation:'Earliest deadline first, then priority; respects busy events, task estimates and a five-minute break after 45 focus minutes. Estimates are user supplied.'};
}
export function record(state,name,input,result){state.trace.unshift({time:new Date().toISOString(),name,input,result});state.trace=state.trace.slice(0,60);}
function changed(s){s.revision++;s.plan=null;s.pending=null;}
export const toolDefinitions=[
 {name:'add_busy',description:'Add a fixed same-day event to the simulated calendar; invalidate old plans.',inputSchema:{type:'object',properties:{title:{type:'string'},start:{type:'string'},end:{type:'string'}},required:['title','start','end'],additionalProperties:false}},
 {name:'get_workspace',description:'Read the single local study workspace, resume notes, simulated calendar and real tool trace.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true}},
 {name:'load_example',description:'Replace the local workspace with clearly fictional demo data. Requires explicit confirmation.',inputSchema:{type:'object',properties:{confirm:{type:'boolean'}},required:['confirm'],additionalProperties:false}},
 {name:'add_task',description:'Add a study task with estimated minutes, same-day deadline, priority1-3 and resume note.',inputSchema:{type:'object',properties:{title:{type:'string'},remaining:{type:'integer'},deadline:{type:'string'},priority:{type:'integer'},note:{type:'string'}},required:['title','remaining','deadline','priority'],additionalProperties:false}},
 {name:'plan_day',description:'Read calendar and tasks, solve a feasible plan, and list work that will not fit. No calendar write.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false}},
 {name:'interrupt',description:'Record an interruption, time already spent on a specific task and a durable resume note, then replan.',inputSchema:{type:'object',properties:{taskId:{type:'string'},completed:{type:'integer'},duration:{type:'integer'},note:{type:'string'}},required:['taskId','completed','duration','note'],additionalProperties:false}},
 {name:'prepare_calendar',description:'Create a revision-bound preview for the local SIMULATED calendar. Never contacts a real calendar.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'approve_calendar',description:'Commit a pending simulated calendar preview only with the exact approval ID, current revision and explicit user approval.',inputSchema:{type:'object',properties:{approvalId:{type:'string'},approved:{type:'boolean'}},required:['approvalId','approved'],additionalProperties:false}},
 {name:'decline_calendar',description:'Discard the pending simulated calendar change.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'set_window',description:'Change the same-day study start/end times; invalidate old plans and approvals.',inputSchema:{type:'object',properties:{now:{type:'string'},end:{type:'string'}},required:['now','end'],additionalProperties:false}}
];
export function callTool(original,name,args={}){
 if(!toolDefinitions.some(t=>t.name===name))throw Error('Unknown tool.');if(!args||typeof args!=='object'||Array.isArray(args))throw Error('Arguments must be an object.');
 const schema=toolDefinitions.find(t=>t.name===name).inputSchema;for(const k of Object.keys(args))if(!Object.hasOwn(schema.properties,k))throw Error(`Unexpected argument: ${k}`);for(const k of schema.required||[])if(!Object.hasOwn(args,k))throw Error(`Missing argument: ${k}`);
 let s=structuredClone(original);validate(s);let result;
 if(name==='get_workspace')return {state:s,result:s};
 if(name==='load_example'){if(args.confirm!==true)throw Error('Confirm replacement first.');s=example();s.revision=original.revision+1;result={message:'Fictional example loaded. No real calendar or study results.'};}
 if(name==='add_task'){const t={id:randomUUID(),title:text(args.title,120,'Task title'),remaining:integer(args.remaining,1,480,'Estimate'),deadline:args.deadline,priority:integer(args.priority,1,3,'Priority'),note:args.note||''};s.tasks.push(t);changed(s);validate(s);result={taskId:t.id,message:'Task added; old calendar approval invalidated.'};}
 if(name==='add_busy'){s.busy.push({id:randomUUID(),title:text(args.title,120,'Event title'),start:args.start,end:args.end});validate(s);changed(s);result={message:'Fixed event added; old plan invalidated.'};}
 if(name==='set_window'){s.now=args.now;s.end=args.end;validate(s);changed(s);result={message:'Window updated; old plans invalidated.'};}
 if(name==='plan_day'){s.plan=planDay(s);s.pending=null;result=s.plan;}
 if(name==='interrupt'){
  const task=s.tasks.find(t=>t.id===args.taskId);if(!task)throw Error('Choose a known task.');const done=integer(args.completed,0,task.remaining,'Completed minutes'),delay=integer(args.duration,1,180,'Interruption');
  const next=minutes(s.now)+done+delay;if(next>=minutes(s.end))throw Error('This interruption reaches the end of your study window. Extend the window before recording it.');
  task.remaining-=done;task.note=text(args.note,1500,'Resume note');s.now=clock(next);s.interruption={taskId:task.id,completed:done,duration:delay,resumeNote:task.note};changed(s);s.plan=planDay(s);result={message:`Resume ${task.title} from your saved breadcrumb. ${done} completed minutes preserved; ${delay} interrupted minutes removed from the window.`,plan:s.plan};
 }
 if(name==='prepare_calendar'){if(!s.plan||s.plan.revision!==s.revision)throw Error('Create a current plan first.');s.pending={id:randomUUID(),revision:s.revision,blocks:structuredClone(s.plan.blocks),replaces:s.calendar.length};result={approvalId:s.pending.id,revision:s.revision,blocks:s.pending.blocks,message:'Preview only. This replaces StudyRelay-created SIMULATED blocks, never personal events. User approval required.'};}
 if(name==='approve_calendar'){if(args.approved!==true)throw Error('Explicit approval is required.');if(!s.pending||s.pending.id!==args.approvalId||s.pending.revision!==s.revision)throw Error('Approval is absent or stale; request a new preview.');s.calendar=structuredClone(s.pending.blocks);s.pending=null;result={message:`Saved ${s.calendar.length} blocks to the local SIMULATED calendar. No external service was contacted.`};}
 if(name==='decline_calendar'){s.pending=null;result={message:'Calendar change declined. Nothing committed.'};}
 record(s,name,args,result);return {state:s,result};
}
