export const $=s=>document.querySelector(s);export const $$=s=>Array.from(document.querySelectorAll(s));
export function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
export function toast(msg){const t=$('#toast');t.innerHTML=`<div>${esc(msg)}</div>`;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
export function empty(msg){return `<div class="empty">${esc(msg)}</div>`}
export function btn(label,cls,attrs=''){return `<button type="button" class="btn ${cls}" ${attrs}>${esc(label)}</button>`}
export function item(title,sub='',actions='',done=false){return `<article class="item ${done?'done':''}"><div class="item-top"><div><div class="item-title">${title}</div>${sub?`<div class="item-sub">${sub}</div>`:''}</div>${actions?`<div class="actions">${actions}</div>`:''}</div></article>`}
