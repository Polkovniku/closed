const landing=document.querySelector('#landing'),workspace=document.querySelector('#workspace');
function viewNow(v){const home=v==='landing';landing.hidden=!home;workspace.hidden=home;document.querySelector('header nav').style.visibility=home?'visible':'hidden';(window.__lenis?window.__lenis.scrollTo(0,{immediate:true}):window.scrollTo(0,0));if(!home)tab(v==='profile'?'profile':'library')}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));document.querySelector('header .brand').onclick=e=>{e.preventDefault();view('landing')};
function tab(t){if(!document.querySelector('#library-panel'))return;document.querySelector('#library-panel').hidden=t!=='library';document.querySelector('#profile-panel').hidden=t!=='profile';document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===t))}document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>tabFade(b.dataset.tab));
document.querySelectorAll('[data-join]').forEach(b=>b.onclick=()=>{document.querySelector('.join-notice').hidden=false;(window.__lenis?window.__lenis.scrollTo('#join',{offset:-80}):document.querySelector('#join').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}))});
const courses=[['volume','VOL','▥','Объёмы и Footprint','Читай движение изнутри','Как объём помогает понять структуру движения.'],['macro','MACRO','◎','Фундаментальный анализ','Контекст меняет всё','Макроэкономические факторы и взаимосвязи рынков.'],['options','OPT','⌁','Опционы','Другая сторона рынка','Знакомство с опционными данными и позиционированием.'],['macro','COT','≋','Позиционирование','Кто стоит за движением','COT-отчёты как часть рыночного контекста.']];let filter='all';const grid=document.querySelector('#course-grid'),dialog=document.querySelector('#lesson');function render(){if(!grid)return;const q=document.querySelector('#search').value.toLowerCase();grid.replaceChildren();courses.filter(c=>(filter==='all'||c[0]===filter)&&c.join(' ').toLowerCase().includes(q)).forEach(c=>{const b=document.createElement('button');b.className='course';b.innerHTML='<div class="mini-art">'+c[1]+'<span>'+c[2]+'</span></div><div class="details"><small>'+c[3].toUpperCase()+'</small><h3>'+c[4]+'</h3><p>'+c[5]+'</p></div>';b.onclick=()=>{document.querySelector('#lesson-title').textContent=c[4];dialog.showModal()};grid.append(b)});document.querySelector('#empty').hidden=grid.children.length>0}document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));render()});const _srch=document.querySelector('#search');if(_srch)_srch.oninput=render;render();document.querySelectorAll('.close,.close-action').forEach(b=>b.onclick=()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});

/* Split text into words and reveal them one after another; each block starts when the previous one ends. */
(()=>{let base=150;document.querySelectorAll('.reveal-words').forEach(el=>{const dur=+el.dataset.dur||1000,stag=+el.dataset.stagger||80;let i=0;const word=(node)=>{node.classList.add('word');node.style.setProperty('--i',i++);return node};const wrap=(text,cls)=>{const frag=document.createDocumentFragment();text.split(/(\s+)/).forEach(part=>{if(!part)return;if(/^\s+$/.test(part)){frag.append(part);return}const w=document.createElement('span');if(cls)w.className=cls;w.textContent=part;frag.append(word(w))});return frag};[...el.childNodes].forEach(n=>{if(n.nodeType===3)n.replaceWith(wrap(n.textContent));else if(n.nodeType===1&&n.tagName!=='BR'){if(n.textContent.trim())n.replaceWith(wrap(n.textContent,n.className));else word(n)}});el.style.setProperty('--dur',dur+'ms');el.style.setProperty('--stag',stag+'ms');const start=Math.max(150,base-(+el.dataset.overlap||0));el.style.setProperty('--base',start+'ms');base=start+Math.max(0,i-1)*stag+dur;el.classList.add('is-ready');const go=()=>el.classList.add('is-in');requestAnimationFrame(()=>requestAnimationFrame(go));setTimeout(go,400)});document.querySelectorAll('.reveal-after').forEach(el=>{el.style.setProperty('--base',Math.max(0,base-200)+'ms');el.classList.add('is-ready');const go=()=>el.classList.add('is-in');requestAnimationFrame(()=>requestAnimationFrame(go));setTimeout(go,400)})})();

/* Header becomes frosted glass as soon as the page leaves the very top. */
(()=>{const h=document.querySelector('header');if(!h)return;const upd=()=>h.classList.toggle('is-glass',window.scrollY>8);upd();window.addEventListener('scroll',upd,{passive:true})})();

