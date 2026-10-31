import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import worker, { aggregateVisitors } from '../worker/src/index.js';

const ORIGIN = 'https://daweisun.com';
const token = 'test-only-token';
class MemoryKV {
  data = new Map(); calls = [];
  async put(key, value, options) { this.data.set(key, { value: JSON.parse(value), options }); }
  async list({ prefix, limit, cursor }) {
    const keys = [...this.data.keys()].filter(key => key.startsWith(prefix)).sort();
    const start = Number(cursor || 0), end = start + limit;
    return { keys: keys.slice(start, end).map(name => ({ name })), list_complete: end >= keys.length, cursor: String(end) };
  }
  async get(keys, type) {
    assert.equal(type, 'json'); assert.ok(Array.isArray(keys)); assert.ok(keys.length <= 100);
    this.calls.push(keys.length); return new Map(keys.map(key => [key, this.data.get(key)?.value || null]));
  }
}
const kv = new MemoryKV();
const env = { VISIT_LOGS: kv, ADMIN_TOKEN: token, ALLOWED_ORIGINS: ORIGIN+',https://www.daweisun.com' };
const fetchWorker = (path, init = {}) => worker.fetch(new Request('https://analytics.example'+path, init), env);
const auth = { Authorization: 'Bearer '+token };
const send = (payload, extra = {}) => fetchWorker('/collect', {
  method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.7', 'X-Forwarded-For': '198.51.100.9', 'User-Agent': 'Safari iPhone', ...extra }, body: JSON.stringify(payload)
});
const base = { eventType: 'pageview', path: '/', visitorId: '0123456789abcdef' };
assert.equal((await fetchWorker('/health')).status, 200);
assert.equal((await fetchWorker('/api/visits')).status, 401);
assert.equal((await fetchWorker('/api/visits?token='+token)).status, 401);
assert.equal((await fetchWorker('/api/visits', { headers:{Authorization:'Bearer wrong'} })).status, 401);
assert.equal((await fetchWorker('/api/visits', { headers:auth })).status, 200);
const shell = await fetchWorker('/admin');
assert.equal(shell.headers.get('Cache-Control'), 'no-store');
assert.ok(shell.headers.get('Content-Security-Policy').includes("frame-ancestors 'none'"));
assert.ok(!(await shell.text()).includes(token));
assert.equal((await send(base, { Origin: 'https://evil.example' })).status, 403);
assert.equal((await send(base, { Origin: 'http://localhost:4173' })).status, 403);
assert.equal((await fetchWorker('/collect', { method:'OPTIONS', headers:{Origin:ORIGIN} })).status, 204);
assert.equal((await fetchWorker('/other', { method:'OPTIONS', headers:{Origin:ORIGIN} })).status, 405);
assert.equal((await fetchWorker('/collect', { method:'POST', headers:{Origin:ORIGIN,'Content-Type':'application/json'}, body:'{' })).status, 400);
for (const payload of [null, [], 'text', {}, { ...base, eventType:'patient' }, { ...base, path:'/private' }]) assert.equal((await send(payload)).status, 400);
assert.equal((await send({ ...base, patient: 'x'.repeat(9000) })).status, 413);
assert.equal((await send({ ...base, eventType:'link-click',linkType:'cv',linkTarget:'https://evil.example/secret' })).status, 400);
assert.equal((await send({ ...base, eventType:'link-click',linkType:'email',linkTarget:'mailto:patient@example.com' })).status, 400);
assert.equal((await fetchWorker('/api/visits?cursor=%3Cscript%3E', {headers:auth})).status, 400);
for (const path of ['/', '/publications.html', '/tools/anesthesia-dosing/', '/tools/pediatric-anesthesia/']) {
  assert.equal((await send({ ...base, path:path+'?patient=NEVER-SEND#secret', referrer:'https://referrer.example/private?patient=NEVER-SEND', patient:'NEVER-SEND', localStorage:'NEVER-SEND', ip:'attacker-ip' })).status, 204);
}
for (const item of kv.data.values()) {
  assert.equal(item.options.expirationTtl, 90*86400);
  assert.equal(item.value.ip, '203.0.113.7'); assert.equal(item.value.referrer,'https://referrer.example');
  assert.ok(!JSON.stringify(item.value).includes('NEVER-SEND'));
  assert.ok(!item.value.path.includes('?'));
}
assert.equal((await send({...base,eventType:'engagement',activeSeconds:999999,maxScrollPercent:999})).status,204);
assert.equal((await send({...base,eventType:'link-click',linkType:'cv',linkTarget:ORIGIN+'/assets/Dawei-Sun-CV.pdf?secret=yes#fragment'})).status,204);
let result = await (await fetchWorker('/api/visits',{headers:auth})).json();
assert.equal(result.visitors[0].visitCount,4);assert.equal(result.visitors[0].totalActiveSeconds,60);
assert.equal(result.visitors[0].linkClicks.cv,1);assert.equal(result.visitors[0].maxScrollPercent,100);
// >500 events, with reverse lexical keys and a real cursor boundary.
kv.data.clear();
for(let i=0;i<605;i++){
 const now=Date.UTC(2026,9,30)+i*1000;
 await kv.put('visit:'+String(9999999999999-now).padStart(13,'0')+':'+i,JSON.stringify({timestamp:new Date(now).toISOString(),ip:'203.0.113.7',visitorId:'test',eventType:'pageview',path:'/'}),{expirationTtl:90*86400});
}
kv.calls=[];
result=await (await fetchWorker('/api/visits',{headers:auth})).json();
assert.equal(result.totalEventsLoaded,500);assert.equal(result.visitors[0].visitCount,500);
assert.equal(result.lastEvent,new Date(Date.UTC(2026,9,30)+604000).toISOString());
assert.deepEqual(kv.calls,[100,100,100,100,100]); assert.ok(result.nextCursor);
const second=await (await fetchWorker('/api/visits?cursor='+result.nextCursor,{headers:auth})).json();
assert.equal(second.totalEventsLoaded,105);assert.equal(second.nextCursor,null);
assert.ok(second.lastEvent<result.firstEvent);

