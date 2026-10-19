// IWE Trener 2.0: IndexedDB event store + isolated Supabase sync.
const DB='iwe-trener-v2',STORE='events';
export function openEventDB(){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE)){const store=db.createObjectStore(STORE,{keyPath:'eventId'});store.createIndex('occurredAt','occurredAt')}};
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
}
function transaction(db,mode,operation){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
  let result;try{result=operation(store)}catch(e){reject(e);return}
  tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
export async function getEvents(){
 const db=await openEventDB();
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
 finally{db.close()}
}
// PostgreSQL jsonb nie zachowuje kolejności kluczy JSON. Porównuj strukturę,
// nie wynik JSON.stringify z kolejnością pól.
function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
 return value;
}
function sameEvent(a,b){return JSON.stringify(canonical(a))===JSON.stringify(canonical(b))}
export async function putEvents(events){
 const db=await openEventDB();
 try{
  const existing=await getEvents();
  const known=new Map(existing.map(e=>[e.eventId,e]));
  for(const event of events){
   if(!event.eventId||!event.occurredAt)throw Error('Niepoprawne zdarzenie');
   const prev=known.get(event.eventId);
   if(prev&&!sameEvent(prev,event))throw Error('Konflikt danych dla identyfikatora '+event.eventId);
  }
  return await transaction(db,'readwrite',store=>{for(const event of events)if(!known.has(event.eventId))store.add(event);return events.length});
 }finally{db.close()}
}
export async function syncEvents(client,onStatus=()=>{}){
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user)throw Error('Zaloguj się do chmury');
 const local=await getEvents();
 for(let i=0;i<local.length;i+=100){
  const batch=local.slice(i,i+100).map(e=>({user_id:user.id,event_id:e.eventId,event_type:e.eventType,occurred_at:e.occurredAt,payload:e}));
  const {error}=await client.from('learning_events_v2').upsert(batch,{onConflict:'user_id,event_id',ignoreDuplicates:true});
  if(error)throw error;onStatus('Wysłano '+Math.min(i+100,local.length)+' / '+local.length);
 }
 let offset=0,downloaded=0;
 while(true){
  const {data,error}=await client.from('learning_events_v2').select('payload').eq('user_id',user.id).order('occurred_at',{ascending:true}).order('event_id',{ascending:true}).range(offset,offset+499);
  if(error)throw error;
  const rows=data||[];
  await putEvents(rows.map(r=>r.payload));
  downloaded+=rows.length;offset+=rows.length;
  onStatus('Pobrano '+downloaded+' zdarzeń');
  if(rows.length<500)break;
 }
 return {uploaded:local.length,downloaded,localTotal:(await getEvents()).length};
}