/* Glass cursor (mouse and trackpad only). */
(()=>{if(!matchMedia('(pointer:fine)').matches)return;const P='M4.6 2.9L24.3 10.6Q26.8 11.7 24.9 13.4Q16.2 17.6 12.4 24.6Q10.9 27 9.9 24.4L2.9 4.7Q2.3 2.2 4.6 2.9Z';
const c=document.createElement('div');c.className='gcursor';c.setAttribute('aria-hidden','true');
c.innerHTML='<div class="gc-inner"><div class="gc-glass"></div><svg viewBox="0 0 30 30" width="30" height="30"><path d="'+P+'"/></svg></div>';
document.body.append(c);document.documentElement.classList.add('glass-cursor');
const HOT='a,button,label,select,summary,[role="button"],[data-view],[data-join],[data-tab],[data-filter],.course';
const hero=document.querySelector('.hero');
addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'&&e.pointerType!=='pen')return;c.style.transform=`translate3d(${e.clientX-3}px,${e.clientY-3}px,0)`;c.classList.add('is-on');
  const t=e.target,overText=t.closest&&t.closest('input,textarea');c.style.visibility=overText?'hidden':'';
  c.classList.toggle('is-hot',!!(t.closest&&t.closest(HOT))||!!(hero&&hero.classList.contains('badge-hover')))},{passive:true});
document.addEventListener('pointerleave',()=>c.classList.remove('is-on'));
document.documentElement.addEventListener('mouseleave',()=>c.classList.remove('is-on'));
addEventListener('pointerdown',()=>c.classList.add('is-down'));addEventListener('pointerup',()=>c.classList.remove('is-down'));
addEventListener('blur',()=>c.classList.remove('is-on'));})();

/* Smooth, weighted scrolling like the reference site (mouse / trackpad at any window width; off on touch and with reduced motion). */
(()=>{if(!window.Lenis||!matchMedia('(pointer: fine)').matches||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const lenis=new Lenis({duration:1.1,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true,wheelMultiplier:1});window.__lenis=lenis;
const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf);
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute('href');if(id.length<2)return;const el=document.querySelector(id);if(!el)return;e.preventDefault();lenis.scrollTo(el,{offset:-80})});})();

/* Page transitions: the current view fades out into a soft blur, then the next one fades in. */
const VT_REDUCE=matchMedia('(prefers-reduced-motion: reduce)');let vtBusy=false;
function view(v){const cur=landing.hidden?workspace:landing,next=v==='landing'?landing:workspace;
  if(cur===next||VT_REDUCE.matches){viewNow(v);return}if(vtBusy)return;vtBusy=true;
  cur.classList.add('vt-out');
  setTimeout(()=>{cur.classList.remove('vt-out');next.classList.add('vt-in');viewNow(v);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{next.classList.remove('vt-in');setTimeout(()=>{vtBusy=false},600)}))},380)}
function tabFade(t){const panels=[document.querySelector('#library-panel'),document.querySelector('#profile-panel')];const cur=panels.find(p=>!p.hidden),next=document.querySelector(t==='profile'?'#profile-panel':'#library-panel');
  if(!cur||cur===next||VT_REDUCE.matches){tab(t);return}
  cur.classList.add('vt-out');setTimeout(()=>{cur.classList.remove('vt-out');next.classList.add('vt-in');tab(t);requestAnimationFrame(()=>requestAnimationFrame(()=>next.classList.remove('vt-in')))},280)}

/* Keep the glass cursor visible above modal dialogs (they render in the browser's top layer). */
(()=>{const c=document.querySelector('.gcursor');if(!c)return;
const sync=()=>{const open=[...document.querySelectorAll('dialog[open]')].pop();const host=open||document.body;if(c.parentNode!==host)host.append(c)};
const mo=new MutationObserver(sync);document.querySelectorAll('dialog').forEach(d=>{mo.observe(d,{attributes:true,attributeFilter:['open']});d.addEventListener('close',sync)});sync()})();

/* Header switches to its light style while a light section sits under it. */
(()=>{const h=document.querySelector('header');if(!h)return;const upd=()=>{const y=h.offsetHeight/2;let light=false;
  document.querySelectorAll('.light-section').forEach(s=>{if(s.offsetParent===null)return;const r=s.getBoundingClientRect();if(r.top<=y&&r.bottom>=y)light=true});
  h.classList.toggle('on-light',light)};upd();addEventListener('scroll',upd,{passive:true});addEventListener('resize',upd)})();

