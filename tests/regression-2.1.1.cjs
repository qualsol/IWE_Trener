'use strict';
// Regression tests for functions executed in main/index.html (not TEST_3/app.js).
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
function section(start,end){const a=html.indexOf(start),b=html.indexOf(end,a+start.length);assert(a>=0&&b>a,'Missing source: '+start);return html.slice(a,b)}
const ctx={console,Date,Map,Set,progress:{byId:{}},questions:[]};
vm.createContext(ctx);
vm.runInContext(section('function localCalendarDate(', 'function renderLearningDashboard(')+
 section('function mergeEvents(', 'async function mergeBackup('),ctx);
const q={id:'q1',module:'I',hasKey:true,options:[{letter:'A',correct:true},{letter:'B',correct:false}]};
const make=()=>({byId:{},history:[],examHistory:[],sessionHistory:[],answered:0,perfect:0,sessions:0});
const evt=(id,sid,date,correct,qid='q1',mode='learn')=>({eventId:id,sessionId:sid,date,correct,id:qid,module:'I',mode,examId:mode==='exam'?sid:null,chosen:correct?['A']:['B'],points:correct?2:-2,maximum:2});
const exam=(id,sid,date,rows)=>({eventId:id,examId:sid,date,points:rows.reduce((a,e)=>a+e.points,0),maximum:rows.length*2,questions:rows.length,pct:rows.reduce((a,e)=>a+e.points,0)/(rows.length*2)*100});
let pass=0;function test(name,fn){fn();pass++;console.log('PASS '+name)}
test('Starred without answer remains unseen',()=>{const p={starred:true,attempts:0};assert.equal((p.attempts||0)>0,false);assert(html.includes('seen=qs.filter(q=>(progress.byId[q.id]?.attempts||0)>0).length'))});
test('Mastery needs 3 correct over 2 days',()=>{ctx.progress.byId.q1={lastCorrect:true,streak:3,reviewDays:['2026-10-20']};assert.equal(ctx.mastered(q),false);ctx.progress.byId.q1.reviewDays.push('2026-10-21');assert.equal(ctx.mastered(q),true)});
test('Mistake resets streak',()=>{const p={streak:3,reviewDays:['2026-10-20','2026-10-21']};ctx.updateSpacedSchedule(p,false);assert.equal(p.streak,0);assert.equal(p.reviewDays.length,0)});
test('Exam merge without sessionId',()=>{const x=exam('ex1','s1','2026-10-21T12:00:00Z',[]);assert.equal(ctx.mergeExamEvents([x],[x]).length,1)});
test('Exam merge conflict detected',()=>{const x=exam('ex1','s1','2026-10-21T12:00:00Z',[]);assert.throws(()=>ctx.mergeExamEvents([x],[{...x,points:10}]),/Konflikt/)});
test('Answer merge idempotent',()=>{const x=evt('e1','s1','2026-10-21T12:00:00Z',true);assert.equal(ctx.mergeEvents([x],[x]).length,1)});
test('Answer conflict detected',()=>{const x=evt('e1','s1','2026-10-21T12:00:00Z',true);assert.throws(()=>ctx.mergeEvents([x],[{...x,correct:false}]),/Konflikt/)});
test('Session conflict detected',()=>{assert.throws(()=>ctx.mergeSessionRecords([{sessionId:'s1',mode:'learn'}],[{sessionId:'s1',mode:'exam'}]),/Konflikt/)});
const dataset=make();let n=0;
for(let s=0;s<8;s++){const mode=s<5?'learn':'exam',sid='session-'+s,date='2026-10-'+String(10+s)+'T12:00:00Z',correctCounts=[8,4,10,6,3,4,7,5];dataset.sessionHistory.push({sessionId:sid,mode,date,questions:10,answered:10});const rows=[];for(let i=0;i<10;i++){const row=evt('a'+n++,sid,date.slice(0,14)+String(i).padStart(2,'0')+':00Z',i<correctCounts[s],'q'+i,mode);rows.push(row);dataset.history.push(row)}if(mode==='exam')dataset.examHistory.push(exam('ex-'+s,sid,date,rows))}
test('5 learning sessions + 3 exams, 80 answers',()=>{const m=ctx.mergeProgressData(make(),dataset);assert.equal(m.sessions,8);assert.equal(m.answered,80);assert.equal(m.perfect,47);assert.equal(m.examHistory.length,3);const again=ctx.mergeProgressData(m,dataset);assert.equal(again.answered,80);assert.equal(again.sessions,8);assert.equal(again.examHistory.length,3)});
test('Local day retained during merge near UTC midnight',()=>{
 const p=make();
 p.history=[
  {...evt('mid1','mid-session','2026-10-20T22:30:00Z',true),localDay:'2026-10-21'},
  {...evt('mid2','mid-session','2026-10-21T22:30:00Z',true),localDay:'2026-10-22'},
  {...evt('mid3','mid-session','2026-10-22T12:30:00Z',true),localDay:'2026-10-22'}
 ];
 p.sessionHistory=[{sessionId:'mid-session',mode:'learn',date:'2026-10-22T12:30:00Z',questions:3,answered:3}];
 const merged=ctx.mergeProgressData(make(),p);
 assert.equal(merged.byId.q1.streak,3);
 assert.deepEqual(Array.from(merged.byId.q1.reviewDays),['2026-10-21','2026-10-22']);
 assert.equal(merged.byId.q1.reviewDays.length,2);
 assert(html.includes('localDay:localCalendarDate(new Date())'));
});
test('JSON v3 backup validator accepts exported structure',()=>{
 const v=section('function validateBackup(', 'const PASS_THRESHOLD=');
 vm.runInContext(v,ctx);
 const p=ctx.mergeProgressData(make(),dataset);
 const backup={format:'IWE-Trener-backup',version:3,progress:p,imported:null};
 assert.equal(ctx.validateBackup(backup),p);
 assert.throws(()=>ctx.validateBackup({...backup,version:2}),/Nieobsługiwany/);
 assert.throws(()=>ctx.validateBackup({...backup,progress:{...p,history:[{id:'q1'}]}}),/identyfikatorów/);
});
test('JSON v3 backup with exam summaries can be merged',()=>{
 const p=ctx.mergeProgressData(make(),dataset);
 const copy=JSON.parse(JSON.stringify(p));
 assert.equal(ctx.mergeProgressData(p,copy).examHistory.length,3);
 assert.equal(ctx.mergeProgressData(p,copy).answered,80);
});
test('Reset preserves JSON v3 structure for backup restoration',()=>{
 const resetLiteral='progress={byId:{},sessions:0,answered:0,perfect:0,history:[],examHistory:[],sessionHistory:[],lastMistakes:[],lastExamMistakes:[]}';
 assert(html.includes(resetLiteral),'Reset must initialize sessionHistory');
 const reset={byId:{},sessions:0,answered:0,perfect:0,history:[],examHistory:[],sessionHistory:[],lastMistakes:[],lastExamMistakes:[]};
 assert.equal(ctx.validateBackup({format:'IWE-Trener-backup',version:3,progress:reset}),reset);
 const before=ctx.mergeProgressData(make(),dataset);
 const restored=JSON.parse(JSON.stringify(before));
 const afterReset=JSON.parse(JSON.stringify(reset));
 const merged=ctx.mergeProgressData(afterReset,restored);
 assert.equal(merged.sessions,8);
 assert.equal(merged.answered,80);
 assert.equal(merged.examHistory.length,3);
 const repeated=ctx.mergeProgressData(merged,restored);
 assert.equal(repeated.sessions,8);
 assert.equal(repeated.answered,80);
});
test('Exam scores reconcile',()=>{for(const x of dataset.examHistory){const rows=dataset.history.filter(e=>e.examId===x.examId);assert.equal(rows.length,x.questions);assert.equal(rows.reduce((a,e)=>a+e.points,0),x.points);assert.equal(rows.reduce((a,e)=>a+e.maximum,0),x.maximum)}});
console.log('RESULT '+pass+' passed; 0 failed');
