// IWE Trener 2.0 — czysty, niezależny model domenowy (ES module).
export function assertQuestion(question) {
 if (!question || typeof question.questionId !== 'string' || !question.questionId.trim()) throw new Error('Brak questionId');
 if (typeof question.revisionId !== 'string' || !question.revisionId.trim()) throw new Error('Brak revisionId');
 if (!Array.isArray(question.options) || question.options.length < 2) throw new Error('Za mało wariantów');
 const ids=question.options.map(o=>o.optionId);
 if (ids.some(id=>typeof id!=='string'||!id.trim()) || new Set(ids).size!==ids.length) throw new Error('Nieprawidłowe optionId');
 if (!Array.isArray(question.correctOptionIds) || question.correctOptionIds.some(id=>!ids.includes(id))) throw new Error('Nieprawidłowy klucz odpowiedzi');
 return true;
}
export function makeAnswerEvent({question,selectedOptionIds,sessionId,mode,deviceId,now=new Date(),uuid=()=>crypto.randomUUID()}) {
 assertQuestion(question);
 if (!Array.isArray(selectedOptionIds) || new Set(selectedOptionIds).size!==selectedOptionIds.length) throw new Error('Powielone zaznaczenia');
 const ids=new Set(question.options.map(o=>o.optionId));
 if (selectedOptionIds.some(id=>!ids.has(id))) throw new Error('Nieznany wariant odpowiedzi');
 if (!sessionId || !deviceId || !mode) throw new Error('Brak identyfikatora sesji, urządzenia lub trybu');
 const correct=new Set(question.correctOptionIds);
 const isCorrect=selectedOptionIds.length===correct.size&&selectedOptionIds.every(id=>correct.has(id));
 return Object.freeze({schemaVersion:2,eventId:uuid(),eventType:'answer',sessionId,deviceId,questionId:question.questionId,revisionId:question.revisionId,mode,selectedOptionIds:[...selectedOptionIds],correctOptionIds:[...question.correctOptionIds],correct:isCorrect,occurredAt:now.toISOString()});
}
export function mergeEvents(...sources) {
 const byId=new Map();
 for(const events of sources)for(const event of events){
  if(!event?.eventId)throw new Error('Zdarzenie bez eventId');
  const previous=byId.get(event.eventId);
  if(previous&&JSON.stringify(previous)!==JSON.stringify(event))throw new Error('Konflikt eventId: '+event.eventId);
  byId.set(event.eventId,event);
 }
 return [...byId.values()].sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt)||a.eventId.localeCompare(b.eventId));
}
export function calculateStats(events) {
 const answers=mergeEvents(events).filter(e=>e.eventType==='answer');
 const byQuestion={};
 for(const e of answers){
  const p=byQuestion[e.questionId]??={attempts:0,correct:0,incorrect:0,lastCorrect:null,streak:0,reviewDays:[]};
  p.attempts++;
  if(e.correct){p.correct++;p.streak++;const day=e.occurredAt.slice(0,10);if(!p.reviewDays.includes(day))p.reviewDays.push(day)}
  else {p.incorrect++;p.streak=0}
  p.lastCorrect=!!e.correct;
 }
 return {answered:answers.length,correct:answers.filter(e=>e.correct).length,questionsAttempted:Object.keys(byQuestion).length,byQuestion};
}