/* Light sections fade their background from black to white as they enter the screen. */
(()=>{const secs=[...document.querySelectorAll('.light-section')];if(!secs.length)return;
  const ease=t=>t*t*(3-2*t);
  const upd=()=>{const vh=innerHeight;secs.forEach(s=>{const r=s.getBoundingClientRect();const p=Math.min(1,Math.max(0,(vh-r.top)/(vh*0.65)));s.style.setProperty('--zv',Math.round(244*ease(p)))})};
  secs.forEach(s=>s.classList.add('zebra-ready'));upd();addEventListener('scroll',upd,{passive:true});addEventListener('resize',upd);
  if(window.__lenis)window.__lenis.on('scroll',upd)})();

/* CREW card stack */
(()=>{const stack=document.querySelector('.crew-stack');if(!stack)return;const cards=[...stack.querySelectorAll('.crew-card')];const dots=[...document.querySelectorAll('.crew-dots i')];
  let order=cards.map((_,i)=>i),busy=false,timer=null;const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const paint=()=>{order.forEach((ci,pos)=>{const c=cards[ci];c.classList.remove('p0','p1','p2','p3');c.classList.add('p'+pos)});dots.forEach((d,i)=>d.classList.toggle('on',i===order[0]))};
  const next=()=>{if(busy)return;busy=true;const front=cards[order[0]];order=order.slice(1).concat(order[0]);
    if(reduce.matches){paint();busy=false;return}
    front.classList.add('to-back');order.slice(0,3).forEach((ci,pos)=>{const c=cards[ci];c.classList.remove('p0','p1','p2','p3');c.classList.add('p'+pos)});dots.forEach((d,i)=>d.classList.toggle('on',i===order[0]));
    setTimeout(()=>{front.classList.remove('to-back','p0');front.classList.add('p3');busy=false},1060)};
  const start=()=>{stop();if(!reduce.matches)timer=setInterval(next,3800)},stop=()=>{clearInterval(timer);timer=null};
  paint();start();
  stack.addEventListener('click',()=>{next();start()});
  stack.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();next();start()}});
  stack.addEventListener('mouseenter',stop);stack.addEventListener('mouseleave',start);
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start())})();

/* THE SPACE line: its orange underline draws in once the section comes into view. */
(()=>{const s=document.querySelector('#platform');if(!s||!('IntersectionObserver' in window)){s&&s.classList.add('in-view');return}
  const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){s.classList.add('in-view');io.disconnect()}},{threshold:.45});io.observe(s)})();

/* Members area (Личный кабинет) shows the very same panel as the landing preview, full size. */
(()=>{const src=document.querySelector('#platform .platform-preview'),slot=document.querySelector('#workspace .ws-slot');
  if(src&&slot&&!slot.firstElementChild)slot.append(src.cloneNode(true))})();

/* Platform preview: the sidebar switches panes (Materials / Progress / Profile); filters narrow the lessons;
   the member card tilts toward the cursor. */
document.querySelectorAll('.platform-preview').forEach(pv=>{
  const tabs=[...pv.querySelectorAll('.pv-tab')],panes=[...pv.querySelectorAll('.pv-pane')];
  const show=name=>{tabs.forEach(t=>{const on=t.dataset.pane===name;t.classList.toggle('side-active',on);t.setAttribute('aria-pressed',on)});
    panes.forEach(p=>{const on=p.dataset.pane===name;if(on&&!p.classList.contains('is-on')){p.classList.remove('played');requestAnimationFrame(()=>requestAnimationFrame(()=>p.classList.add('played')))}p.classList.toggle('is-on',on)})};
  tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.pane)));
  const fb=[...pv.querySelectorAll('[data-f]')],cards=[...pv.querySelectorAll('.pv-lesson')];
  fb.forEach(b=>b.addEventListener('click',()=>{const f=b.dataset.f;fb.forEach(x=>x.classList.toggle('is-on',x===b));
    cards.forEach(c=>{const on=f==='all'||c.dataset.cat===f;c.classList.toggle('is-off',!on)})}));
  const card=pv.querySelector('.idc');if(card&&matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      card.style.setProperty('--rx',(-y*7).toFixed(2)+'deg');card.style.setProperty('--ry',(x*9).toFixed(2)+'deg');card.style.setProperty('--sx',((x+.5)*100).toFixed(1)+'%');card.style.setProperty('--sy',((y+.5)*100).toFixed(1)+'%');card.classList.add('is-tilt')});
    card.addEventListener('pointerleave',()=>{card.classList.remove('is-tilt');card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg')})}
});

