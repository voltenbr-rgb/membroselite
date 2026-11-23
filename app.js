const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const STORE_KEY = 'eliteAcademyDemoV1';
const DEMO_PASSWORD = '1989';
const DEFAULT_COVERS = { 'metodo-lp': 'assets/elite-academy-cover.svg' };

const initialCourses = [
 {id:'metodo-lp',name:'Método LP',desc:'Aprenda a estruturar sua presença digital e transformar atenção em oportunidades.',color:'green',tag:'MÉTODO EXCLUSIVO',code:'LP',locked:false,progress:38,modules:[
  {name:'Módulo 01 — Fundamentos',lessons:[
   {title:'Boas-vindas ao Método LP',type:'video',url:'https://www.youtube.com/watch?v=ysz5S6PUM-U',body:'Uma visão geral da jornada, dos objetivos e de como aproveitar melhor o treinamento.'},
   {title:'Mentalidade e preparação',type:'text',body:'Antes de executar, defina seu objetivo, conheça seu público e organize uma rotina simples de aplicação. Anote suas metas e acompanhe sua evolução.'},
   {title:'Checklist de início rápido',type:'pdf',url:'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',body:'Material demonstrativo para organizar os primeiros passos.'}
  ]},
  {name:'Módulo 02 — Estratégia',lessons:[
   {title:'Construindo uma oferta clara',type:'video',url:'https://www.youtube.com/watch?v=jfKfPfyJRdk',body:'Aprenda a apresentar valor de forma simples e objetiva.'},
   {title:'Conteúdo que gera conexão',type:'text',body:'Crie conteúdos que respondam dúvidas reais, demonstrem benefícios e conduzam o público para o próximo passo.'}
  ]},
  {name:'Módulo 03 — Aplicação prática',lessons:[
   {title:'Plano de ação de 7 dias',type:'text',body:'Dia 1: planejar. Dias 2 e 3: produzir. Dias 4 e 5: publicar e conversar. Dias 6 e 7: analisar e ajustar.'}
  ]}
 ]},
 {id:'digital-scale',name:'Digital Scale Pro',desc:'Processos e estratégias para organizar e escalar negócios no digital.',color:'purple',tag:'ESCALA & PERFORMANCE',code:'DS',locked:false,progress:16,modules:[
  {name:'Módulo 01 — Estrutura',lessons:[{title:'O mapa da escala digital',type:'video',url:'https://www.youtube.com/watch?v=ysz5S6PUM-U',body:'Conheça os pilares de uma operação digital organizada.'},{title:'Organização de processos',type:'text',body:'Documente tarefas recorrentes, defina responsáveis e acompanhe indicadores simples.'}]},
  {name:'Módulo 02 — Crescimento',lessons:[{title:'Indicadores essenciais',type:'text',body:'Acompanhe aquisição, conversão, retenção e satisfação para decidir com clareza.'}]}
 ]},
 {id:'design-magnetico',name:'Design Magnético',desc:'Design, identidade visual e criativos que valorizam sua marca.',color:'blue',tag:'CRIATIVIDADE & MARCA',code:'DM',locked:false,progress:12,modules:[
  {name:'Módulo 01 — Direção visual',lessons:[{title:'Princípios de um visual forte',type:'video',url:'https://www.youtube.com/watch?v=ysz5S6PUM-U',body:'Explore hierarquia, contraste, consistência e clareza visual.'},{title:'Guia de identidade',type:'pdf',url:'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',body:'Guia demonstrativo de identidade visual.'}]},
  {name:'Módulo 02 — Criativos',lessons:[{title:'Composição para redes sociais',type:'text',body:'Comece por uma mensagem principal, use poucos elementos e mantenha contraste suficiente para leitura.'}]}
 ]},
 {id:'trafego-elite',name:'Tráfego Elite',desc:'Fundamentos de campanhas, públicos e análise de resultados.',color:'orange',tag:'ACESSO PREMIUM',code:'TE',locked:true,progress:0,modules:[]},
 {id:'copy-pro',name:'Copywriting Pro',desc:'Escrita persuasiva, ofertas e comunicação que conecta.',color:'purple',tag:'ACESSO PREMIUM',code:'CP',locked:true,progress:0,modules:[]},
 {id:'automacao',name:'Automação Inteligente',desc:'Ganhe tempo com fluxos e processos digitais.',color:'green',tag:'ACESSO PREMIUM',code:'AI',locked:true,progress:0,modules:[]}
];

