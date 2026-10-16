const $=s=>document.querySelector(s);let questions=[],session=[],index=0,mode='learn',answers={},results=[],deferredInstall=null;const STORE='iweTrainerProgressV1';const PASS_THRESHOLD=60;let MODULES=['I','II','III','IV','I N','II N','III N','IV N'];let examTimer=null,examDeadline=0,examTimeExpired=false;let progress=loadProgress();progress.history ||= [];progress.examHistory ||= [];function loadProgress(){try{return JSON.parse(localStorage.getItem(STORE))||{byId:{},sessions:0,answered:0,perfect:0}}catch(e){return{byId:{},sessions:0,answered:0,perfect:0}}}function saveProgress(){try{localStorage.setItem(STORE,JSON.stringify(progress))}catch(e){console.warn("Zapis lokalny niedostępny",e)}renderStats()}function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function switchScreen(id){document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id===id));window.scrollTo({top:0,behavior:'smooth'})}function usable(){return questions.filter(q=>q.options.length>0&&($('#includeUnknown').checked||q.hasKey))}function normalizeModule(value){const s=String(value??'').trim().toUpperCase().replace(/^MODUŁ\s*/, '').replace(/^MODUL\s*/, '');const m=s.match(/^(I|II|III|IV)(?:\s*N)?$/);return m?s:s}function selectedModules(){return [...document.querySelectorAll('.module-check:checked')].map(x=>normalizeModule(x.value))}function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}function startQuiz(newMode,review=false,preset=null){stopExamTimer();examTimeExpired=false;mode=newMode;let chosenModules=selectedModules();if(!chosenModules.length){document.querySelectorAll('.module-check').forEach(x=>x.checked=true);chosenModules=MODULES.slice();}let list=usable().filter(q=>chosenModules.includes(normalizeModule(q.module)));
if(!list.length){console.error('IWE: brak pytań dla modułów',chosenModules,'; przykładowe moduły w bazie:',[...new Set(questions.map(q=>q.module))]);alert('Nie znaleziono pytań dla zaznaczonych modułów. Spróbuj odświeżyć aplikację i ponownie wybrać moduły.');return}if(review)list=list.filter(q=>{let p=progress.byId[q.id];return !p||p.lastCorrect===false||p.starred});const focus=$('#learningStrategy')?.value||'all';if(mode==='learn'&&!review&&focus!=='all'){list=list.filter(q=>focus==='due'?isDue(q):focus==='weak'?isWeak(q):focus==='starred'?!!progress.byId[q.id]?.starred:true);if(focus==='due')list.sort((a,b)=>dueTime(a)-dueTime(b));if(focus==='weak')list.sort((a,b)=>weakWeight(b)-weakWeight(a));}if(preset==='mistakes'){const ids=new Set(progress.lastMistakes||[]);list=list.filter(q=>ids.has(q.id));if(!list.length){alert('Brak błędnych pytań z ostatniego zestawu.');return;}shuffle(list);}
if(preset==='smart'){
 const target=$('#questionCount').value==='all'?list.length:Math.min(list.length,Number($('#questionCount').value));
 const used=new Set();
 const take=(pool,n)=>{shuffle(pool);const selected=[];for(const q of pool){if(!used.has(q.id)&&selected.length<n){used.add(q.id);selected.push(q)}}return selected};
 const weak=take(list.filter(q=>isWeak(q)),Math.ceil(target*.5));
 const due=take(list.filter(q=>isDue(q)),Math.ceil(target*.3));
 const fresh=take(list.filter(q=>!(progress.byId[q.id]?.attempts)),Math.ceil(target*.2));
 const rest=take(list,Math.max(0,target-weak.length-due.length-fresh.length));
 list=shuffle([...weak,...due,...fresh,...rest]);
}
if(preset!=='smart'&&preset!=='mistakes'&&$('#questionOrder').value==='wrong')list.sort((a,b)=>Number(!(progress.byId[a.id]&&progress.byId[a.id].lastCorrect===false))-Number(!(progress.byId[b.id]&&progress.byId[b.id].lastCorrect===false)));else if(preset!=='smart'&&preset!=='mistakes'&&$('#questionOrder').value==='random')shuffle(list);if(!list.length){alert(review?'Nie ma pytań do powtórki.':'Brak pytań dla wybranego zakresu. Wybierz co najmniej jeden moduł.');return}const n=$('#questionCount').value;session=list.slice(0,n==='all'?list.length:Number(n)).map(q=>{
 // Kopia pytania tylko dla bieżącej sesji: nigdy nie zmieniamy oryginalnej bazy.
 // Litery A-D odnoszą się do aktualnie wyświetlanej kolejności, a nie do Excela.
 const options=q.options.map(o=>({...o}));
 if($('#shuffleAnswers')?.checked)shuffle(options);
 return {...q,options:options.map((o,i)=>({...o,letter:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i]}))};
});index=0;answers={};results=[];$('#quizModeLabel').textContent=mode==='learn'?'Nauka':'Egzamin próbny';switchScreen('quiz');startExamTimer();renderQuestion()}function renderQuestion(){const q=session[index];$('#counter').textContent=`${index+1} / ${session.length}`;$('#quizProgress').style.width=`${(index/session.length)*100}%`;$('#moduleTag').textContent=`MODUŁ ${q.module}`;$('#questionText').textContent=q.question;$('#multiHint').textContent=q.hasKey&&q.options.filter(o=>o.correct).length>1?'Zaznacz wszystkie poprawne odpowiedzi':'Możliwy wybór wielu odpowiedzi';updateStarButton();$('#feedback').className='feedback hidden';$('#feedback').innerHTML='';$('#checkBtn').classList.toggle('hidden',mode==='exam'&&false);$('#checkBtn').textContent=mode==='exam'?'Zapisz odpowiedź':'Sprawdź odpowiedź';$('#nextBtn').classList.add('hidden');$('#options').innerHTML=q.options.map(o=>`<button class="option" data-letter="${o.letter}"><span class="letter">${o.letter}</span><span>${esc(o.text)}</span></button>`).join('');document.querySelectorAll('.option').forEach(b=>b.addEventListener('click',()=>toggleOption(b)));}function toggleOption(b){if($('#feedback').classList.contains('hidden')===false&&mode==='learn')return;let l=b.dataset.letter;answers[index]??=[];if(answers[index].includes(l))answers[index]=answers[index].filter(x=>x!==l);else answers[index].push(l);b.classList.toggle('selected',answers[index].includes(l))}// Punktacja za KAŻDĄ opcję: poprawna zaznaczona +2, błędna zaznaczona -1, poprawna pominięta -1.
// Niezaznaczona błędna opcja = 0. Pytania bez klucza nie są punktowane.
function scoreAnswer(q,chosen){if(!q.hasKey)return null;let points=0;for(const o of q.options){const marked=chosen.includes(o.letter);if(o.correct)points+=marked?2:-1;else if(marked)points-=1;}return points}
function maxScore(q){return q.hasKey?q.options.filter(o=>o.correct).length*2:0}
function isCorrect(q,chosen){if(!q.hasKey)return null;const correct=q.options.filter(o=>o.correct).map(o=>o.letter).sort();return JSON.stringify([...chosen].sort())===JSON.stringify(correct)}function checkAnswer(){const q=session[index],chosen=answers[index]||[];if(!chosen.length&&!confirm('Nie zaznaczono odpowiedzi. Kontynuować?'))return;const correct=isCorrect(q,chosen);if(mode==='exam'){results[index]={q,chosen:[...chosen],correct};document.querySelectorAll('.option').forEach(b=>b.disabled=true);bumpProgress(q,correct);goNext();return}document.querySelectorAll('.option').forEach(b=>{let o=q.options.find(x=>x.letter===b.dataset.letter);b.disabled=true;if(o.correct)b.classList.add('correct');else if(chosen.includes(o.letter))b.classList.add('wrong')});let fb=$('#feedback');fb.className='feedback '+(correct===true?'good':'bad');let right=q.options.filter(o=>o.correct).map(o=>o.letter).join(', ');let explain=q.explanation?`<p>${esc(q.explanation)}</p>`:q.hasKey?'<p>Klucz odpowiedzi został odczytany z arkusza. Zaznaczenie wszystkich i tylko poprawnych odpowiedzi jest wymagane do pełnego punktu.</p>':'<p>W arkuszu nie znaleziono oznaczonego klucza dla tego pytania. Potraktuj je jako materiał do weryfikacji.</p>';fb.innerHTML=`<h3>${correct===true?'Poprawna odpowiedź':correct===false?'Odpowiedź nie w pełni poprawna':'Brak klucza w arkuszu'}</h3>${q.hasKey?`<p><strong>Poprawne odpowiedzi: ${right}</strong></p>`:''}${q.hasKey?`<p><strong>Punkty za pytanie: ${scoreAnswer(q,chosen)} / ${maxScore(q)}</strong></p>`:''}${explain}`;results[index]={q,chosen:[...chosen],correct};bumpProgress(q,correct);$('#checkBtn').classList.add('hidden');$('#nextBtn').classList.remove('hidden');$('#nextBtn').textContent=index===session.length-1?'Zakończ zestaw':'Następne pytanie →'}function bumpProgress(q,correct){let p=progress.byId[q.id]||{attempts:0,correct:0,starred:false};p.attempts++;p.lastCorrect=correct===true;p.incorrect=(p.incorrect||0)+(correct===false?1:0);p.unknown=(p.unknown||0)+(correct===null?1:0);if(correct===true)p.correct++;p.module=q.module;updateSpacedSchedule(p,correct);progress.byId[q.id]=p;progress.answered++;if(correct===true)progress.perfect++;
const chosen=answers[index]||[];
progress.history.push({date:new Date().toISOString(),module:normalizeModule(q.module),id:q.id,mode,correct,points:scoreAnswer(q,chosen),maximum:maxScore(q)});
saveProgress()}function goNext(){if(index<session.length-1){index++;renderQuestion()}else finishQuiz()}function finishQuiz(){stopExamTimer();if(mode==='exam'){for(let i=0;i<session.length;i++){if(!results[i]){results[i]={q:session[i],chosen:answers[i]||[],correct:isCorrect(session[i],answers[i]||[])};bumpProgress(session[i],results[i].correct)}}}progress.lastMistakes=results.filter(r=>r&&r.correct===false).map(r=>r.q.id);progress.sessions++;
if(mode==='exam'){const scored=results.filter(r=>r&&r.q.hasKey);const points=scored.reduce((a,r)=>a+scoreAnswer(r.q,r.chosen),0);const maximum=scored.reduce((a,r)=>a+maxScore(r.q),0);
progress.examHistory.push({date:new Date().toISOString(),points,maximum,pct:maximum?points/maximum*100:null,questions:scored.length});}
saveProgress();renderResults();switchScreen('results')}function renderResults(){const scored=results.filter(r=>r&&r.correct!==null);const good=scored.filter(r=>r.correct===true).length;const pct=scored.length?Math.round(good/scored.length*100):0;const points=scored.reduce((sum,r)=>sum+scoreAnswer(r.q,r.chosen),0);const maximum=scored.reduce((sum,r)=>sum+maxScore(r.q),0);const pointsPct=maximum>0?points/maximum*100:null;const pointsPctLabel=pointsPct===null?'—':pointsPct.toLocaleString('pl-PL',{maximumFractionDigits:1})+'%';const passed=pointsPct!==null&&pointsPct>=PASS_THRESHOLD;const passLabel=pointsPct===null?'BRAK OCENY':passed?'ZALICZONY':'NIEZALICZONY';$('#resultTitle').textContent=mode==='exam'?'Egzamin zakończony':'Nauka zakończona';$('#resultScore').textContent=pointsPctLabel;$('#passStatus').textContent=passLabel+' · próg '+PASS_THRESHOLD+'%';$('#passStatus').className='pass-status '+(pointsPct===null?'':passed?'passed':'failed');$('#resultText').textContent=`Wynik punktowy: ${points} / ${maximum} pkt (${pointsPctLabel} możliwych punktów). Poprawne komplety odpowiedzi: ${good} z ${scored.length} (${pct}%). ${results.length-scored.length} pytań bez klucza nie podlega punktacji. Wynik punktowy i procentowy mogą być ujemne.`;$('#resultStats').innerHTML=`<div class="progress-box"><strong>${pointsPctLabel}</strong><span>procent maks. punktów</span></div><div class="progress-box"><strong>${points}</strong><span>zdobyte punkty</span></div><div class="progress-box"><strong>${maximum}</strong><span>maks. punktów</span></div><div class="progress-box"><strong>${good}/${scored.length}</strong><span>całkowicie poprawnych</span></div>`;$('#reviewList').innerHTML=results.map((r,i)=>`<div class="review-item"><strong>${i+1}. ${esc(r.q.question)}</strong><small class="${r.correct===true?'right':r.correct===false?'wrong':''}">${r.correct===true?'Poprawnie':r.correct===false?'Nie w pełni poprawnie':'Brak klucza'} · ${r.q.hasKey?`Punkty: ${scoreAnswer(r.q,r.chosen)} / ${maxScore(r.q)} · `:''}Twoja odpowiedź: ${r.chosen.length?r.chosen.join(', '):'brak'}${r.q.hasKey?' · Klucz: '+r.q.options.filter(o=>o.correct).map(o=>o.letter).join(', '):''}</small></div>`).join('');}
function renderStats(){const all=questions.length;const solved=Object.keys(progress.byId).length;const vals=Object.values(progress.byId);const scored=vals.filter(p=>p.lastCorrect!==null&&p.lastCorrect!==undefined);const acc=scored.length?Math.round(scored.filter(p=>p.lastCorrect).length/scored.length*100):null;$('#totalCount').textContent=all;$('#seenCount').textContent=solved;$('#accuracy').textContent=acc===null?'—':`${acc}%`;$('#progressSummary').innerHTML=`<div class="progress-box"><strong>${solved}</strong><span>różnych pytań</span></div><div class="progress-box"><strong>${progress.answered}</strong><span>odpowiedzi łącznie</span></div><div class="progress-box"><strong>${progress.sessions}</strong><span>zestawów ukończonych</span></div>`;renderLearningDashboard();$('#moduleProgress').innerHTML=MODULES.map(m=>{let total=questions.filter(q=>normalizeModule(q.module)===m&&q.hasKey).length;let done=questions.filter(q=>normalizeModule(q.module)===m&&q.hasKey&&progress.byId[q.id]).length;return `<div class="module-row"><strong>Moduł ${m}</strong><div class="bar"><span style="width:${total?done/total*100:0}%"></span></div><span>${done}/${total}</span></div>`}).join('');renderDetailedStats();renderCharts()}
function renderDetailedStats(){const moduleHost=$('#detailedModules'),questionHost=$('#questionStats');if(!moduleHost||!questionHost)return;moduleHost.innerHTML=MODULES.map(m=>{const qs=questions.filter(q=>normalizeModule(q.module)===m),ps=qs.map(q=>progress.byId[q.id]).filter(Boolean),attempts=ps.reduce((a,x)=>a+(x.attempts||0),0),correct=ps.reduce((a,x)=>a+(x.correct||0),0),wrong=ps.reduce((a,x)=>a+(x.incorrect??Math.max(0,(x.attempts||0)-(x.correct||0)-(x.unknown||0))),0),unknown=ps.reduce((a,x)=>a+(x.unknown||0),0),rate=correct+wrong?Math.round(100*correct/(correct+wrong)):null;return `<div class="detail-module"><strong>Moduł ${m}</strong><span>Pytań: ${qs.length} · próby: ${attempts}</span><span>Poprawne: ${correct} · błędne: ${wrong}${unknown?' · bez klucza: '+unknown:''}</span><strong>${rate===null?'—':rate+'%'} poprawnych prób</strong></div>`}).join('');const filter=$('#statsModuleFilter')?.value||'all';const term=($('#statsSearch')?.value||'').toLocaleLowerCase('pl');const filtered=questions.filter(q=>(filter==='all'||normalizeModule(q.module)===filter)&&(!term||(q.question+' '+q.id).toLocaleLowerCase('pl').includes(term)));$('#questionStatsCount').textContent=`${filtered.length} pytań`;questionHost.innerHTML=filtered.map(q=>{const v=progress.byId[q.id]||{},attempts=v.attempts||0,correct=v.correct||0,unknown=v.unknown||0,wrong=v.incorrect??Math.max(0,attempts-correct-unknown);return `<div class="question-stat"><div><small>Moduł ${esc(q.module)} · ${esc(q.id)}</small><p>${esc(q.question)}</p></div><div class="question-numbers"><span>Próby: <b>${attempts}</b></span><span class="stat-positive">Poprawne: <b>${correct}</b></span><span class="stat-negative">Błędne: <b>${wrong}</b></span>${unknown?`<span>Bez klucza: ${unknown}</span>`:''}</div></div>`}).join('')||'<p class="muted">Nie znaleziono pytań.</p>'}