/* Platform preview theme switch (light / dark), remembered per browser when storage is available. */
(()=>{const pvs=[...document.querySelectorAll('.platform-preview')];if(!pvs.length)return;
  const set=d=>pvs.forEach(pv=>{pv.classList.toggle('pv-dark',d);const b=pv.querySelector('.pv-theme');if(b){b.setAttribute('aria-pressed',d);b.setAttribute('aria-label',d?'Светлая тема':'Тёмная тема')}});
  let saved=null;try{saved=localStorage.getItem('closed-pv-theme')}catch(e){}
  set(saved==='dark');requestAnimationFrame(()=>pvs.forEach(pv=>pv.classList.add('pv-themed')));
  pvs.forEach(pv=>{const b=pv.querySelector('.pv-theme');if(b)b.addEventListener('click',()=>{const d=!pv.classList.contains('pv-dark');set(d);try{localStorage.setItem('closed-pv-theme',d?'dark':'light')}catch(e){}})})})();

/* Platform panel "assembles" from particles: grains fly in from all around and settle into the panel's
   outline, sidebar, headings and cards, then the real panel fades in under them.
   Landing: once, when the block scrolls into view. Members area: each time it opens. */
(()=>{const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduce||!('IntersectionObserver' in window))return;
  const PARTS='.pv-brand,.pv-tab,.pv-foot,.pv-pane.is-on>.eyebrow,.pv-pane.is-on>h3,.pv-pane.is-on>.preview-tabs,.pv-pane.is-on .pv-lesson,.pv-pane.is-on .pg-ring,.pv-pane.is-on .pg-stats>div,.pv-pane.is-on .pg-list li,.pv-pane.is-on .idc';
  function targets(pv,ox,oy){const out=[],pr=pv.getBoundingClientRect(),dark=pv.classList.contains('pv-dark');
    const ink=dark?'242,242,244':'22,22,26',add=(x,y,c)=>out.push({x:x-ox,y:y-oy,c});
    const step=6;for(let x=pr.left;x<=pr.right;x+=step){add(x,pr.top,ink);add(x,pr.bottom,ink)}for(let y=pr.top;y<=pr.bottom;y+=step){add(pr.left,y,ink);add(pr.right,y,ink)}
    const aside=pv.querySelector('aside');if(aside){const a=aside.getBoundingClientRect();for(let y=a.top;y<=a.bottom;y+=7)add(a.right,y,ink)}
    pv.querySelectorAll(PARTS).forEach(el=>{const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
      const big=r.width*r.height>20000,s=big?9:5;
      for(let y=r.top+2;y<r.bottom-1;y+=s)for(let x=r.left+2;x<r.right-1;x+=s){
        const edge=x-r.left<s+2||r.right-x<s+2||y-r.top<s+2||r.bottom-y<s+2;if(big&&!edge&&Math.random()<.55)continue;
        add(x+(Math.random()-.5)*2,y+(Math.random()-.5)*2,Math.random()<.13?'255,106,31':ink)}});
    if(out.length>6000){for(let i=out.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[out[i],out[j]]=[out[j],out[i]]}out.length=6000}
    return out}
  function assemble(pv){if(pv.__asm)return;pv.__asm=true;
    const host=pv.parentElement;if(getComputedStyle(host).position==='static')host.style.position='relative';
    const M=180,hr=host.getBoundingClientRect(),pr=pv.getBoundingClientRect();
    const W=pr.width+M*2,H=pr.height+M*2,L=pr.left-hr.left-M,T=pr.top-hr.top-M,dpr=Math.min(2,devicePixelRatio||1);
    const cv=document.createElement('canvas');cv.className='pv-dust';cv.width=W*dpr;cv.height=H*dpr;Object.assign(cv.style,{left:L+'px',top:T+'px',width:W+'px',height:H+'px'});host.append(cv);
    const x=cv.getContext('2d');x.scale(dpr,dpr);
    const ps=targets(pv,pr.left-M,pr.top-M).map(t=>{const a=Math.random()*Math.PI*2,d=120+Math.random()*Math.max(W,H)*.55;
      return{tx:t.x,ty:t.y,c:t.c,sx:t.x+Math.cos(a)*d,sy:t.y+Math.sin(a)*d,dl:(t.x/W)*.35+Math.random()*.3,du:.75+Math.random()*.45,sw:(Math.random()-.5)*60,sz:Math.random()<.2?2.2:1.4}});
    const t0=performance.now();let built=false;
    const ease=p=>1-Math.pow(1-p,3);
    const frame=()=>{const t=(performance.now()-t0)/1000;x.clearRect(0,0,W,H);
      const fade=t<1.25?1:Math.max(0,1-(t-1.25)/.6);
      for(const p of ps){let k=(t-p.dl)/p.du;if(k<0){x.globalAlpha=.0;continue}k=Math.min(1,k);const e=ease(k),wob=Math.sin(k*Math.PI)*p.sw;
        const px=p.sx+(p.tx-p.sx)*e+wob*.4,py=p.sy+(p.ty-p.sy)*e-wob*.3;
        x.globalAlpha=Math.min(1,k*2.2)*(k<1?.75:.9)*fade;x.fillStyle='rgb('+p.c+')';x.fillRect(px,py,p.sz,p.sz)}
      if(!built&&t>1.05){built=true;pv.classList.add('pv-built');pv.classList.remove('pv-pre')}
      if(t<1.9)requestAnimationFrame(frame);else{cv.remove();pv.__asm=false}};
    requestAnimationFrame(frame)}
  const lp=document.querySelector('#platform .platform-preview');
  if(lp){lp.classList.add('pv-pre');const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();assemble(lp)}},{threshold:.3});io.observe(lp)}
  const ws=document.querySelector('#workspace');
  if(ws){new MutationObserver(()=>{if(ws.hidden)return;const wp=ws.querySelector('.platform-preview');if(!wp||wp.__asm)return;
      wp.classList.remove('pv-built');wp.classList.add('pv-pre');setTimeout(()=>assemble(wp),120)}).observe(ws,{attributes:true,attributeFilter:['hidden']})}
})();