// Cumulative snapshots tolerate duplicate, lost and out-of-order requests.
const visitId = 'a'.repeat(32), otherVisitId = 'b'.repeat(32);
const cumulative = { ...base, metricsVersion:2, pageViewId:visitId, visibleMs:10000, activeMs:8000, maxScrollPercent:50 };
assert.equal((await send(cumulative)).status,204);
assert.equal((await send({...cumulative,pageViewId:'invalid'})).status,400);
assert.equal((await send({...cumulative,visibleMs:'10000'})).status,400);
assert.equal((await send({...cumulative,activeMs:-1})).status,400);
assert.equal((await send({...cumulative,metricsVersion:3})).status,400);
const sample = (id, path, visibleMs, activeMs, scroll, timestamp) => ({
 ip:'203.0.113.8',visitorId:'test',metricsVersion:2,pageViewId:id,path,visibleMs,activeMs,maxScrollPercent:scroll,timestamp,eventType:'engagement'
});
const combined = aggregateVisitors([
 sample(visitId,'/',45000,40000,100,'2026-10-31T00:00:45Z'),
 sample(visitId,'/',45000,40000,100,'2026-10-31T00:00:46Z'),
 sample(visitId,'/',5000,5000,20,'2026-10-31T00:00:05Z'),
 sample(otherVisitId,'/publications.html',20000,10000,0,'2026-10-31T00:01:20Z'),
 {ip:'203.0.113.8',visitorId:'test',path:'/',timestamp:'2026-10-30T00:00:00Z',eventType:'engagement',activeSeconds:7,maxScrollPercent:66}
])[0];
assert.equal(combined.visitCount,2);assert.equal(combined.totalVisibleSeconds,65);assert.equal(combined.totalActiveSeconds,57);
assert.equal(combined.totalMeasuredActiveSeconds,50);assert.equal(combined.legacyActiveSeconds,7);assert.equal(combined.legacyDisplayDepthPercent,66);
assert.equal(combined.visits.find(v=>v.path==='/publications.html').maxScrollPercent,0);
assert.equal(combined.visits.find(v=>v.path==='/').visibleMs,45000);