function renderCharts(){
 const host=$('#historyCharts');if(!host)return;
 const history=Array.isArray(progress.history)?progress.history:[];
 const exams=Array.isArray(progress.examHistory)?progress.examHistory:[];
 const filter=$('#chartModule')?.value||'all';
 const kind=$('#chartMetric')?.value||'points';
 const relevant=history.filter(h=>(filter==='all'||h.module===filter)&&h.maximum>0);
 const grouped=new Map();
 for(const h of relevant){const day=h.date?.slice(0,10);if(!day)continue;const x=grouped.get(day)||{date:day,points:0,maximum:0,correct:0,attempts:0};x.points+=h.points||0;x.maximum+=h.maximum||0;x.correct+=h.correct===true?1:0;x.attempts++;grouped.set(day,x)}
 const daily=[...grouped.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(x=>({label:x.date.slice(5),value:kind==='points'?100*x.points/x.maximum:100*x.correct/x.attempts}));
 const examData=exams.filter(e=>e.pct!==null&&Number.isFinite(e.pct)).map((e,i)=>({label:String(i+1),value:e.pct}));
 host.innerHTML=`<div class="chart-card"><h3>${kind==='points'?'Wynik punktowy':'W pełni poprawne odpowiedzi'} — kolejne dni</h3><p class="muted">Dzienny wynik ${kind==='points'?'punktowy / maksimum':'poprawnych kompletów odpowiedzi / liczba prób'}; moduł: ${filter==='all'?'wszystkie':filter}. Dane zbierane od wersji 7.</p>${lineChart(daily,kind==='points')}</div><div class="chart-card"><h3>Egzaminy próbne — wyniki w kolejności</h3><p class="muted">Procent zdobytych punktów. Linia przerywana oznacza próg zaliczenia 60%.</p>${lineChart(examData,true)}</div>`;
}
function lineChart(data,threshold){
 if(!data.length)return '<p class="muted chart-empty">Brak danych historycznych. Rozwiąż pytania lub egzamin, aby zobaczyć wykres.</p>';
 const w=720,h=240,l=52,r=18,t=22,b=42;
 const min=Math.min(0,...data.map(x=>x.value)),max=Math.max(100,...data.map(x=>x.value));
 const low=Math.floor(min/20)*20,high=Math.ceil(max/20)*20||100;
 const X=i=>l+(data.length===1?(w-l-r)/2:i*(w-l-r)/(data.length-1));
 const Y=v=>t+(high-v)*(h-t-b)/(high-low);
 const ticks=Array.from({length:5},(_,i)=>low+(high-low)*i/4);
 const grid=ticks.map(v=>`<line x1="${l}" y1="${Y(v)}" x2="${w-r}" y2="${Y(v)}" stroke="currentColor" opacity=".12"/><text x="${l-8}" y="${Y(v)+4}" text-anchor="end" fill="currentColor" font-size="12">${Math.round(v)}%</text>`).join('');
 const pts=data.map((d,i)=>`${X(i)},${Y(d.value)}`).join(' ');
 const dots=data.map((d,i)=>`<circle cx="${X(i)}" cy="${Y(d.value)}" r="4" fill="#1971c2"><title>${esc(d.label)}: ${d.value.toLocaleString('pl-PL',{maximumFractionDigits:1})}%</title></circle>`).join('');
 const indexes=[...new Set([0,Math.floor((data.length-1)/2),data.length-1])];
 const labels=indexes.map(i=>`<text x="${X(i)}" y="${h-13}" text-anchor="middle" fill="currentColor" font-size="12">${esc(data[i].label)}</text>`).join('');
 const pass=threshold?`<line x1="${l}" y1="${Y(60)}" x2="${w-r}" y2="${Y(60)}" stroke="#dc7b1d" stroke-width="2" stroke-dasharray="7 5"/>`:'';
 return `<div class="chart-scroll"><svg role="img" aria-label="Wykres postępów: ${data.length} pomiarów" viewBox="0 0 ${w} ${h}" width="100%" xmlns="http://www.w3.org/2000/svg">${grid}${pass}<polyline points="${pts}" fill="none" stroke="#1971c2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}</svg></div><p class="muted">Ostatni wynik: <strong>${data[data.length-1].value.toLocaleString('pl-PL',{maximumFractionDigits:1})}%</strong> · liczba pomiarów: ${data.length}</p>`;
}

function setupModules(){const modules=MODULES;const host=$('#moduleChoices');if(!host)throw new Error('Brak kontenera modułów');host.innerHTML=modules.map(m=>`<label class="module-choice"><input class="module-check" type="checkbox" value="${m}" checked> <span>Moduł ${m}</span><small class="module-count">${questions.filter(q=>normalizeModule(q.module)===m).length} pytań</small></label>`).join('');host.querySelectorAll('.module-check').forEach(input=>input.addEventListener('change',()=>{input.closest('.module-choice').classList.toggle('chosen',input.checked)}));host.querySelectorAll('.module-check').forEach(input=>input.closest('.module-choice').classList.add('chosen'));}
const IMPORT_STORE='iweTrainerExcelImportV1';
function hashText(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function questionFingerprint(q){return JSON.stringify([normalizeModule(q.module),q.question.trim(),q.options.map(o=>[o.letter,o.text.trim(),o.correct])])}
function idForQuestion(q,legacyMap,occurrence){
 const fp=questionFingerprint(q);
 const index=occurrence.get(fp)||0;
 occurrence.set(fp,index+1);
 // Każde wystąpienie jest osobnym pytaniem, również przy identycznym tekście i kluczu.
 // Pierwsze wystąpienie zachowuje historyczny identyfikator.
 const base=legacyMap.get(fp)||('excel_'+hashText(fp));
 return index===0?base:String(base)+'_powt_'+(index+1);
}
function loadSavedQuestions(){try{const saved=JSON.parse(localStorage.getItem(IMPORT_STORE)||'null');if(saved&&Array.isArray(saved.questions)&&saved.questions.length){questions=saved.questions;MODULES=[...new Set([...MODULES,...questions.map(q=>normalizeModule(q.module))])];}}catch(e){console.warn('Brak zapisanej bazy importowanej',e)}}
function updateImportInfo(){const el=$('#importInfo');if(!el)return;let saved=null;try{saved=JSON.parse(localStorage.getItem(IMPORT_STORE)||'null')}catch(e){}el.textContent=saved?.questions?.length?`Aktywna baza z importu: ${saved.name} · ${saved.questions.length} pytań · ${new Date(saved.importedAt).toLocaleString('pl-PL')}`:`Aktywna baza wbudowana: ${questions.length} pytań. Aby zaktualizować, wybierz plik XLSX.`}
async function zipEntries(buffer){
 const view=new DataView(buffer),u8=new Uint8Array(buffer);let eocd=-1;
 for(let i=u8.length-22;i>=Math.max(0,u8.length-65557);i--){if(view.getUint32(i,true)===0x06054b50){eocd=i;break}}
 if(eocd<0)throw Error('Nieprawidłowy plik XLSX (brak katalogu ZIP)');
 const count=view.getUint16(eocd+10,true),offset=view.getUint32(eocd+16,true);
 const names=new Map();let p=offset;const decoder=new TextDecoder();
 for(let n=0;n<count;n++){if(view.getUint32(p,true)!==0x02014b50)throw Error('Uszkodzony katalog ZIP');
 const method=view.getUint16(p+10,true),size=view.getUint32(p+20,true),nl=view.getUint16(p+28,true),ex=view.getUint16(p+30,true),co=view.getUint16(p+32,true),local=view.getUint32(p+42,true);
 const name=decoder.decode(u8.subarray(p+46,p+46+nl));names.set(name,{method,size,local});p+=46+nl+ex+co}
 return {async read(name){const e=names.get(name);if(!e)throw Error('Brak pliku w Excelu: '+name);const l=e.local;if(view.getUint32(l,true)!==0x04034b50)throw Error('Uszkodzony wpis ZIP');
 const begin=l+30+view.getUint16(l+26,true)+view.getUint16(l+28,true);
 const raw=u8.slice(begin,begin+e.size);
 if(e.method===0)return decoder.decode(raw);
 if(e.method!==8)throw Error('Nieobsługiwany typ kompresji XLSX');
 if(typeof DecompressionStream==='undefined')throw Error('Ta przeglądarka nie obsługuje odczytu XLSX offline. Użyj aktualnego Chrome.');
 const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
 return decoder.decode(await new Response(stream).arrayBuffer());
 },names:[...names.keys()]};
}
function xmlDoc(text){const d=new DOMParser().parseFromString(text,'application/xml');if(d.querySelector('parsererror'))throw Error('Nieprawidłowa struktura XML w Excelu');return d}
function byTag(node,tag){return [...node.getElementsByTagNameNS('*',tag)]}
function cellText(node){return byTag(node,'t').map(t=>t.textContent||'').join('')}
function columnNumber(ref){let n=0;for(const c of (ref.match(/^[A-Z]+/)||[''])[0])n=n*26+c.charCodeAt(0)-64;return n}
async function parseExcel(file){
 const zip=await zipEntries(await file.arrayBuffer());
 const shared=zip.names.includes('xl/sharedStrings.xml')?byTag(xmlDoc(await zip.read('xl/sharedStrings.xml')),'si').map(cellText):[];
 const wb=xmlDoc(await zip.read('xl/workbook.xml'));
 const sheets=byTag(wb,'sheet');const selected=sheets.find(s=>(s.getAttribute('name')||'').toUpperCase().includes('TESTY'))||sheets[0];
 if(!selected)throw Error('Brak arkusza z pytaniami');
 const relId=selected.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
 let path='xl/worksheets/sheet1.xml';
 if(relId){const rels=xmlDoc(await zip.read('xl/_rels/workbook.xml.rels'));const rel=byTag(rels,'Relationship').find(r=>r.getAttribute('Id')===relId);
 if(rel){const target=rel.getAttribute('Target');path=target.startsWith('/')?target.slice(1):target.startsWith('xl/')?target:'xl/'+target.replace(/^\.\//,'')}}
 const sheet=xmlDoc(await zip.read(path));const rows=[];
 for(const row of byTag(sheet,'row')){const values={};for(const c of [...row.children].filter(n=>n.localName==='c')){
 const col=columnNumber(c.getAttribute('r')||'');const typ=c.getAttribute('t');const v=byTag(c,'v')[0]?.textContent||'';
 values[col]=typ==='s'?(shared[Number(v)]||''):typ==='inlineStr'?cellText(c):typ==='b'?(v==='1'?'TRUE':'FALSE'):v||cellText(c);
 }rows.push({number:Number(row.getAttribute('r')),values})}
 const items=[];let skipped=0;
 for(let i=0;i<rows.length;i++){const r=rows[i].values;if(String(r[8]||'').trim()!=='1')continue;
 const module=normalizeModule(r[2]);const raw=String(r[4]||'').trim();
 if(!raw||!module){skipped++;continue}
 const options=[];
 for(let j=1;j<=4;j++){const v=rows[i+j]?.values||{};let answer=String(v[4]||'').trim().replace(/^\s*[a-dA-D][.)]\s*/,'');
 options.push({letter:'ABCD'[j-1],text:answer,correct:String(v[3]||'').trim().toLowerCase()==='x'})}
 if(options.some(o=>!o.text)){skipped++;continue}
 items.push({module,question:raw.replace(/^\s*\d+\s*[.)]\s*/,''),sourceNumber:(raw.match(/^\s*(\d+)/)||[])[1]||String(items.length+1),options,explanation:String(r[7]||'').trim(),hasKey:options.some(o=>o.correct)});
 }
 if(!items.length)throw Error('Nie znaleziono pytań. Sprawdź strukturę arkusza: moduł B, klucz C, treść D, znacznik pytania H.');
 const legacyMap=new Map(questions.map(q=>[questionFingerprint(q),q.id]));
 const occurrence=new Map();
 for(const q of items)q.id=idForQuestion(q,legacyMap,occurrence);
 // Identyczne pytania z arkusza są zachowane, ale otrzymują osobne identyfikatory.
 // Dodatkowa ochrona przed rzadką kolizją skrótu identyfikatora.
 const ids=new Set();
 for(const q of items){let id=String(q.id),suffix=2;while(ids.has(id)){id=String(q.id)+'_id_'+suffix++;}q.id=id;ids.add(id)}
 return {items,skipped};
}
async function importExcel(file){
 if(!file)return;const status=$('#importStatus');status.textContent='Wczytywanie i sprawdzanie arkusza…';
 try{const {items,skipped}=await parseExcel(file);
 const mods=[...new Set(items.map(q=>q.module))];const missing=items.filter(q=>!q.hasKey).length;const repeats=items.length-new Set(items.map(questionFingerprint)).size;
 if(!confirm(`Wczytano ${items.length} pytań w ${mods.length} modułach (${mods.join(', ')}). Brak klucza: ${missing}. Powtórzenia treści i klucza: ${repeats} (zostaną zachowane). Pominięte niekompletne pozycje: ${skipped}.\n\nZastąpić aktywną bazę pytań? Dotychczasowe wyniki pozostaną zapisane.`)){status.textContent='Import anulowany';return}
 const saved={name:file.name,importedAt:new Date().toISOString(),questions:items};
 try{localStorage.setItem(IMPORT_STORE,JSON.stringify(saved))}catch(e){throw Error('Brak miejsca lub dostępu do pamięci przeglądarki. Nie zapisano importu.')}
 questions=items;MODULES=[...new Set([...['I','II','III','IV','I N','II N','III N','IV N'],...mods])];
 setupModules();renderStats();updateImportInfo();status.textContent=`Zaimportowano ${items.length} pytań. Zmiany w Excelu wymagają ponownego importu.`;
 }catch(e){console.error('Błąd importu XLSX',e);status.textContent='Błąd: '+e.message;alert('Nie udało się zaimportować arkusza: '+e.message)}
 finally{$('#excelFile').value=''}
}
document.querySelector('#excelFile').addEventListener('change',e=>importExcel(e.target.files[0]));
document.querySelector('#restoreBaseBtn').addEventListener('click',()=>{if(!confirm('Przywrócić bazę pytań wbudowaną w aplikację? Zapisane wyniki pozostaną.'))return;
 localStorage.removeItem(IMPORT_STORE);questions=window.IWE_QUESTIONS;MODULES=['I','II','III','IV','I N','II N','III N','IV N'];setupModules();renderStats();updateImportInfo();$('#importStatus').textContent='Przywrócono bazę wbudowaną.'});


// --- Nauka adaptacyjna, interwały, egzamin czasowy, eksport postępów ---
function dueTime(q){const p=progress.byId[q.id];return p?.nextReview?Date.parse(p.nextReview)||0:0}
function isDue(q){const p=progress.byId[q.id];return !p||!p.nextReview||dueTime(q)<=Date.now()}
function isWeak(q){const p=progress.byId[q.id];return !!p&&(p.starred||p.lastCorrect===false||(p.incorrect||0)>0||(p.attempts||0)>0&&(p.correct||0)/(p.attempts||1)<0.8)}
function weakWeight(q){const p=progress.byId[q.id]||{};return (p.starred?10:0)+(p.incorrect||0)*3+(p.lastCorrect===false?5:0)}
function updateSpacedSchedule(p,correct){const now=new Date();const today=now.toISOString().slice(0,10);if(correct===true){p.streak=(p.streak||0)+1;p.reviewDays=[...new Set([...(p.reviewDays||[]),today])].slice(-30);const delays=[1,3,7,14,30,60,90];const d=delays[Math.min(p.streak-1,delays.length-1)];p.nextReview=new Date(now.getTime()+d*86400000).toISOString();}else{p.streak=0;p.nextReview=new Date(now.getTime()+86400000).toISOString()}}
function mastered(q){const p=progress.byId[q.id];return !!p&&p.lastCorrect===true&&(p.streak||0)>=3&&(p.reviewDays||[]).length>=2}
function renderLearningDashboard(){const host=$('#learningDashboard');if(!host)return;const due=questions.filter(q=>q.hasKey&&isDue(q)).length,weak=questions.filter(isWeak).length,master=questions.filter(mastered).length,unseen=questions.filter(q=>!progress.byId[q.id]).length;host.innerHTML=`<div class="progress-summary"><div class="progress-box"><strong>${due}</strong><span>do powtórki</span></div><div class="progress-box"><strong>${weak}</strong><span>słabe punkty</span></div><div class="progress-box"><strong>${master}</strong><span>opanowane</span></div><div class="progress-box"><strong>${unseen}</strong><span>nierozwiązane</span></div></div><p class="muted">Pytanie opanowane: co najmniej 3 poprawne odpowiedzi z rzędu w minimum 2 różnych dniach. Nowe pytania są dostępne w powtórkach.</p><div class="mastery-grid">${MODULES.map(m=>{const qs=questions.filter(q=>normalizeModule(q.module)===m&&q.hasKey),done=qs.filter(mastered).length,seen=qs.filter(q=>!!progress.byId[q.id]).length,pct=qs.length?Math.round(done/qs.length*100):0;return `<div class="mastery-item"><div><strong>${esc(m)}</strong><span>${done}/${qs.length} opanowanych · ${seen} poznanych</span></div><div class="bar"><span style="width:${pct}%"></span></div><small>${pct}%</small></div>`}).join('')}</div>`}
function updateStarButton(){const b=$('#starQuestionBtn');if(!b||!session[index])return;const starred=!!progress.byId[session[index].id]?.starred;b.textContent=starred?'★ Usuń z trudnych':'☆ Oznacz jako trudne';b.setAttribute('aria-pressed',String(starred))}
function toggleStar(){const q=session[index];if(!q)return;const p=progress.byId[q.id]||{attempts:0,correct:0,starred:false};p.starred=!p.starred;progress.byId[q.id]=p;saveProgress();updateStarButton()}
function stopExamTimer(){if(examTimer){clearInterval(examTimer);examTimer=null}examDeadline=0;const e=$('#examClock');if(e)e.classList.add('hidden')}
function startExamTimer(){if(mode!=='exam')return;const mins=Number($('#examMinutes')?.value||0);if(!mins)return;examDeadline=Date.now()+mins*60000;const clock=$('#examClock');clock.classList.remove('hidden');function tick(){const remaining=Math.max(0,Math.ceil((examDeadline-Date.now())/1000));clock.textContent=`Pozostało: ${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;if(remaining<=0&&!examTimeExpired){examTimeExpired=true;stopExamTimer();finishQuiz();alert('Czas egzaminu minął. Niezaznaczone odpowiedzi zostały ocenione jako pominięte.')}}tick();examTimer=setInterval(tick,1000)}
function downloadJson(name,obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function exportBackup(){const imported=(()=>{try{return JSON.parse(localStorage.getItem(IMPORT_STORE)||'null')}catch(e){return null}})();downloadJson('IWE_Trener_kopia_'+new Date().toISOString().slice(0,10)+'.json',{format:'IWE-Trener-backup',version:1,exportedAt:new Date().toISOString(),progress,imported})}
async function restoreBackup(file){if(!file)return;try{const obj=JSON.parse(await file.text());if(obj.format!=='IWE-Trener-backup'||obj.version!==1||!obj.progress||typeof obj.progress.byId!=='object'||!Array.isArray(obj.progress.history)||!Array.isArray(obj.progress.examHistory))throw Error('To nie jest poprawna kopia zapasowa IWE Trener.');if(obj.imported!==null&&obj.imported!==undefined&&(!Array.isArray(obj.imported.questions)||!obj.imported.questions.length))throw Error('Niepoprawna baza pytań w kopii.');if(!confirm('Przywrócić postępy, statystyki i importowaną bazę z kopii? Obecne dane zostaną zastąpione.'))return;const oldProgress=localStorage.getItem(STORE),oldImport=localStorage.getItem(IMPORT_STORE);try{localStorage.setItem(STORE,JSON.stringify(obj.progress));if(obj.imported)localStorage.setItem(IMPORT_STORE,JSON.stringify(obj.imported));else localStorage.removeItem(IMPORT_STORE)}catch(e){if(oldProgress===null)localStorage.removeItem(STORE);else localStorage.setItem(STORE,oldProgress);if(oldImport===null)localStorage.removeItem(IMPORT_STORE);else localStorage.setItem(IMPORT_STORE,oldImport);throw e}progress=obj.progress;progress.history||=[];progress.examHistory||=[];questions=window.IWE_QUESTIONS;MODULES=['I','II','III','IV','I N','II N','III N','IV N'];loadSavedQuestions();setupModules();updateImportInfo();renderStats();alert('Kopia została przywrócona.')}catch(e){alert('Nie udało się przywrócić kopii: '+e.message)}finally{$('#backupFile').value=''}}
$('#starQuestionBtn').addEventListener('click',toggleStar);
$('#exportBackupBtn').addEventListener('click',exportBackup);
$('#backupFile').addEventListener('change',e=>restoreBackup(e.target.files[0]));
$('#startDueBtn').addEventListener('click',()=>{$('#learningStrategy').value='due';startQuiz('learn')});
$('#startWeakBtn').addEventListener('click',()=>{$('#learningStrategy').value='weak';startQuiz('learn')});
(function addStudyActions(){
 const anchor=$('#startWeakBtn');
 if(anchor&&!$('#smartStudyBtn')){
  anchor.insertAdjacentHTML('afterend',' <button id="smartStudyBtn" type="button" class="secondary">Inteligentny zestaw</button> <button id="repeatMistakesBtn" type="button" class="secondary">Powtórz błędy ostatniego zestawu</button>');
  $('#smartStudyBtn').addEventListener('click',()=>startQuiz('learn',false,'smart'));
  $('#repeatMistakesBtn').addEventListener('click',()=>startQuiz('learn',false,'mistakes'));
 }
})();
window.addEventListener('keydown',event=>{
 if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||!$('#quiz')?.classList.contains('active'))return;
 const active=document.activeElement;
 if(active&&(active.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(active.tagName)))return;
 if((event.code==='Space'||event.key===' '||event.key==='Spacebar')&&mode==='learn'){
  event.preventDefault();toggleStar();return;
 }
 if(/^[1-4]$/.test(event.key)){
  const letter='ABCD'[Number(event.key)-1];
  const button=[...document.querySelectorAll('#options .option')].find(b=>b.dataset.letter===letter);
  if(!button||button.disabled||!$('#feedback').classList.contains('hidden'))return;
  event.preventDefault();toggleOption(button);return;
 }
 if(event.key==='Enter'){
  if(active&&active.tagName==='BUTTON'&&active.id!=='checkBtn'&&active.id!=='nextBtn'&&active.classList.contains('option')===false)return;
  const check=$('#checkBtn'),next=$('#nextBtn');
  if(check&&!check.classList.contains('hidden')){event.preventDefault();checkAnswer();}
  else if(next&&!next.classList.contains('hidden')){event.preventDefault();goNext();}
 }
});

document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>startQuiz(b.dataset.mode)));$('#checkBtn').addEventListener('click',checkAnswer);$('#nextBtn').addEventListener('click',goNext);$('#backBtn').addEventListener('click',()=>{if(confirm('Wrócić do menu? Bieżący zestaw nie zostanie zaliczony.')){stopExamTimer();switchScreen('home')}});$('#reviewBtn').addEventListener('click',()=>startQuiz('learn',true));$('#againBtn').addEventListener('click',()=>startQuiz(mode));$('#resultsHomeBtn').addEventListener('click',()=>switchScreen('home'));$('#resetBtn').addEventListener('click',()=>{if(confirm('Czy na pewno bezpowrotnie usunąć WSZYSTKIE wyniki nauki i egzaminów na tym urządzeniu? Baza pytań pozostanie bez zmian.')){progress={byId:{},sessions:0,answered:0,perfect:0,history:[],examHistory:[]};saveProgress();alert('Historia wyników została wyczyszczona.')}});$('#statsModuleFilter').addEventListener('change',renderDetailedStats);$('#statsSearch').addEventListener('input',renderDetailedStats);$('#chartModule').addEventListener('change',renderCharts);$('#chartMetric').addEventListener('change',renderCharts);window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('#installBtn').classList.remove('hidden')});$('#installBtn').addEventListener('click',async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('#installBtn').classList.add('hidden')});window.addEventListener('online',()=>$('#offlineStatus').textContent='Połączenie online');window.addEventListener('offline',()=>$('#offlineStatus').textContent='Tryb offline');async function init(){try{if(Array.isArray(window.IWE_QUESTIONS)){questions=window.IWE_QUESTIONS;}else{const r=await fetch('questions.json');if(!r.ok)throw new Error('HTTP '+r.status);questions=await r.json();}if(!Array.isArray(questions)||!questions.length)throw new Error('Pusta baza pytań');loadSavedQuestions();setupModules();updateImportInfo();renderStats();$('#offlineStatus').textContent=navigator.onLine?'Gotowa do nauki':'Tryb offline';if(location.protocol!=='file:'&&'serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(err=>console.warn('Service worker:',err));}catch(e){console.error('Nie udało się wczytać bazy IWE:',e);$('#offlineStatus').textContent='Błąd wczytywania bazy';$('#moduleChoices').innerHTML='<p class="muted">Nie udało się załadować bazy pytań. Rozpakuj cały folder aplikacji i otwórz index.html albo opublikuj cały folder na hostingu HTTPS.</p>';alert('Nie udało się wczytać bazy pytań. Sprawdź, czy rozpakowano cały folder aplikacji.');}}init();