/* ---------------- Estado ---------------- */
let state = loadState();
let currentCourse = null;
let currentLesson = null;          // {mi, li}
let openModules = new Set();
let heroIndex = 0;
let courseFilter = 'all';
let searchTerm = '';

function loadState(){
  try{ const s = JSON.parse(localStorage.getItem(STORE_KEY)); if(s && s.courses) return {completed:[], ...s}; }catch(e){}
  return {courses: JSON.parse(JSON.stringify(initialCourses)), completed: [], user: null};
}
function save(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); return true; }
  catch(e){ console.warn('Não foi possível salvar os dados neste navegador:', e); return false; }
}

/* ---------------- Utilitários ---------------- */
function safe(s = ''){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function icon(name, cls = ''){ return `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`; }
function toast(msg){ const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2600); }
function pad(n){ return String(n).padStart(2, '0'); }
function niceTag(t = ''){ const s = String(t).toLocaleLowerCase('pt-BR'); return s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1); }
function safeUrl(u){
  u = String(u || '').trim();
  if(!/^(https?:\/\/|assets\/)/i.test(u)) return '';
  return u.replace(/["'()\\\s<>]/g, encodeURIComponent);
}
function lessonKey(c, mi, li){ return `${c.id}-${mi}-${li}`; }
function lessonsOf(c){ const out = []; c.modules.forEach((m, mi) => m.lessons.forEach((l, li) => out.push({mi, li, l, key: lessonKey(c, mi, li)}))); return out; }
function courseStats(c){
  const all = lessonsOf(c);
  const done = all.filter(x => state.completed.includes(x.key)).length;
  const pct = all.length ? Math.round(done / all.length * 100) : 0;
  return {total: all.length, done, pct};
}
function nextLesson(c){ const all = lessonsOf(c); return all.find(x => !state.completed.includes(x.key)) || all[0] || null; }
function typeLabel(t){ return t === 'video' ? 'Videoaula' : t === 'pdf' ? 'Material PDF' : 'Aula em texto'; }
function typeIcon(t){ return t === 'video' ? 'video' : t === 'pdf' ? 'file' : 'text'; }
function coverHTML(c){
  const url = safeUrl(c.coverUrl || DEFAULT_COVERS[c.id]);
  if(url) return `<div class="cover" style="background-image:url('${url}')"></div>`;
  return `<div class="cover cover-gen c-${safe(c.color || 'green')}"><span class="cover-code">${safe(c.code || '')}</span></div>`;
}
function unlocked(){ return state.courses.filter(c => !c.locked); }

/* ---------------- Cards ---------------- */
function courseCard(c){
  const s = courseStats(c);
  const badge = c.locked
    ? `<span class="pill pill-glass thumb-badge">${icon('lock')} Bloqueado</span>`
    : (s.pct === 100 ? `<span class="pill pill-glass thumb-badge">${icon('check')} Concluído</span>` : '');
  const bar = !c.locked && s.pct > 0 && s.pct < 100 ? `<div class="thumb-progress"><i style="width:${s.pct}%"></i></div>` : '';
  const play = c.locked ? '' : `<span class="thumb-play">${icon('play')}</span>`;
  const sub = c.locked ? 'Toque para desbloquear' : (s.total ? `${s.done}/${s.total} aulas · ${s.pct}% concluído` : 'Conteúdo em breve');
  return `<button class="course-card${c.locked ? ' locked' : ''}" data-course="${safe(c.id)}" aria-label="${safe(c.name)}">
    <div class="thumb">${coverHTML(c)}${badge}${bar}${play}</div>
    <div class="card-meta"><h3>${safe(c.name)}</h3><span class="pill">${icon('tag')}${safe(niceTag(c.tag))}</span></div>
    <p class="card-sub">${sub}</p>
  </button>`;
}
function progressItem(c){
  const s = courseStats(c);
  const n = nextLesson(c);
  const line = s.total === 0 ? '<small>Conteúdo em breve</small>'
    : s.pct === 100 ? '<small class="on">Concluído</small>'
    : `<small class="${s.done ? 'on' : ''}">${s.done ? 'Em andamento' : 'Não iniciado'}${n ? ' · ' + safe(n.l.title) : ''}</small>`;
  return `<button class="p-item" data-course="${safe(c.id)}">
    <span class="p-thumb">${coverHTML(c)}</span>
    <span class="p-body"><b>${safe(c.name)}</b>${line}<span class="progress-line"><i style="width:${s.pct}%"></i></span></span>
    <span class="p-pct">${s.pct}%</span>
  </button>`;
}

/* ---------------- Destaque (hero) ---------------- */
function heroHTML(c, {detail = false, list = []} = {}){
  const s = courseStats(c);
  const n = nextLesson(c);
  const hasVideo = lessonsOf(c).some(x => x.l.type === 'video');
  const hasPdf = lessonsOf(c).some(x => x.l.type === 'pdf');
  const cta = c.locked ? `${icon('lock')} Desbloquear curso`
    : !s.total ? 'Ver curso'
    : s.pct === 100 ? `${icon('play', 'ic-fill')} Rever curso`
    : s.done ? `${icon('play', 'ic-fill')} Continuar curso` : `${icon('play', 'ic-fill')} Começar curso`;
  const nav = !detail && list.length > 1 ? `<div class="hero-nav"><button data-hero="-1" aria-label="Curso anterior">${icon('chevron-left')}</button><button data-hero="1" aria-label="Próximo curso">${icon('chevron-right')}</button></div>` : '';
  const dots = !detail && list.length > 1 ? `<div class="hero-dots">${list.map((x, i) => `<button data-hero-go="${i}" class="${i === heroIndex ? 'active' : ''}" aria-label="Destaque ${i + 1}"></button>`).join('')}</div>` : '';
  const nextChip = !c.locked && n ? `<span class="pill pill-glass">${icon('play')} ${s.done ? 'Próxima' : 'Primeira aula'}: ${safe(n.l.title)}</span>` : '<span></span>';
  return `<div class="hero-banner">
      ${coverHTML(c)}
      <div class="hero-top"><span class="pill pill-glass">${safe(niceTag(c.tag))}</span>${c.modules.length ? `<span class="pill pill-glass">${icon('layers')} ${c.modules.length} ${c.modules.length === 1 ? 'módulo' : 'módulos'}</span>` : ''}</div>
      <div class="hero-bottom">${nextChip}${nav}</div>
    </div>
    <div class="hero-info">
      <h2>${safe(c.name)}</h2>
      <p class="by">ELITE Academy</p>
      ${detail ? `<p class="desc">${safe(c.desc)}</p>` : ''}
      <div class="tag-list">
        <span class="pill">${icon('courses')} ${s.total} ${s.total === 1 ? 'aula' : 'aulas'}</span>
        ${hasVideo ? `<span class="pill">${icon('video')} Vídeo</span>` : ''}
        ${hasPdf ? `<span class="pill">${icon('file')} PDF</span>` : ''}
      </div>
      ${c.locked ? '' : `<div class="progress-label"><span>Seu progresso</span><b>${s.pct}%</b></div><div class="progress-line"><i style="width:${s.pct}%"></i></div>`}
      <button class="btn btn-primary full" data-continue="${safe(c.id)}">${cta}</button>
      ${dots}
    </div>`;
}
function renderHero(){
  const list = unlocked().length ? unlocked() : state.courses;
  if(!list.length){ $('#hero').innerHTML = ''; return; }
  heroIndex = (heroIndex + list.length) % list.length;
  $('#hero').innerHTML = heroHTML(list[heroIndex], {list});
}

/* ---------------- Renderização das páginas ---------------- */
function renderHome(){
  renderHero();
  const open = unlocked();
  const continueList = open.filter(c => courseStats(c).pct < 100);
  const rowC = continueList.length ? continueList : open;
  $('#rowContinue').innerHTML = rowC.length ? rowC.map(courseCard).join('') : '<div class="row-empty">Nenhum curso liberado ainda.</div>';
  const locked = state.courses.filter(c => c.locked);
  $('#rowLocked').innerHTML = locked.length ? locked.map(courseCard).join('') : '<div class="row-empty">Você já tem acesso a todos os cursos.</div>';
  $('#progressList').innerHTML = open.length ? open.map(progressItem).join('') : '<p class="module-empty">Seus cursos liberados aparecerão aqui.</p>';
}
function matchesFilter(c){
  const s = courseStats(c);
  if(courseFilter === 'locked' && !c.locked) return false;
  if(courseFilter === 'progress' && (c.locked || s.pct === 100)) return false;
  if(courseFilter === 'done' && (c.locked || s.pct < 100 || !s.total)) return false;
  if(searchTerm){
    const hay = [c.name, c.desc, c.tag, ...lessonsOf(c).map(x => x.l.title)].join(' ').toLocaleLowerCase('pt-BR');
    if(!hay.includes(searchTerm)) return false;
  }
  return true;
}
function renderCourses(){
  const list = state.courses.filter(matchesFilter);
  $('#allCourses').innerHTML = list.map(courseCard).join('');
  $('#coursesEmpty').classList.toggle('hidden', list.length > 0);
  $('#coursesEmpty').textContent = searchTerm ? `Nenhum curso encontrado para “${searchTerm}”.` : 'Nenhum curso nesta categoria.';
  $('#courseCount').textContent = `${list.length} de ${state.courses.length} treinamentos`;
  $$('[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === courseFilter));
}
function renderLibrary(){
  const items = [];
  state.courses.forEach(c => { if(c.locked) return; lessonsOf(c).forEach(x => { if(x.l.type === 'pdf' && safeUrl(x.l.url)) items.push({c, ...x}); }); });
  $('#libraryContent').innerHTML = items.length ? items.map(i => `<article class="library-item"><div class="file-icon">${icon('file')}</div><h3>${safe(i.l.title)}</h3><p>${safe(i.c.name)} · ${safe(i.l.body || 'Material de apoio')}</p><a href="${safe(safeUrl(i.l.url))}" target="_blank" rel="noopener">Abrir material ${icon('external')}</a></article>`).join('')
    : '<div class="panel-note">Seus PDFs e materiais de apoio aparecerão aqui quando forem adicionados aos cursos.</div>';
}
function renderProgressPage(){
  const open = unlocked();
  const totals = open.reduce((a, c) => { const s = courseStats(c); a.t += s.total; a.d += s.done; if(s.pct === 100 && s.total) a.f++; return a; }, {t: 0, d: 0, f: 0});
  const avg = totals.t ? Math.round(totals.d / totals.t * 100) : 0;
  $('#statsRow').innerHTML = `
    <div class="stat hl"><b>${avg}%</b><span>Progresso geral</span></div>
    <div class="stat"><b>${totals.d}</b><span>Aulas concluídas de ${totals.t}</span></div>
    <div class="stat"><b>${open.length}</b><span>Cursos liberados</span></div>
    <div class="stat"><b>${totals.f}</b><span>Cursos concluídos</span></div>`;
  $('#progressFull').innerHTML = open.length ? open.map(progressItem).join('') : '<p class="module-empty">Nenhum curso liberado ainda.</p>';
}
function renderAll(){
  renderHome();
  renderCourses();
  renderLibrary();
  renderProgressPage();
  if(currentCourse && !$('#coursePage').classList.contains('hidden')) renderCourseDetail();
}

/* ---------------- Navegação ---------------- */
const NAV_FOR = {homePage: 'home', coursesPage: 'courses', coursePage: 'courses', libraryPage: 'library', progressPage: 'progress'};
function showPage(id){
  $$('.page').forEach(p => p.classList.add('hidden'));
  $('#' + id).classList.remove('hidden');
  $$('.nav-item[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === NAV_FOR[id]));
  $$('.sub-item').forEach(b => b.classList.toggle('active', id === 'coursesPage' && b.dataset.filter === courseFilter));
  closeSidebar();
  window.scrollTo(0, 0);
}
function goView(view){
  if(view === 'home'){ renderHome(); showPage('homePage'); }
  if(view === 'courses'){ renderCourses(); showPage('coursesPage'); }
  if(view === 'library'){ renderLibrary(); showPage('libraryPage'); }
  if(view === 'progress'){ renderProgressPage(); showPage('progressPage'); }
}
function goFilter(f){ courseFilter = f; $('#coursesGroup').classList.add('open'); renderCourses(); showPage('coursesPage'); }
function closeSidebar(){ $('#sidebar').classList.remove('open'); $('#sidebarScrim').classList.remove('show'); }

/* ---------------- Curso e aulas ---------------- */
function openCourse(id, {resume = false} = {}){
  const c = state.courses.find(x => x.id === id);
  if(!c) return;
  if(c.locked){ openCheckout(c); return; }
  if(currentCourse?.id !== c.id){ openModules = new Set([0]); currentLesson = null; }
  currentCourse = c;
  if(resume){ const n = nextLesson(c); if(n){ currentLesson = {mi: n.mi, li: n.li}; openModules.add(n.mi); } }
  renderCourseDetail();
  showPage('coursePage');
  if(resume && currentLesson) requestAnimationFrame(() => $('#lessonArea')?.scrollIntoView({behavior: 'smooth', block: 'start'}));
}
function openCheckout(c){
  $('#lockedCourseName').textContent = c.name;
  const btn = $('#simulatePay');
  btn.dataset.checkout = safeUrl(c.checkoutUrl);
  btn.textContent = c.checkoutUrl ? 'Ir para compra' : 'Checkout em configuração';
  $('#paymentFeedback').textContent = c.checkoutUrl ? 'Você será direcionado ao checkout oficial.' : '';
  $('#paymentModal').classList.remove('hidden');
}
function renderCourseDetail(){
  const c = currentCourse;
  const lessonHTML = currentLesson ? lessonViewHTML(c, currentLesson.mi, currentLesson.li) : '';
  const modules = c.modules.map((m, mi) => {
    const done = m.lessons.filter((_, li) => state.completed.includes(lessonKey(c, mi, li))).length;
    return `<div class="module${openModules.has(mi) ? ' open' : ''}">
      <button class="module-head" data-module="${mi}" aria-expanded="${openModules.has(mi)}">
        <span class="module-num">${pad(mi + 1)}</span>
        <span><h3>${safe(m.name)}</h3><small>${m.lessons.length} ${m.lessons.length === 1 ? 'aula' : 'aulas'} · ${done} concluída${done === 1 ? '' : 's'}</small></span>
        ${icon('chevron-down', 'caret')}
      </button>
      <div class="module-lessons">${m.lessons.map((l, li) => {
        const key = lessonKey(c, mi, li), isDone = state.completed.includes(key);
        const isCur = currentLesson && currentLesson.mi === mi && currentLesson.li === li;
        return `<button class="lesson${isDone ? ' done' : ''}${isCur ? ' current' : ''}" data-lesson="${mi}-${li}">
          <span class="lesson-icon">${icon(isDone ? 'check' : typeIcon(l.type))}</span>
          <span class="lesson-info"><b>${safe(l.title)}</b><small>${typeLabel(l.type)}${isDone ? ' · Concluída' : ''}</small></span>
          ${icon('chevron-right', 'lesson-go')}
        </button>`;
      }).join('') || '<p class="module-empty">As aulas deste módulo serão adicionadas em breve.</p>'}</div>
    </div>`;
  }).join('');
  $('#courseDetail').innerHTML = `
    <div class="hero course-hero">${heroHTML(c, {detail: true})}</div>
    <div id="lessonArea">${lessonHTML}</div>
    <div class="row-head"><h2>Módulos</h2><span class="muted">${c.modules.length} ${c.modules.length === 1 ? 'módulo' : 'módulos'}</span></div>
    <div class="module-list">${modules || '<div class="panel-note">Este curso ainda não possui módulos. Use a Área Master para adicionar conteúdo.</div>'}</div>`;
}
function lessonViewHTML(c, mi, li){
  const l = c.modules[mi]?.lessons[li];
  if(!l) return '';
  const key = lessonKey(c, mi, li), isDone = state.completed.includes(key);
  let media = '';
  const url = safeUrl(l.url);
  if(l.type === 'video' && url){
    let u = url;
    const yt = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
    const vm = u.match(/vimeo\.com\/(\d+)/);
    if(yt) u = 'https://www.youtube.com/embed/' + yt[1];
    else if(vm) u = 'https://player.vimeo.com/video/' + vm[1];
    media = `<div class="player"><iframe src="${safe(u)}" allowfullscreen loading="lazy" title="${safe(l.title)}" allow="autoplay; fullscreen; picture-in-picture"></iframe></div>`;
  }
  const all = lessonsOf(c);
  const idx = all.findIndex(x => x.mi === mi && x.li === li);
  const next = all[idx + 1];
  return `<div class="lesson-view">
    ${media}
    <span class="pill">${icon(typeIcon(l.type))} ${typeLabel(l.type)} · Módulo ${pad(mi + 1)}</span>
    <h3 style="margin-top:12px">${safe(l.title)}</h3>
    <p>${safe(l.body || 'Adicione uma descrição para esta aula pela Área Master.')}</p>
    <div class="lesson-actions">
      ${l.type === 'pdf' && url ? `<a class="btn btn-ghost" href="${safe(url)}" target="_blank" rel="noopener">${icon('external')} Abrir material</a>` : ''}
      <button class="btn ${isDone ? 'btn-ghost' : 'btn-primary'}" id="markComplete">${icon('check')} ${isDone ? 'Aula concluída' : 'Marcar como concluída'}</button>
      ${next ? `<button class="btn btn-ghost" id="nextLesson" data-next="${next.mi}-${next.li}">Próxima aula ${icon('chevron-right')}</button>` : ''}
    </div>
  </div>`;
}
function showLesson(mi, li){
  currentLesson = {mi, li};
  openModules.add(mi);
  renderCourseDetail();
  $('#lessonArea').scrollIntoView({behavior: 'smooth', block: 'start'});
}

/* ---------------- Eventos (delegação) ---------------- */
document.addEventListener('click', e => {
  const t = e.target.closest('button, a');
  if(!t) {
    if(!e.target.closest('.user-menu')) closeUserMenu();
    return;
  }
  if(!t.closest('.user-menu')) closeUserMenu();

  if(t.dataset.continue){ openCourse(t.dataset.continue, {resume: true}); return; }
  if(t.dataset.course){ openCourse(t.dataset.course); return; }
  if(t.dataset.hero){ heroIndex += Number(t.dataset.hero); renderHero(); return; }
  if(t.dataset.heroGo){ heroIndex = Number(t.dataset.heroGo); renderHero(); return; }
  if(t.dataset.gotoFilter){ goFilter(t.dataset.gotoFilter); return; }
  if(t.dataset.filter){ goFilter(t.dataset.filter); return; }
  if(t.dataset.view){ goView(t.dataset.view); return; }
  if(t.dataset.module){
    const mi = Number(t.dataset.module);
    openModules.has(mi) ? openModules.delete(mi) : openModules.add(mi);
    t.closest('.module').classList.toggle('open');
    t.setAttribute('aria-expanded', openModules.has(mi));
    return;
  }
  if(t.dataset.lesson){ const [mi, li] = t.dataset.lesson.split('-').map(Number); showLesson(mi, li); return; }
  if(t.id === 'nextLesson'){ const [mi, li] = t.dataset.next.split('-').map(Number); showLesson(mi, li); return; }
  if(t.id === 'markComplete' && currentCourse && currentLesson){
    const key = lessonKey(currentCourse, currentLesson.mi, currentLesson.li);
    if(!state.completed.includes(key)){ state.completed.push(key); save(); toast('Aula marcada como concluída!'); }
    renderCourseDetail();
    return;
  }
  if(t.dataset.close){ $('#' + t.dataset.close).classList.add('hidden'); return; }
  if(t.dataset.action === 'profile'){ openProfile(); return; }
  if(t.dataset.action === 'logout'){ logout(); return; }
});

$('#coursesNav').addEventListener('click', () => { courseFilter = 'all'; });
$('#backCourses').addEventListener('click', () => goView('courses'));
$('#mobileMenu').addEventListener('click', () => { $('#sidebar').classList.add('open'); $('#sidebarScrim').classList.add('show'); });
$('#sidebarScrim').addEventListener('click', closeSidebar);
$('#notifyButton').addEventListener('click', () => toast('Você não tem novas notificações.'));
$('#userChip').addEventListener('click', () => {
  const dd = $('#userDropdown'); const open = dd.classList.toggle('hidden') === false;
  $('#userChip').setAttribute('aria-expanded', open);
});
function closeUserMenu(){ $('#userDropdown').classList.add('hidden'); $('#userChip').setAttribute('aria-expanded', 'false'); }
$('#profileButton').addEventListener('click', openProfile);
$('#logoutButton').addEventListener('click', logout);
function openProfile(){
  const name = state.user?.name || 'Aluno';
  $('#profileName').textContent = name;
  $('#profileInitial').textContent = name.charAt(0).toUpperCase();
  $('#profilePhone').textContent = state.user?.phone ? state.user.phone : 'Membro ELITE';
  $('#profileModal').classList.remove('hidden');
  closeSidebar();
}
function logout(){
  state.user = null; save();
  $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden');
  $('#memberPassword').value = '';
}

/* Busca */
$('#searchInput').addEventListener('input', e => {
  searchTerm = e.target.value.trim().toLocaleLowerCase('pt-BR');
  if(searchTerm && $('#coursesPage').classList.contains('hidden')){ courseFilter = 'all'; renderCourses(); showPage('coursesPage'); $('#searchInput').focus(); }
  else renderCourses();
});

/* Modais: fechar clicando fora ou com Esc */
$$('.modal-backdrop').forEach(m => m.addEventListener('click', e => { if(e.target === m) m.classList.add('hidden'); }));
document.addEventListener('keydown', e => { if(e.key === 'Escape'){ $$('.modal-backdrop').forEach(m => m.classList.add('hidden')); closeUserMenu(); closeSidebar(); } });

/* ---------------- Login ---------------- */
function showApp(){
  $('#loginView').classList.add('hidden');
  $('#appView').classList.remove('hidden');
  const name = state.user?.name || 'Aluno';
  $('#userName').textContent = name.split(' ')[0];
  $('#userInitial').textContent = name.charAt(0).toUpperCase();
  heroIndex = 0;
  renderAll();
  showPage('homePage');
  const target = new URLSearchParams(location.search).get('curso');
  if(target) openCourse(target);
}
$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#memberName').value.trim(), pass = $('#memberPassword').value.trim();
  if(!name){ $('#loginError').textContent = 'Digite seu nome para continuar.'; $('#memberName').focus(); return; }
  if(pass !== DEMO_PASSWORD){ $('#loginError').textContent = 'Senha incorreta.'; $('#memberPassword').focus(); return; }
  state.user = {name, phone: $('#memberPhone').value.trim()};
  $('#loginError').textContent = '';
  save(); showApp();
});

/* ---------------- Área Master ---------------- */
function openMasterLogin(){
  $('#masterPassword').value = ''; $('#masterLoginError').textContent = '';
  $('#masterLoginModal').classList.remove('hidden'); $('#masterPassword').focus(); closeSidebar();
}
$('#adminTrigger').addEventListener('click', openMasterLogin);
$('#masterNav').addEventListener('click', openMasterLogin);
function enterMaster(){
  if($('#masterPassword').value !== DEMO_PASSWORD){ $('#masterLoginError').textContent = 'Senha incorreta.'; return; }
  $('#masterLoginModal').classList.add('hidden');
  populateAdminCourses(); renderAdminManager();
  $('#adminModal').classList.remove('hidden');
}
$('#masterLoginButton').addEventListener('click', enterMaster);
$('#masterPassword').addEventListener('keydown', e => { if(e.key === 'Enter') enterMaster(); });
$$('.admin-tabs button').forEach(b => b.addEventListener('click', () => {
  $$('.admin-tabs button').forEach(x => x.classList.toggle('active', x === b));
  $$('.admin-tab').forEach(x => x.classList.add('hidden'));
  $('#' + b.dataset.tab).classList.remove('hidden');
}));
function populateAdminCourses(){ $('#adminCourse').innerHTML = state.courses.map(c => `<option value="${safe(c.id)}">${safe(c.name)}</option>`).join(''); }
function renderAdminManager(){
  const host = $('#adminCourseManager'); if(!host) return;
  host.innerHTML = state.courses.map(c => `<article class="admin-course-row"><div><b>${safe(c.name)}</b><small>${c.modules.length} módulos · ${lessonsOf(c).length} aulas · ${c.locked ? 'Bloqueado' : 'Liberado'}</small></div><div class="admin-course-actions"><button data-toggle-course="${safe(c.id)}">${c.locked ? 'Liberar' : 'Bloquear'}</button><button data-copy-course="${safe(c.id)}">Copiar link</button></div></article>`).join('');
  $$('[data-toggle-course]', host).forEach(b => b.addEventListener('click', () => {
    const c = state.courses.find(x => x.id === b.dataset.toggleCourse); c.locked = !c.locked;
    save(); renderAdminManager(); renderAll(); toast(c.locked ? 'Curso bloqueado.' : 'Curso liberado.');
  }));
  $$('[data-copy-course]', host).forEach(b => b.addEventListener('click', () => {
    const url = location.origin + location.pathname + '?curso=' + encodeURIComponent(b.dataset.copyCourse);
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast('Link do curso copiado!')).catch(() => toast(url));
  }));
}
$('#addContent').addEventListener('click', () => {
  const c = state.courses.find(x => x.id === $('#adminCourse').value);
  const module = $('#adminModule').value.trim(), title = $('#adminTitle2').value.trim(), type = $('#adminType').value, url = $('#adminUrl').value.trim(), body = $('#adminBody').value.trim();
  if(!c || !title){ toast('Informe pelo menos o título da aula.'); return; }
  const mName = module || 'Módulo 01 — Conteúdos';
  let m = c.modules.find(x => x.name === mName);
  if(!m){ m = {name: mName, lessons: []}; c.modules.push(m); }
  m.lessons.push({title, type, url, body});
  save();
  $('#adminTitle2').value = $('#adminUrl').value = $('#adminBody').value = $('#adminModule').value = '';
  renderAll(); renderAdminManager(); toast('Conteúdo adicionado ao curso!');
});
$('#addCourse').addEventListener('click', () => {
  const name = $('#newCourseName').value.trim(); if(!name){ toast('Digite o nome do curso.'); return; }
  const c = {
    id: 'curso-' + Date.now(), name,
    desc: $('#newCourseDesc').value.trim() || 'Novo treinamento exclusivo da plataforma.',
    color: $('#newCourseColor').value, tag: 'NOVO TREINAMENTO',
    code: name.split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase(),
    locked: $('#newCourseLocked').checked, checkoutUrl: $('#newCourseCheckout').value.trim(), coverUrl: $('#newCourseCover').value.trim(),
    progress: 0, modules: []
  };
  state.courses.push(c); save();
  populateAdminCourses(); renderAdminManager(); renderAll();
  $('#newCourseName').value = $('#newCourseDesc').value = $('#newCourseCover').value = $('#newCourseCheckout').value = '';
  toast('Novo curso criado!');
});
$('#simulatePay').addEventListener('click', () => {
  const url = $('#simulatePay').dataset.checkout;
  if(url){ window.open(url, '_blank', 'noopener'); return; }
  $('#paymentFeedback').textContent = 'Este curso ainda não tem checkout cadastrado. Fale com o administrador.';
});

if(state.user) showApp();
