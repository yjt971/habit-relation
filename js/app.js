import { bindEvents } from './events.js';
import { safeRender } from './render.js';
import { initFirebase, scheduleCloudSync, isApplyingRemote, lifecycleSync, startAutoSync } from './firebase.js';

bindEvents();
requestAnimationFrame(()=>safeRender());
initFirebase().then(()=>{startAutoSync();safeRender();lifecycleSync().finally(()=>safeRender()).catch(()=>{});}).catch(()=>safeRender());

window.addEventListener('habit-state-saved',e=>{ if(!isApplyingRemote()) scheduleCloudSync(e.detail?.source||'change',1000); });
window.addEventListener('habit-remote-updated',()=>safeRender());
window.addEventListener('habit-sync-complete',()=>safeRender());
window.addEventListener('focus',()=>lifecycleSync().finally(()=>safeRender()).catch(()=>{}));
window.addEventListener('pageshow',()=>lifecycleSync().finally(()=>safeRender()).catch(()=>{}));
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) lifecycleSync().finally(()=>safeRender()).catch(()=>{}); });

if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