const source=readFileSync(new URL('../assets/analytics.js',import.meta.url),'utf8');
function browser(path, { online = true, storageBlocked = false, origin = ORIGIN, failNetwork = false } = {}) {
 const requests=[],readKeys=[],timers=[],scheduled=new Map(),listeners={},documentListeners={};
 let clock=0,wallOffset=0,nextTimer=0;
 class FakeDate extends Date { static now(){return clock+wallOffset;} }
 class Element { closest(){return this.link;} }
 const root={scrollHeight:1000,clientHeight:800,scrollTop:0};
 const document={visibilityState:'visible',referrer:'https://ref.example/private?secret=NEVER-SEND',documentElement:root,scrollingElement:root,addEventListener:(name,fn)=>documentListeners[name]=fn};
 const navigator={onLine:online,language:'en-US'};
 const sandbox={ location:{origin,pathname:path,href:origin+path+'?patient=NEVER-SEND#secret'}, document,navigator,
  localStorage:{getItem(key){readKeys.push(key);if(storageBlocked)throw Error('blocked');return null;},setItem(key){assert.equal(key,'daweisun.analytics.visitor.v1');if(storageBlocked)throw Error('blocked');}},
  crypto,Date:FakeDate,performance:{now:()=>clock},URL,Element,AbortController,Uint8Array,Intl,screen:{width:402,height:874},
  matchMedia:()=>({matches:false}),setTimeout:(fn,ms)=>{timers.push(ms);const id=++nextTimer;scheduled.set(id,{fn,at:clock+ms});return id;},clearTimeout:id=>scheduled.delete(id),
  setInterval:(fn,ms)=>{listeners.interval=fn;listeners.intervalMs=ms;},
  fetch:(url,options)=>{requests.push({url,...options,payload:JSON.parse(options.body)});return failNetwork ? Promise.reject(Error('offline transport')) : Promise.resolve({status:204});}
 };
 sandbox.window={addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(source,sandbox);
 return{requests,readKeys,timers,listeners,documentListeners,document,navigator,root,Element,
  advance:ms=>clock+=ms,jumpWall:ms=>wallOffset+=ms,
  flushTimers:()=>{for(const [id,timer] of [...scheduled])if(timer.at<=clock){scheduled.delete(id);timer.fn();}}
 };
}
for (const path of ['/', '/publications.html','/tools/anesthesia-dosing/','/tools/pediatric-anesthesia/']) {
 const b=browser(path);assert.equal(b.requests.length,1);assert.equal(b.requests[0].payload.path,path);
 assert.deepEqual(b.readKeys,['daweisun.analytics.visitor.v1']);
 assert.equal(b.requests[0].payload.referrer,'https://ref.example');assert.equal(b.requests[0].payload.metricsVersion,2);
 assert.equal(b.requests[0].payload.maxScrollPercent,0);assert.match(b.requests[0].payload.pageViewId,/^[a-f0-9]{32}$/);
 assert.equal(b.requests[0].referrerPolicy,'no-referrer');assert.equal(b.requests[0].credentials,'omit');assert.equal(b.requests[0].keepalive,true);
 assert.deepEqual(b.timers,[30000]);assert.equal(b.listeners.intervalMs,5000);assert.ok(!JSON.stringify(b.requests).includes('NEVER-SEND'));
 b.advance(15000);b.listeners.interval();assert.equal(b.requests[1].payload.visibleMs,15000);assert.equal(b.requests[1].payload.activeMs,15000);
 const link=new b.Element();link.link={href:ORIGIN+'/assets/Dawei-Sun-CV.pdf?secret=NEVER-SEND#fragment'};
 b.documentListeners.click({target:link});assert.equal(b.requests.at(-1).payload.linkType,'cv');
 assert.equal(b.requests.at(-1).payload.linkTarget,ORIGIN+'/assets/Dawei-Sun-CV.pdf');
 b.navigator.onLine=false;b.listeners.offline();const count=b.requests.length;
 b.advance(30000);b.listeners.interval();assert.equal(b.requests.length,count);
 b.navigator.onLine=true;b.listeners.online();assert.equal(b.requests.length,count);
 b.advance(5000);b.listeners.interval();assert.equal(b.requests.at(-1).payload.visibleMs,20000);
 b.document.visibilityState='hidden';b.documentListeners.visibilitychange();const hiddenCount=b.requests.length;
 b.advance(120000);b.document.visibilityState='visible';b.documentListeners.visibilitychange();assert.equal(b.requests.length,hiddenCount);
 b.advance(5000);b.listeners.interval();assert.equal(b.requests.at(-1).payload.visibleMs,25000);
}
const idle=browser('/');idle.advance(180000);idle.listeners.interval();
assert.equal(idle.requests.at(-1).payload.visibleMs,180000);assert.equal(idle.requests.at(-1).payload.activeMs,60000);
idle.listeners.pointerdown();idle.advance(10000);idle.listeners.interval();assert.equal(idle.requests.at(-1).payload.activeMs,70000);
const delayed=browser('/');delayed.advance(45000);delayed.listeners.interval();
assert.equal(delayed.requests.at(-1).payload.visibleMs,45000);assert.equal(delayed.requests.at(-1).payload.activeMs,45000);
const wall=browser('/');wall.advance(5000);wall.jumpWall(3600000);wall.listeners.interval();assert.equal(wall.requests.at(-1).payload.visibleMs,5000);
const short=browser('/');short.root.scrollHeight=600;short.root.clientHeight=800;short.advance(5000);short.listeners.interval();assert.equal(short.requests.at(-1).payload.maxScrollPercent,0);
const scroll=browser('/');scroll.root.scrollTop=100;scroll.listeners.scroll();scroll.advance(1000);scroll.flushTimers();
assert.equal(scroll.requests.at(-1).payload.maxScrollPercent,50);
scroll.root.scrollTop=200;scroll.listeners.scroll();scroll.root.scrollTop=0;scroll.listeners.scroll();scroll.advance(1000);scroll.flushTimers();
assert.equal(scroll.requests.at(-1).payload.maxScrollPercent,100); // Fast down-and-back is captured before the next heartbeat.
const elastic=browser('/');elastic.root.scrollTop=-20;elastic.listeners.scroll();elastic.advance(1000);elastic.flushTimers();assert.equal(elastic.requests.at(-1).payload.maxScrollPercent,0);
elastic.root.scrollTop=198.5;elastic.listeners.scroll();elastic.advance(1000);elastic.flushTimers();assert.equal(elastic.requests.at(-1).payload.maxScrollPercent,100);
const subsecond=browser('/');subsecond.advance(750);subsecond.document.visibilityState='hidden';subsecond.documentListeners.visibilitychange();
assert.equal(subsecond.requests.at(-1).payload.visibleMs,750);subsecond.listeners.pagehide();const afterHide=subsecond.requests.length;
subsecond.advance(120000);subsecond.document.visibilityState='visible';subsecond.documentListeners.visibilitychange();subsecond.advance(750);subsecond.listeners.interval();
assert.equal(subsecond.requests.at(-1).payload.visibleMs,1500);assert.equal(subsecond.requests.length,afterHide+1);
const restored=browser('/');const id=restored.requests[0].payload.pageViewId;restored.advance(5000);restored.listeners.pagehide();restored.advance(100000);restored.listeners.pageshow({persisted:true});
assert.notEqual(restored.requests.at(-1).payload.pageViewId,id);assert.equal(restored.requests.at(-1).payload.visibleMs,0);
assert.equal(browser('/',{storageBlocked:true}).requests.length,1);
assert.equal(browser('/',{origin:'http://localhost:4173'}).requests.length,0);
const offline=browser('/',{online:false});assert.equal(offline.requests.length,0);offline.advance(100000);offline.navigator.onLine=true;offline.listeners.online();assert.equal(offline.requests[0].payload.visibleMs,0);
const failed=browser('/',{failNetwork:true});failed.advance(1000);await Promise.resolve();await Promise.resolve();assert.equal(failed.requests.length,1);
console.log('PASS: auth/privacy, legacy compatibility, cumulative deduplication/loss/reordering, per-page visits, 5s reporting, quiet reading, delayed timers, monotonic clock, hidden/locked/offline time, subsecond precision, BFCache, mobile scrolling/overscroll and unavailable storage/network.');
