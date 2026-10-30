import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import worker from '../worker/src/index.js';

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

const source=readFileSync(new URL('../assets/analytics.js',import.meta.url),'utf8');
function browser(path, { online = true, storageBlocked = false, origin = ORIGIN } = {}) {
 const requests=[],readKeys=[],timers=[],listeners={},documentListeners={}; let clock=0;
 class FakeDate extends Date { static now(){return clock;} }
 class Element { closest(){return this.link;} }
 const document={visibilityState:'visible',referrer:'https://ref.example/private?secret=NEVER-SEND',documentElement:{scrollHeight:1000},addEventListener:(name,fn)=>documentListeners[name]=fn};
 const navigator={onLine:online,language:'en-US'};
 const sandbox={ location:{origin,pathname:path,href:origin+path+'?patient=NEVER-SEND#secret'}, document,navigator,
  localStorage:{getItem(key){readKeys.push(key);if(storageBlocked)throw Error('blocked');return null;},setItem(key){assert.equal(key,'daweisun.analytics.visitor.v1');if(storageBlocked)throw Error('blocked');}},
  crypto,Date:FakeDate,URL,Element,AbortController,Uint8Array,Intl,screen:{width:1280,height:800},scrollY:0,innerHeight:800,
  matchMedia:()=>({matches:false}),setTimeout:(fn,ms)=>{timers.push(ms);return 1;},clearTimeout:()=>{},setInterval:fn=>{listeners.interval=fn;},
  fetch:(url,options)=>{requests.push({url,...options,payload:JSON.parse(options.body)});return Promise.resolve({status:204});}
 };
 sandbox.window={addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(source,sandbox);
 return{requests,readKeys,timers,listeners,documentListeners,document,navigator,Element,advance:ms=>clock+=ms};
}
for (const path of ['/', '/publications.html','/tools/anesthesia-dosing/','/tools/pediatric-anesthesia/']) {
 const b=browser(path);assert.equal(b.requests.length,1);assert.equal(b.requests[0].payload.path,path);
 assert.deepEqual(b.readKeys,['daweisun.analytics.visitor.v1']);
 assert.equal(b.requests[0].payload.referrer,'https://ref.example');
 assert.equal(b.requests[0].referrerPolicy,'no-referrer');assert.equal(b.requests[0].credentials,'omit');assert.equal(b.requests[0].keepalive,true);
 assert.deepEqual(b.timers,[30000]); assert.ok(!JSON.stringify(b.requests).includes('NEVER-SEND'));
 b.advance(15000);b.listeners.interval();assert.equal(b.requests[1].payload.activeSeconds,15);
 const link=new b.Element();link.link={href:ORIGIN+'/assets/Dawei-Sun-CV.pdf?secret=NEVER-SEND#fragment'};
 b.documentListeners.click({target:link});assert.equal(b.requests.at(-1).payload.linkType,'cv');
 assert.equal(b.requests.at(-1).payload.linkTarget,ORIGIN+'/assets/Dawei-Sun-CV.pdf');
 b.navigator.onLine=false;b.listeners.offline();const count=b.requests.length;b.advance(30000);b.listeners.interval();assert.equal(b.requests.length,count);
 b.navigator.onLine=true;b.listeners.online();assert.equal(b.requests.length,count); // No offline replay.
 b.document.visibilityState='hidden';b.documentListeners.visibilitychange();const hiddenCount=b.requests.length;
 b.advance(60000);b.document.visibilityState='visible';b.documentListeners.visibilitychange();
 assert.equal(b.requests.length,hiddenCount);
}
assert.equal(browser('/',{storageBlocked:true}).requests.length,1);
assert.equal(browser('/',{origin:'http://localhost:4173'}).requests.length,0);
assert.equal(browser('/',{online:false}).requests.length,0);
const idle=browser('/');for(let i=0;i<10;i++){idle.advance(15000);idle.listeners.interval();}
assert.equal(idle.requests.filter(r=>r.payload.eventType==='engagement').reduce((n,r)=>n+r.payload.activeSeconds,0),60);
console.log('PASS: collection, auth, field privacy, four pages, 90-day TTL, newest-first >500 paging, batched KV, timeout, idle/hidden/offline timing and blocked storage.');