/* Join: the orange underline draws in when the block comes into view. */
(()=>{const s=document.querySelector('#join');if(!s)return;if(!('IntersectionObserver' in window)){s.classList.add('in-view');return}
  const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){s.classList.add('in-view');io.disconnect()}},{threshold:.5});io.observe(s)})();

/* Application form: opens from «Подать заявку», validates the basics, shows a confirmation. */
(()=>{const d=document.querySelector('#apply');if(!d||!d.showModal)return;const form=d.querySelector('.apply-form'),done=d.querySelector('.apply-done'),err=d.querySelector('.apply-err');
  const open=()=>{form.hidden=false;done.hidden=true;err.hidden=true;d.classList.remove('closing');d.showModal();window.__lenis&&window.__lenis.stop();
    setTimeout(()=>{const f=form.querySelector('input');f&&f.focus({preventScroll:true})},350)};
  const close=()=>{if(!d.open)return;d.classList.add('closing');setTimeout(()=>{d.close();d.classList.remove('closing')},280)};
  d.addEventListener('close',()=>{window.__lenis&&window.__lenis.start()});
  d.addEventListener('cancel',e=>{e.preventDefault();close()});
  document.querySelectorAll('[data-apply]').forEach(b=>b.addEventListener('click',open));
  d.querySelector('.apply-x').addEventListener('click',close);d.querySelector('.apply-close-btn').addEventListener('click',close);
  d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()});
  form.addEventListener('input',e=>{const f=e.target.closest('.fld,.agree');f&&f.classList.remove('bad')});
  form.addEventListener('submit',e=>{e.preventDefault();const bad=[];
    const chk=(el,ok)=>{const box=el.closest('.fld,.agree');box&&box.classList.toggle('bad',!ok);if(!ok)bad.push(el)};
    const v=n=>form.elements[n];
    chk(v('name'),v('name').value.trim().length>1);
    chk(v('tg'),/^@?[A-Za-z0-9_]{4,32}$/.test(v('tg').value.trim()));
    chk(v('email'),/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email').value.trim()));
    const exp=form.querySelector('input[name=exp]');chk(exp,!!form.querySelector('input[name=exp]:checked'));
    chk(v('agree'),v('agree').checked);
    if(bad.length){err.textContent='Проверь отмеченные поля: имя, Telegram, email, опыт и согласие.';err.hidden=false;bad[0].focus({preventScroll:false});return}
    err.hidden=true;form.hidden=true;done.hidden=false;form.reset();d.scrollTop=0});
})();
