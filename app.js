/* ==================================================================
   ELITE Academy — protótipo da área de membros
   Tudo roda no navegador (localStorage). Rotas por hash: #/inicio,
   #/cursos, #/curso/ID, #/aula/ID/M/A, #/oferta/ID, #/biblioteca,
   #/evolucao, #/perfil
   ================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const STORE_KEY = 'eliteAcademyDemoV1';
const DEMO_PASSWORD = '1989';
const LEVELS = [
  {name: 'Membro', min: 0},
  {name: 'Elite', min: 5},
  {name: 'Master', min: 15}
];

const initialCourses = [
 {id:'metodo-lp',name:'Método LP',desc:'Aprenda a estruturar sua presença digital e transformar atenção em oportunidades.',color:'green',tag:'MÉTODO EXCLUSIVO',code:'LP',locked:false,
  learn:['Estruturar sua presença digital do zero','Criar uma oferta clara e atraente','Produzir conteúdo que gera conexão','Executar um plano de ação de 7 dias'],
  modules:[
  {name:'Módulo 01 — Fundamentos',lessons:[
   {title:'Boas-vindas ao Método LP',type:'video',min:8,url:'https://www.youtube.com/watch?v=ysz5S6PUM-U',body:'Uma visão geral da jornada, dos objetivos e de como aproveitar melhor o treinamento.'},
   {title:'Mentalidade e preparação',type:'text',min:6,body:'Antes de executar, defina seu objetivo, conheça seu público e organize uma rotina simples de aplicação. Anote suas metas e acompanhe sua evolução.'},
   {title:'Checklist de início rápido',type:'pdf',min:5,url:'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',body:'Material demonstrativo para organizar os primeiros passos.'}
  ]},
  {name:'Módulo 02 — Estratégia',lessons:[
   {title:'Construindo uma oferta clara',type:'video',min:14,url:'https://www.youtube.com/watch?v=jfKfPfyJRdk',body:'Aprenda a apresentar valor de forma simples e objetiva.'},
   {title:'Conteúdo que gera conexão',type:'text',min:7,body:'Crie conteúdos que respondam dúvidas reais, demonstrem benefícios e conduzam o público para o próximo passo.'}
  ]},
  {name:'Módulo 03 — Aplicação prática',lessons:[
   {title:'Plano de ação de 7 dias',type:'text',min:10,body:'Dia 1: planejar.\nDias 2 e 3: produzir.\nDias 4 e 5: publicar e conversar.\nDias 6 e 7: analisar e ajustar.'}
  ]}
 ]},
 {id:'digital-scale',name:'Digital Scale Pro',desc:'Processos e estratégias para organizar e escalar negócios no digital.',color:'purple',tag:'ESCALA & PERFORMANCE',code:'DS',locked:false,
  learn:['Mapear os pilares da sua operação','Organizar processos e responsáveis','Acompanhar os indicadores que importam'],
  modules:[
  {name:'Módulo 01 — Estrutura',lessons:[{title:'O mapa da escala digital',type:'video',min:12,url:'https://www.youtube.com/watch?v=ysz5S6PUM-U',body:'Conheça os pilares de uma operação digital organizada.'},{title:'Organização de processos',type:'text',min:6,body:'Documente tarefas recorrentes, defina responsáveis e acompanhe indicadores simples.'}]},
  {name:'Módulo 02 — Crescimento',lessons:[{title:'Indicadores essenciais',type:'text',min:8,body:'Acompanhe aquisição, conversão, retenção e satisfação para decidir com clareza.'}]}
 ]},
 {id:'design-magnetico',name:'Design Magnético',desc:'Design, identidade visual e criativos que valorizam sua marca.',color:'blue',tag:'CRIATIVIDADE & MARCA',code:'DM',locked:false,
  learn:['Princípios de hierarquia e contraste','Montar um guia de identidade simples','Criar criativos para redes sociais'],
  modules:[
  {name:'Módulo 01 — Direção visual',lessons:[{title:'Princípios de um visual forte',type:'video',min:11,url:'https://www.youtube.com/watch?v=ysz5S6PUM-U',body:'Explore hierarquia, contraste, consistência e clareza visual.'},{title:'Guia de identidade',type:'pdf',min:4,url:'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',body:'Guia demonstrativo de identidade visual.'}]},
  {name:'Módulo 02 — Criativos',lessons:[{title:'Composição para redes sociais',type:'text',min:7,body:'Comece por uma mensagem principal, use poucos elementos e mantenha contraste suficiente para leitura.'}]}
 ]},
 {id:'trafego-elite',name:'Tráfego Elite',desc:'Fundamentos de campanhas, públicos e análise de resultados.',color:'orange',tag:'ACESSO PREMIUM',code:'TE',locked:true,
  learn:['Estruturar campanhas do zero','Definir e testar públicos','Ler os números e otimizar resultados'],modules:[]},
 {id:'copy-pro',name:'Copywriting Pro',desc:'Escrita persuasiva, ofertas e comunicação que conecta.',color:'purple',tag:'ACESSO PREMIUM',code:'CP',locked:true,
  learn:['Escrever títulos que prendem a atenção','Estruturar páginas e mensagens de venda','Adaptar a comunicação a cada canal'],modules:[]},
 {id:'automacao',name:'Automação Inteligente',desc:'Ganhe tempo com fluxos e processos digitais.',color:'green',tag:'ACESSO PREMIUM',code:'AI',locked:true,
  learn:['Identificar tarefas que podem ser automatizadas','Montar fluxos simples de atendimento','Integrar ferramentas do dia a dia'],modules:[]}
];

/* ------------------------------------------------------------------
   Estado
   ------------------------------------------------------------------ */
let state = loadState();
let filter = 'all';
let searchTerm = '';
let season = {};            // módulo aberto por curso
let lessonTab = 'about';
let autoNextTimer = null;

function clone(x){ return JSON.parse(JSON.stringify(x)); }
function loadState(){
  let s = null;
  try { s = JSON.parse(localStorage.getItem(STORE_KEY)); } catch(e) {}
  if(!s || !Array.isArray(s.courses)) s = {courses: clone(initialCourses), completed: [], user: null};
  s.completed ||= []; s.days ||= []; s.notes ||= {}; s.questions ||= {};
  // completa dados novos (duração, "o que vai aprender") em cursos de exemplo já salvos
  s.courses.forEach(c => {
    const base = initialCourses.find(b => b.id === c.id);
    if(!base) return;
    if(!c.learn) c.learn = base.learn;
    c.modules.forEach((m, mi) => m.lessons.forEach((l, li) => {
      const bl = base.modules[mi]?.lessons[li];
      if(bl && bl.title === l.title && l.min == null) l.min = bl.min;
    }));
  });
  return s;
}
function save(){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); return true; }
  catch(e){ console.warn('Não foi possível salvar neste navegador:', e); return false; }
}

/* ------------------------------------------------------------------
   Utilitários
   ------------------------------------------------------------------ */
function esc(s = ''){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function ic(name, cls = ''){ return `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`; }
function pad(n){ return String(n).padStart(2, '0'); }
function cap(t = ''){ const s = String(t).toLocaleLowerCase('pt-BR'); return s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1); }
function firstName(){ return (state.user?.name || 'Aluno').trim().split(/\s+/)[0]; }
function toast(msg){ const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2600); }
function safeUrl(u){
  u = String(u || '').trim();
  if(!/^(https?:\/\/|assets\/)/i.test(u)) return '';
  return u.replace(/["'()\\\s<>]/g, encodeURIComponent);
}
function fmtMin(m){
  m = Math.round(m || 0); if(!m) return '';
  if(m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${pad(r)}min` : `${h}h`;
}
function todayISO(d = new Date()){ return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
function plural(n, one, many){ return `${n} ${n === 1 ? one : many}`; }
function typeLabel(t){ return t === 'video' ? 'Videoaula' : t === 'pdf' ? 'Material PDF' : 'Aula em texto'; }
function typeIcon(t){ return t === 'video' ? 'play' : t === 'pdf' ? 'file' : 'text'; }
function embedUrl(url){
  const u = safeUrl(url); if(!u) return '';
  const yt = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/);
  if(yt) return 'https://www.youtube-nocookie.com/embed/' + yt[1] + '?rel=0&modestbranding=1&playsinline=1';
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if(vm) return 'https://player.vimeo.com/video/' + vm[1];
  return u;
}

function ytId(url){ const m = String(url || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/); return m ? m[1] : ''; }
function ytThumb(url){ const id = ytId(url); return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ''; }
function isVideoUrl(url){ return !!(ytId(url) || /vimeo\.com\/(?:video\/)?\d+/.test(String(url || ''))); }
// botões de uma aula: arquivos e sites cadastrados no Master (+ PDF das aulas antigas)
function resources(l){
  const out = (l.links || []).filter(x => safeUrl(x.url)).map(x => ({kind: x.kind === 'site' ? 'site' : 'file', label: x.label || (x.kind === 'site' ? 'Acessar site' : 'Baixar arquivo'), url: x.url}));
  if(l.type === 'pdf' && safeUrl(l.url)) out.unshift({kind: 'file', label: 'Abrir material', url: l.url});
  return out;
}
function hostOf(u){ try { return new URL(u).hostname.replace(/^www\./, ''); } catch(e){ return ''; } }
function resButtons(list, cls = ''){
  if(!list.length) return '';
  return `<div class="res-buttons ${cls}">${list.map(r => `<a class="res-btn res-${r.kind}" href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener">
    <span class="res-ic">${ic(r.kind === 'site' ? 'globe' : 'download')}</span>
    <span class="res-txt"><b>${esc(r.label)}</b><small>${r.kind === 'site' ? esc(hostOf(r.url) || 'Abrir site') : 'Arquivo'}</small></span>
    ${ic('external', 'res-go')}</a>`).join('')}</div>`;
}
function lessonArt(c, l){ const t = l && l.type === 'video' ? ytThumb(l.url) : ''; return t ? `<div class="art" style="background-image:url('${t}')"></div>` : art(c); }

/* ------------------------------------------------------------------
   Regras: progresso, sequência, nível
   ------------------------------------------------------------------ */
const key = (c, mi, li) => `${c.id}-${mi}-${li}`;
const findCourse = id => state.courses.find(c => c.id === id);
const openCourses = () => state.courses.filter(c => !c.locked);
const lockedCourses = () => state.courses.filter(c => c.locked);
function lessonsOf(c){ const o = []; c.modules.forEach((m, mi) => m.lessons.forEach((l, li) => o.push({c, m, mi, li, l, k: key(c, mi, li)}))); return o; }
const isDone = k => state.completed.includes(k);
function stats(c){
  const all = lessonsOf(c), done = all.filter(x => isDone(x.k));
  const total = all.length, mins = all.reduce((a, x) => a + (x.l.min || 0), 0);
  const left = all.filter(x => !isDone(x.k)).reduce((a, x) => a + (x.l.min || 0), 0);
  return {total, done: done.length, pct: total ? Math.round(done.length / total * 100) : 0, mins, left};
}
function nextOf(c){ const all = lessonsOf(c); return all.find(x => !isDone(x.k)) || all[0] || null; }
function resumeTarget(){
  // curso com aula concluída mais recente que ainda não acabou; senão o primeiro liberado com aulas
  const last = [...state.completed].reverse().map(k => openCourses().find(c => k.startsWith(c.id + '-'))).find(c => c && stats(c).pct < 100);
  const c = last || openCourses().find(c => stats(c).total && stats(c).pct < 100) || openCourses().find(c => stats(c).total);
  return c ? {c, n: nextOf(c)} : null;
}
function markStudy(){ const t = todayISO(); if(!state.days.includes(t)){ state.days.push(t); state.days = state.days.slice(-120); save(); } }
function streak(){
  const set = new Set(state.days); let d = new Date(), n = 0;
  if(!set.has(todayISO(d))) d.setDate(d.getDate() - 1);
  while(set.has(todayISO(d))){ n++; d.setDate(d.getDate() - 1); }
  return n;
}
function totals(){
  return openCourses().reduce((a, c) => { const s = stats(c); a.total += s.total; a.done += s.done; if(s.total && s.pct === 100) a.finished.push(c); return a; }, {total: 0, done: 0, finished: []});
}
function level(){
  const d = state.completed.length;
  let i = 0; LEVELS.forEach((l, idx) => { if(d >= l.min) i = idx; });
  const cur = LEVELS[i], nxt = LEVELS[i + 1];
  const pct = nxt ? Math.round((d - cur.min) / (nxt.min - cur.min) * 100) : 100;
  return {i, cur, nxt, pct, toNext: nxt ? nxt.min - d : 0};
}
function greeting(){ const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }

/* ------------------------------------------------------------------
   Peças visuais reaproveitadas
   ------------------------------------------------------------------ */
function art(c){
  const u = safeUrl(c.coverUrl);
  if(u) return `<div class="art" style="background-image:url('${u}')"></div>`;
  return `<div class="art art-gen g-${esc(c.color || 'green')}"><span class="art-code">${esc(c.code || '')}</span></div>`;
}
function poster(c){
  const s = stats(c);
  const label = c.locked ? 'PARA DESBLOQUEAR' : s.pct === 100 ? 'CONCLUÍDO' : s.done ? 'EM ANDAMENTO' : 'ELITE ORIGINAL';
  const href = c.locked ? `#/oferta/${encodeURIComponent(c.id)}` : `#/curso/${encodeURIComponent(c.id)}`;
  const sub = c.locked ? `<span>${esc(cap(c.tag))}</span><b>Ver detalhes</b>`
    : s.total ? `<span>${plural(c.modules.length, 'módulo', 'módulos')} · ${plural(s.total, 'aula', 'aulas')}</span><b>${s.pct}%</b>` : '<span>Conteúdo em breve</span>';
  return `<a class="poster${c.locked ? ' locked' : ''}" href="${href}" aria-label="${esc(c.name)}">
    <div class="poster-art">${art(c)}
      <div class="poster-top"><span class="poster-label">${label}</span>${c.locked ? `<span class="poster-lock">${ic('lock')}</span>` : ''}</div>
      <h3 class="poster-title">${esc(c.name)}</h3>
      ${!c.locked ? `<div class="poster-bar"><div class="bar"><i style="width:${s.pct}%"></i></div></div>` : ''}
    </div>
    <div class="poster-sub">${sub}</div>
  </a>`;
}
function priceHTML(c, big = false){
  if(!c.price) return big ? '<div class="price price-text">Valor sob consulta</div>' : '<span></span>';
  const [r, cts = '00'] = String(c.price).replace(/[^\d,]/g, '').split(',');
  return big ? `<div class="price"><small>R$</small> ${esc(r)}<small>,${esc(cts.padEnd(2, '0').slice(0, 2))}</small></div>` : `<span class="offer-price">R$ ${esc(r)},${esc(cts.padEnd(2, '0').slice(0, 2))}</span>`;
}
function offer(c){
  return `<a class="offer" href="#/oferta/${encodeURIComponent(c.id)}">${art(c)}
    <span class="chip chip-glass">${ic('lock')} ${esc(cap(c.tag))}</span>
    <h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p>
    <div class="offer-foot">${priceHTML(c)}<span class="offer-cta">Desbloquear ${ic('arrow-right')}</span></div>
  </a>`;
}
function cpItem(c){
  const s = stats(c), n = nextOf(c);
  return `<a class="cp-item" href="#/curso/${encodeURIComponent(c.id)}">
    <span class="cp-thumb">${art(c)}</span>
    <span><b>${esc(c.name)}</b><span class="bar"><i style="width:${s.pct}%"></i></span>
      <small class="muted" style="display:block;margin-top:6px;font-size:13px">${s.total ? `${s.done} de ${s.total} aulas${s.pct < 100 && n ? ' · próxima: ' + esc(n.l.title) : ''}` : 'Conteúdo em breve'}</small></span>
    <span class="cp-pct">${s.pct}%</span>
  </a>`;
}
function levelCard(){
  const L = level();
  return `<div class="level-card">
    <div class="level-badge">${ic(L.i === 2 ? 'star' : 'award')}</div>
    <div>
      <span class="kicker">Seu nível</span>
      <h3>${L.cur.name}</h3>
      <p>${L.nxt ? `Faltam ${plural(L.toNext, 'aula', 'aulas')} para chegar ao nível ${L.nxt.name}.` : 'Você chegou ao nível máximo. Continue evoluindo.'}</p>
      <div class="bar"><i style="width:${L.pct}%"></i></div>
      <div class="level-steps">${LEVELS.map((l, i) => `<span class="${i <= L.i ? 'on' : ''}">${l.name.toUpperCase()}</span>`).join('')}</div>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------
   Páginas
   ------------------------------------------------------------------ */
function pageHome(){
  const t = totals(), r = resumeTarget(), st = streak(), L = level();
  const avg = t.total ? Math.round(t.done / t.total * 100) : 0;
  let resume = '';
  if(r && r.n){
    const s = stats(r.c);
    const href = `#/aula/${encodeURIComponent(r.c.id)}/${r.n.mi}/${r.n.li}`;
    const started = s.done > 0;
    resume = `<section class="resume">
      <a class="resume-media" href="${href}" aria-label="Assistir ${esc(r.n.l.title)}">${lessonArt(r.c, r.n.l)}
        <div class="resume-tag"><span class="chip chip-glass">${ic(typeIcon(r.n.l.type))} ${typeLabel(r.n.l.type)}</span>${r.n.l.min ? `<span class="chip chip-glass">${ic('clock')} ${fmtMin(r.n.l.min)}</span>` : ''}</div>
        <span class="resume-play">${ic('play', 'ic-fill')}</span>
      </a>
      <div class="resume-body">
        <span class="kicker">${started ? 'Continue de onde parou' : 'Comece por aqui'}</span>
        <div class="resume-course">${esc(r.c.name)} · ${esc(r.n.m.name)}</div>
        <h2 class="display resume-title">${esc(r.n.l.title)}</h2>
        <div class="resume-meta">
          <span>${ic('layers')} Aula ${lessonsOf(r.c).findIndex(x => x.k === r.n.k) + 1} de ${s.total}</span>
          ${s.left ? `<span>${ic('clock')} Faltam ${fmtMin(s.left)} para concluir</span>` : ''}
        </div>
        <div class="resume-progress"><div class="row"><span>Progresso do curso</span><b>${s.pct}%</b></div><div class="bar"><i style="width:${s.pct}%"></i></div></div>
        <div class="resume-actions">
          <a class="btn btn-primary btn-lg" href="${href}">${ic('play', 'ic-fill')} ${started ? 'Continuar' : 'Começar agora'}</a>
          <a class="btn btn-ghost btn-lg" href="#/curso/${encodeURIComponent(r.c.id)}">Ver curso</a>
        </div>
      </div>
    </section>`;
  }
  const open = openCourses(), locked = lockedCourses();
  return `
    <section class="greet">
      <div>
        <h1 class="display greet-title">${greeting()}, <span>${esc(firstName())}.</span></h1>
        <p>${t.done ? 'Bom te ver de volta. Mais uma aula hoje e você mantém o ritmo.' : 'Sua jornada começa hoje. Escolha a primeira aula e dê o primeiro passo.'}</p>
      </div>
      <div class="greet-badges">
        <span class="chip chip-accent">${ic('award')} Nível ${L.cur.name}</span>
        <span class="chip">${ic('flame')} ${st ? plural(st, 'dia seguido', 'dias seguidos') : 'Comece sua sequência'}</span>
      </div>
    </section>
    ${resume}
    <section class="stats">
      <div class="stat hl"><b>${avg}<small>%</small></b><span>Progresso geral</span></div>
      <div class="stat"><b>${t.done}<small>/${t.total}</small></b><span>Aulas concluídas</span></div>
      <div class="stat"><b>${st}</b><span>${st === 1 ? 'Dia seguido' : 'Dias seguidos'} estudando</span></div>
      <div class="stat"><b>${t.finished.length}</b><span>${t.finished.length === 1 ? 'Certificado' : 'Certificados'}</span></div>
    </section>
    <section class="sec">
      <div class="sec-head"><div><h2>Seus cursos</h2><p>${plural(open.length, 'treinamento liberado', 'treinamentos liberados')}</p></div><a class="link-more" href="#/cursos">Ver todos ${ic('chevron-right')}</a></div>
      ${open.length ? `<div class="posters">${open.map(poster).join('')}</div>` : '<div class="empty">Nenhum curso liberado ainda.</div>'}
    </section>
    ${locked.length ? `<section class="sec">
      <div class="sec-head"><div><h2>Para ir além</h2><p>Treinamentos que você ainda pode desbloquear</p></div><a class="link-more" href="#/cursos" data-filter-go="locked">Ver todos ${ic('chevron-right')}</a></div>
      <div class="offers">${locked.slice(0, 3).map(offer).join('')}</div>
    </section>` : ''}
    <section class="sec">${levelCard()}</section>`;
}

function filtered(){
  return state.courses.filter(c => {
    const s = stats(c);
    if(filter === 'locked' && !c.locked) return false;
    if(filter === 'progress' && (c.locked || s.pct === 100)) return false;
    if(filter === 'done' && (c.locked || !s.total || s.pct < 100)) return false;
    if(searchTerm){
      const hay = [c.name, c.desc, c.tag, ...lessonsOf(c).map(x => x.l.title)].join(' ').toLocaleLowerCase('pt-BR');
      if(!hay.includes(searchTerm)) return false;
    }
    return true;
  });
}
function coursesGrid(){
  const list = filtered();
  return list.length ? `<div class="poster-grid">${list.map(poster).join('')}</div>`
    : `<div class="empty">${searchTerm ? `Nada encontrado para “${esc(searchTerm)}”.` : 'Nenhum curso nesta categoria ainda.'}</div>`;
}
function pageCourses(){
  const F = [['all', 'Todos'], ['progress', 'Em andamento'], ['done', 'Concluídos'], ['locked', 'Para desbloquear']];
  return `
    <section class="page-title">
      <div><h1 class="display">Cursos</h1><p>${plural(state.courses.length, 'treinamento', 'treinamentos')} na plataforma</p></div>
      <div class="filters" role="tablist">${F.map(([v, l]) => `<button class="filter${filter === v ? ' active' : ''}" data-filter="${v}">${l}</button>`).join('')}</div>
    </section>
    ${searchTerm ? `<p class="muted" style="margin:-8px 0 20px">Resultados para “${esc(searchTerm)}” · <button class="link-more" data-act="clear-search" style="min-height:auto">Limpar busca</button></p>` : ''}
    <div id="courseGrid">${coursesGrid()}</div>`;
}

function pageCourse(c){
  const s = stats(c), n = nextOf(c);
  const sel = Math.min(season[c.id] ?? (n ? n.mi : 0), Math.max(c.modules.length - 1, 0));
  const m = c.modules[sel];
  const cta = !n ? '' : `<a class="btn btn-primary btn-lg" href="#/aula/${encodeURIComponent(c.id)}/${n.mi}/${n.li}">${ic('play', 'ic-fill')} ${s.pct === 100 ? 'Assistir de novo' : s.done ? `Continuar: aula ${lessonsOf(c).findIndex(x => x.k === n.k) + 1}` : 'Começar curso'}</a>`;
  return `
    <a class="back" href="#/cursos">${ic('arrow-left')} Todos os cursos</a>
    <section class="series-hero">${art(c)}
      <div class="series-info">
        <span class="kicker">${esc(cap(c.tag))}</span>
        <h1 class="display series-title">${esc(c.name)}</h1>
        <p class="series-desc">${esc(c.desc)}</p>
        <div class="series-meta">
          <span class="chip chip-glass">${ic('layers')} ${plural(c.modules.length, 'módulo', 'módulos')}</span>
          <span class="chip chip-glass">${ic('courses')} ${plural(s.total, 'aula', 'aulas')}</span>
          ${s.mins ? `<span class="chip chip-glass">${ic('clock')} ${fmtMin(s.mins)}</span>` : ''}
        </div>
        ${s.total ? `<div class="series-progress"><div class="row"><span>${s.done} de ${s.total} aulas concluídas</span><b>${s.pct}%</b></div><div class="bar"><i style="width:${s.pct}%"></i></div></div>` : ''}
        <div class="series-actions">${cta}</div>
      </div>
    </section>
    ${s.total && s.pct === 100 ? `<div class="cert-banner"><div><b>Curso concluído</b><span>Parabéns! Seu certificado já está disponível.</span></div><button class="btn btn-primary" data-cert="${esc(c.id)}">${ic('award')} Ver certificado</button></div>` : ''}
    <section class="sec">
      ${c.modules.length ? `
        <div class="seasons" role="tablist">${c.modules.map((mm, i) => `<button class="season${i === sel ? ' active' : ''}" data-season="${i}" data-course-id="${esc(c.id)}">Módulo ${pad(i + 1)}</button>`).join('')}</div>
        <div class="season-head"><h3>${esc(m.name)}</h3><span>${plural(m.lessons.length, 'aula', 'aulas')}${m.lessons.some(l => l.min) ? ' · ' + fmtMin(m.lessons.reduce((a, l) => a + (l.min || 0), 0)) : ''}</span></div>
        <div class="episodes">${m.lessons.map((l, li) => {
          const k = key(c, sel, li), d = isDone(k);
          return `<a class="ep${d ? ' done' : ''}" href="#/aula/${encodeURIComponent(c.id)}/${sel}/${li}">
            <span class="ep-num">${pad(li + 1)}</span>
            <span class="ep-thumb">${lessonArt(c, l)}<span class="ep-thumb-ic"><span>${ic(typeIcon(l.type), l.type === 'video' ? 'ic-fill' : '')}</span></span>${d ? '<span class="bar"><i style="width:100%"></i></span>' : ''}</span>
            <span class="ep-body"><h4>${esc(l.title)}</h4><p>${esc(l.body || typeLabel(l.type))}</p></span>
            <span class="ep-side">${resources(l).length ? `<span class="chip">${ic('link')} ${resources(l).length}</span>` : ''}${l.min ? fmtMin(l.min) : typeLabel(l.type)}<span class="ep-check" aria-label="${d ? 'Concluída' : 'Não concluída'}">${d ? ic('check') : ''}</span></span>
          </a>`;
        }).join('') || '<div class="empty">As aulas deste módulo serão adicionadas em breve.</div>'}</div>`
      : '<div class="empty">Este curso ainda não tem módulos. Eles aparecerão aqui assim que forem publicados.</div>'}
    </section>`;
}

function pageLesson(c, mi, li){
  const m = c.modules[mi], l = m?.lessons[li];
  if(!l) return pageCourse(c);
  markStudy();
  const k = key(c, mi, li), d = isDone(k), s = stats(c);
  const all = lessonsOf(c), idx = all.findIndex(x => x.k === k);
  const prev = all[idx - 1], next = all[idx + 1];
  const emb = l.type === 'video' ? embedUrl(l.url) : '';
  const pdf = l.type === 'pdf' ? safeUrl(l.url) : '';
  const media = emb
    ? `<div class="player"><iframe src="${esc(emb)}" title="${esc(l.title)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen loading="lazy"></iframe></div>`
    : `<div class="player-alt">${art(c)}<span class="chip chip-glass">${ic(typeIcon(l.type))} ${typeLabel(l.type)}</span><p class="display">${esc(l.title)}</p><span class="muted">${resources(l).length ? 'Os materiais desta aula estão logo abaixo.' : 'Leia o conteúdo da aula logo abaixo.'}</span></div>`;
  const notes = state.notes[k] || '';
  const qs = state.questions[k] || [];
  const tabs = [['about', 'Sobre a aula', 'text'], ['materials', 'Materiais', 'file'], ['notes', 'Anotações', 'note'], ['qa', 'Dúvidas', 'chat']];
  const mats = all.filter(x => x.mi === mi).flatMap(x => resources(x.l).map(r => ({...r, lesson: x.l.title})));
  const panel = {
    about: `<p>${esc(l.body || 'Sem descrição para esta aula.')}</p>`,
    materials: mats.length ? `<div style="display:flex;flex-direction:column;gap:10px">${mats.map(x => `<div class="material"><span class="material-ic">${ic(x.kind === 'site' ? 'globe' : 'download')}</span><span><b>${esc(x.label)}</b><small>${esc(x.lesson)}</small></span><a class="btn btn-line" href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener">${ic('external')} Abrir</a></div>`).join('')}</div>` : '<p class="muted">Este módulo não tem materiais nem links.</p>',
    notes: `<div class="notes-box"><label for="noteText" style="margin-top:0">Suas anotações desta aula</label><textarea id="noteText" data-note="${esc(k)}" placeholder="Escreva os pontos principais, ideias e próximos passos...">${esc(notes)}</textarea><p class="notes-status" id="noteStatus">${notes ? 'Salvo neste aparelho.' : 'As anotações são salvas automaticamente.'}</p></div>`,
    qa: `<form class="qa-form" data-qa="${esc(k)}"><input id="qaInput" placeholder="Escreva sua dúvida sobre esta aula" aria-label="Sua dúvida"><button class="btn btn-primary" type="submit">Enviar</button></form>
      <div class="qa-list">${qs.length ? qs.slice().reverse().map(q => `<div class="qa"><small>Você · ${esc(new Date(q.at).toLocaleDateString('pt-BR'))}</small>${esc(q.text)}</div>`).join('') : '<p class="muted">Nenhuma dúvida enviada ainda. No protótipo, as dúvidas ficam salvas só para você.</p>'}</div>`
  };
  const playlist = c.modules.map((mm, a) => `<div class="pl-mod">Módulo ${pad(a + 1)} · ${esc(mm.name.replace(/^Módulo\s*\d+\s*[—-]\s*/i, ''))}</div>` + mm.lessons.map((ll, b) => {
    const kk = key(c, a, b), dd = isDone(kk), cur = a === mi && b === li;
    return `<a class="pl-item${dd ? ' done' : ''}${cur ? ' current' : ''}" href="#/aula/${encodeURIComponent(c.id)}/${a}/${b}" ${cur ? 'aria-current="true"' : ''}>
      <span class="pl-ic">${dd ? ic('check') : cur ? ic('play', 'ic-fill') : ic(typeIcon(ll.type))}</span>
      <span><b>${esc(ll.title)}</b><small>${typeLabel(ll.type)}${ll.min ? ' · ' + fmtMin(ll.min) : ''}</small></span></a>`;
  }).join('')).join('');
  return `
    <a class="back" href="#/curso/${encodeURIComponent(c.id)}">${ic('arrow-left')} ${esc(c.name)}</a>
    <div class="lesson-layout">
      <div>
        ${media}
        <div class="lesson-head">
          <div><div class="crumbs"><a href="#/curso/${encodeURIComponent(c.id)}">${esc(c.name)}</a> · ${esc(m.name)}</div><h1 class="display">${esc(l.title)}</h1></div>
          <div class="lesson-actions">
            ${prev ? `<a class="btn btn-ghost" href="#/aula/${encodeURIComponent(c.id)}/${prev.mi}/${prev.li}" aria-label="Aula anterior">${ic('chevron-left')}</a>` : ''}
            <button class="btn ${d ? 'done' : 'btn-primary'}" data-complete="${esc(k)}">${ic('check')} ${d ? 'Concluída' : 'Marcar como concluída'}</button>
            ${next ? `<a class="btn btn-ghost" href="#/aula/${encodeURIComponent(c.id)}/${next.mi}/${next.li}">Próxima ${ic('chevron-right')}</a>` : ''}
          </div>
        </div>
        ${resButtons(resources(l))}
        <div id="autoNext"></div>
        <div class="tabs" role="tablist">${tabs.map(([v, t, i]) => `<button class="${lessonTab === v ? 'active' : ''}" data-ltab="${v}" role="tab" aria-selected="${lessonTab === v}">${ic(i)} ${t}${v === 'qa' && qs.length ? ` (${qs.length})` : ''}</button>`).join('')}</div>
        <div class="tab-panel" id="lessonPanel">${panel[lessonTab] || panel.about}</div>
      </div>
      <aside class="playlist">
        <div class="playlist-head"><b>${esc(c.name)}</b><span>${s.done} de ${s.total} aulas · ${s.pct}%</span><div class="bar"><i style="width:${s.pct}%"></i></div></div>
        <div class="playlist-body">${playlist}</div>
      </aside>
    </div>`;
}

function pageOffer(c){
  const learn = (c.learn && c.learn.length ? c.learn : c.modules.map(m => m.name)).filter(Boolean);
  const emb = embedUrl(c.trailerUrl);
  const s = stats(c);
  return `
    <a class="back" href="#/cursos">${ic('arrow-left')} Todos os cursos</a>
    <section class="series-hero">${art(c)}
      <div class="series-info">
        <span class="kicker">${ic('lock')} Para desbloquear</span>
        <h1 class="display series-title">${esc(c.name)}</h1>
        <p class="series-desc">${esc(c.desc)}</p>
        <div class="series-meta">
          ${c.modules.length ? `<span class="chip chip-glass">${ic('layers')} ${plural(c.modules.length, 'módulo', 'módulos')}</span>` : ''}
          ${s.total ? `<span class="chip chip-glass">${ic('courses')} ${plural(s.total, 'aula', 'aulas')}</span>` : ''}
          <span class="chip chip-glass">${ic('award')} Certificado de conclusão</span>
        </div>
        <div class="series-actions"><button class="btn btn-primary btn-lg" data-buy="${esc(c.id)}">Quero desbloquear ${ic('arrow-right')}</button></div>
      </div>
    </section>
    <div class="sales-grid">
      <div>
        <div class="sec-head" style="margin-bottom:16px"><h2>Trailer</h2></div>
        <div class="trailer">${emb ? `<iframe src="${esc(emb)}" title="Trailer de ${esc(c.name)}" allow="fullscreen; picture-in-picture; encrypted-media" allowfullscreen loading="lazy"></iframe>` : `${art(c)}<div class="trailer-empty"><span>${ic('play')} Trailer em breve</span></div>`}</div>
        ${learn.length ? `<div class="sec"><div class="sec-head"><h2>O que você vai aprender</h2></div><ul class="learn">${learn.map(x => `<li>${ic('check')}<span>${esc(x)}</span></li>`).join('')}</ul></div>` : ''}
        ${c.modules.length ? `<div class="sec"><div class="sec-head"><h2>Conteúdo</h2></div><div class="locked-mods">${c.modules.map((m, i) => `<div><b>${pad(i + 1)}</b>${esc(m.name)}<span class="muted" style="margin-left:auto">${plural(m.lessons.length, 'aula', 'aulas')}</span>${ic('lock')}</div>`).join('')}</div></div>` : ''}
      </div>
      <aside class="buy-card">
        <span class="kicker">Acesso completo</span>
        ${priceHTML(c, true)}
        <ul class="buy-list">
          <li>${ic('check')} Todas as aulas e materiais do curso</li>
          <li>${ic('check')} Assista no seu ritmo, no celular ou computador</li>
          <li>${ic('check')} Certificado ao concluir</li>
        </ul>
        <button class="btn btn-primary btn-lg full" data-buy="${esc(c.id)}">Desbloquear agora</button>
        <p class="buy-note" id="buyNote">${c.checkoutUrl ? 'Você será levado ao checkout oficial.' : ''}</p>
      </aside>
    </div>`;
}

function pageLibrary(){
  const items = [];
  openCourses().forEach(c => lessonsOf(c).forEach(x => resources(x.l).forEach(r => items.push({...r, x}))));
  return `
    <section class="page-title"><div><h1 class="display">Materiais</h1><p>Arquivos e links de todas as suas aulas, num só lugar.</p></div></section>
    ${items.length ? `<div class="lib-grid">${items.map(r => `<article class="lib-item">
        <span class="material-ic">${ic(r.kind === 'site' ? 'globe' : 'download')}</span>
        <h3>${esc(r.label)}</h3><p>${esc(r.x.c.name)} · ${esc(r.x.l.title)}</p>
        <a class="btn btn-line" href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener">${ic('external')} ${r.kind === 'site' ? 'Acessar' : 'Abrir arquivo'}</a>
      </article>`).join('')}</div>` : '<div class="empty">Os arquivos e links das aulas aparecerão aqui.</div>'}`;
}
function pageProgress(){
  const t = totals(), st = streak(), avg = t.total ? Math.round(t.done / t.total * 100) : 0;
  const set = new Set(state.days), today = todayISO();
  const cells = Array.from({length: 28}, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (27 - i)); const iso = todayISO(d); return `<i class="${set.has(iso) ? 'on' : ''}${iso === today ? ' today' : ''}" title="${d.toLocaleDateString('pt-BR')}"></i>`; }).join('');
  return `
    <section class="page-title"><div><h1 class="display">Evolução</h1><p>Seu ritmo, seu nível e suas conquistas.</p></div></section>
    ${levelCard()}
    <section class="stats">
      <div class="stat hl"><b>${avg}<small>%</small></b><span>Progresso geral</span></div>
      <div class="stat"><b>${t.done}<small>/${t.total}</small></b><span>Aulas concluídas</span></div>
      <div class="stat"><b>${st}</b><span>${st === 1 ? 'Dia seguido' : 'Dias seguidos'}</span></div>
      <div class="stat"><b>${state.days.length}</b><span>Dias de estudo no total</span></div>
    </section>
    <div class="two-col sec">
      <div class="panel"><h3>Últimas 4 semanas</h3><div class="heat">${cells}</div><div class="heat-legend"><span>4 semanas atrás</span><span>Hoje</span></div></div>
      <div class="panel"><h3>Certificados</h3>${t.finished.length ? `<div class="certs">${t.finished.map(c => `<button class="cert-row" data-cert="${esc(c.id)}">${ic('award')}<span>${esc(c.name)}</span>${ic('chevron-right')}</button>`).join('')}</div>` : '<p class="muted">Conclua todas as aulas de um curso para liberar o certificado.</p>'}</div>
    </div>
    <div class="panel sec"><h3>Progresso por curso</h3><div class="course-progress">${openCourses().map(cpItem).join('') || '<p class="muted">Nenhum curso liberado.</p>'}</div></div>`;
}

function pageProfile(){
  const u = state.user || {}, L = level();
  return `
    <section class="page-title"><div><h1 class="display">Perfil</h1></div></section>
    <div class="panel profile-card">
      <span class="avatar avatar-xl">${esc((u.name || 'A').charAt(0).toUpperCase())}</span>
      <div><h2>${esc(u.name || 'Aluno')}</h2><p class="muted">Nível ${L.cur.name} · ${plural(state.completed.length, 'aula concluída', 'aulas concluídas')}</p></div>
    </div>
    <form class="panel sec profile-form" id="profileForm">
      <h3>Seus dados</h3>
      <label for="pfName" style="margin-top:0">Nome</label><input id="pfName" value="${esc(u.name || '')}" autocomplete="name">
      <label for="pfPhone">Telefone</label><input id="pfPhone" type="tel" value="${esc(u.phone || '')}" placeholder="(00) 00000-0000" autocomplete="tel">
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px"><button class="btn btn-primary" type="submit">Salvar alterações</button><button class="btn btn-line" type="button" data-act="logout">${ic('logout')} Sair da conta</button></div>
    </form>`;
}

/* ------------------------------------------------------------------
   Roteador
   ------------------------------------------------------------------ */
function parseRoute(){
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  return {name: parts[0] || 'inicio', args: parts.slice(1)};
}
function build(){
  // devolve {html, nav, title} para a rota atual, ou null se redirecionou
  const {name, args} = parseRoute();
  if(['curso', 'aula', 'oferta'].includes(name)){
    const c = findCourse(args[0]);
    if(!c){ location.replace('#/cursos'); return null; }
    if(c.locked && name !== 'oferta'){ location.replace('#/oferta/' + encodeURIComponent(c.id)); return null; }
    if(!c.locked && name === 'oferta'){ location.replace('#/curso/' + encodeURIComponent(c.id)); return null; }
    const html = name === 'curso' ? pageCourse(c) : name === 'oferta' ? pageOffer(c) : pageLesson(c, +args[1] || 0, +args[2] || 0);
    return {html, nav: 'cursos', title: `${c.name} — ELITE Academy`};
  }
  const pages = {cursos: pageCourses, biblioteca: pageLibrary, evolucao: pageProgress, perfil: pageProfile};
  const fn = pages[name] || pageHome;
  return {html: fn(), nav: pages[name] ? name : 'inicio', title: 'ELITE Academy — Área de membros'};
}
function render(){
  if(!state.user) return;
  clearAutoNext();
  const r = build(); if(!r) return;
  $('#view').innerHTML = r.html;
  document.title = r.title;
  $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === r.nav));
  renderChrome();
  if(render.last !== location.hash){ window.scrollTo(0, 0); render.last = location.hash; }
}
// atualiza só partes da página (evita recarregar o vídeo da aula)
function patch(selectors){
  const r = build(); if(!r) return;
  const tmp = document.createElement('div'); tmp.innerHTML = r.html;
  selectors.forEach(sel => { const a = $(sel, $('#view')), b = $(sel, tmp); if(a && b) a.replaceWith(b); });
  renderChrome();
}
function renderChrome(){
  const name = state.user?.name || 'Aluno', ini = name.charAt(0).toUpperCase(), L = level(), st = streak();
  $('#topAvatar').textContent = ini; $('#sideAvatar').textContent = ini;
  $('#sideName').textContent = name; $('#sideRank').textContent = 'Nível ' + L.cur.name;
  $('#streakChip').innerHTML = `${ic('flame')} ${st}`;
  $('#streakChip').classList.toggle('off', !st);
  $('#streakChip').title = st ? `${plural(st, 'dia seguido', 'dias seguidos')} estudando` : 'Assista uma aula hoje para começar sua sequência';
  $('#sideLevel').innerHTML = `<div class="lv-top"><span>Seu nível</span>${ic('award')}</div><b>${L.cur.name}</b><div class="bar" style="margin-top:12px"><i style="width:${L.pct}%"></i></div><small>${L.nxt ? `${plural(L.toNext, 'aula', 'aulas')} para ${L.nxt.name}` : 'Nível máximo'}</small>`;
}
window.addEventListener('hashchange', render);

/* ------------------------------------------------------------------
   Ações
   ------------------------------------------------------------------ */
function clearAutoNext(){ clearInterval(autoNextTimer); autoNextTimer = null; }
function startAutoNext(c, k){
  const all = lessonsOf(c), idx = all.findIndex(x => x.k === k), next = all[idx + 1];
  const box = $('#autoNext'); if(!box) return;
  if(!next){
    if(stats(c).pct === 100) box.innerHTML = `<div class="autonext"><span>Você concluiu <b>${esc(c.name)}</b>. Parabéns!</span><div><button class="btn btn-primary" data-cert="${esc(c.id)}">${ic('award')} Ver certificado</button></div></div>`;
    return;
  }
  let n = 6;
  const href = `#/aula/${encodeURIComponent(c.id)}/${next.mi}/${next.li}`;
  const paint = () => { box.innerHTML = `<div class="autonext"><span>Próxima aula em <b>${n}s</b>: ${esc(next.l.title)}</span><div><a class="btn btn-primary" href="${href}">Assistir agora</a><button class="btn btn-ghost" data-act="cancel-next">Cancelar</button></div></div>`; };
  paint();
  autoNextTimer = setInterval(() => { n--; if(n <= 0){ clearAutoNext(); location.hash = href; } else paint(); }, 1000);
}
function toggleComplete(k){
  const {args} = parseRoute(); const c = findCourse(args[0]); if(!c) return;
  const parts = ['.lesson-actions', '.playlist'];
  clearAutoNext(); $('#autoNext').innerHTML = '';
  if(isDone(k)){ state.completed = state.completed.filter(x => x !== k); save(); patch(parts); toast('Aula marcada como não concluída.'); return; }
  const before = level().i;
  state.completed.push(k); markStudy(); save(); patch(parts);
  if(level().i > before) toast(`Novo nível: ${level().cur.name}!`); else toast('Aula concluída!');
  startAutoNext(c, k);
}
function openCert(id){
  const c = findCourse(id); if(!c) return;
  const date = new Date().toLocaleDateString('pt-BR', {day: '2-digit', month: 'long', year: 'numeric'});
  const s = stats(c);
  $('#certBody').innerHTML = `
    <div class="cert-brand"><span class="brand"><span class="brand-mark">E</span><span>ELITE ACADEMY</span></span><span>CERTIFICADO DE CONCLUSÃO</span></div>
    <div><p>Certificamos que</p><div class="cert-name" style="margin:10px 0 16px">${esc(state.user?.name || 'Aluno')}</div>
    <p>concluiu o treinamento</p><h3 style="margin:10px 0 14px">${esc(c.name)}</h3>
    <p>com ${plural(s.total, 'aula', 'aulas')} em ${plural(c.modules.length, 'módulo', 'módulos')}${s.mins ? `, totalizando ${fmtMin(s.mins)} de conteúdo` : ''}.</p></div>
    <div class="cert-sign"><span>Emitido em ${esc(date)}</span><span><b>ELITE Academy</b></span></div>`;
  $('#certModal').classList.remove('hidden');
}
function buy(id){
  const c = findCourse(id); if(!c) return;
  const u = safeUrl(c.checkoutUrl);
  if(u){ window.open(u, '_blank', 'noopener'); return; }
  const note = $('#buyNote'); if(note) note.textContent = 'O checkout deste curso ainda está sendo configurado.';
  toast('Checkout ainda não configurado.');
}
function logout(){
  state.user = null; save(); clearAutoNext();
  $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden');
  $('#memberPassword').value = ''; closeMenu();
  history.replaceState(null, '', location.pathname + location.search);
}
function closeMenu(){ $('#userDropdown').classList.add('hidden'); $('#userBtn').setAttribute('aria-expanded', 'false'); }

document.addEventListener('click', e => {
  const t = e.target.closest('button, a');
  if(!e.target.closest('.user-menu')) closeMenu();
  if(!t) return;
  const d = t.dataset;
  if(t.id === 'userBtn'){ const dd = $('#userDropdown'); dd.classList.toggle('hidden'); t.setAttribute('aria-expanded', !dd.classList.contains('hidden')); return; }
  if(d.close){ $('#' + d.close).classList.add('hidden'); return; }
  if(d.act === 'close-video'){ closeVideo(); return; }
  if(d.act === 'vm-complete' && vmCurrent){
    const k = key(vmCurrent.c, vmCurrent.mi, vmCurrent.li);
    if(isDone(k)) state.completed = state.completed.filter(x => x !== k);
    else { const before = level().i; state.completed.push(k); markStudy(); toast(level().i > before ? `Novo nível: ${level().cur.name}!` : 'Aula concluída!'); }
    save(); paintVideoBody(); renderChrome(); return;
  }
  if(d.act === 'master'){ openMasterLogin(); return; }
  if(d.act === 'logout'){ logout(); return; }
  if(d.act === 'print'){ window.print(); return; }
  if(d.act === 'cancel-next'){ clearAutoNext(); $('#autoNext').innerHTML = ''; return; }
  if(d.act === 'clear-search'){ searchTerm = ''; $('#searchInput').value = ''; render(); return; }
  if(d.filterGo){ filter = d.filterGo; if(parseRoute().name === 'cursos') render(); return; }
  if(d.filter){ filter = d.filter; $$('.filter').forEach(b => b.classList.toggle('active', b.dataset.filter === filter)); $('#courseGrid').innerHTML = coursesGrid(); return; }
  if(d.season != null && d.courseId){ season[d.courseId] = +d.season; render(); requestAnimationFrame(() => $('.seasons')?.scrollIntoView({block: 'nearest'})); return; }
  if(d.ltab){ lessonTab = d.ltab; patch(['.tabs', '#lessonPanel']); return; }
  if(d.complete){ toggleComplete(d.complete); return; }
  if(d.cert){ openCert(d.cert); return; }
  if(d.buy){ buy(d.buy); return; }
});
document.addEventListener('input', e => {
  if(e.target.id === 'noteText'){
    state.notes[e.target.dataset.note] = e.target.value;
    clearTimeout(save.t); save.t = setTimeout(() => { save(); const s = $('#noteStatus'); if(s) s.textContent = 'Salvo neste aparelho.'; }, 400);
    const s = $('#noteStatus'); if(s) s.textContent = 'Salvando…';
  }
  if(e.target.id === 'searchInput'){
    searchTerm = e.target.value.trim().toLocaleLowerCase('pt-BR');
    if(parseRoute().name !== 'cursos'){ filter = 'all'; location.hash = '#/cursos'; }
    else { const g = $('#courseGrid'); if(g) g.innerHTML = coursesGrid(); }
  }
});
document.addEventListener('submit', e => {
  const f = e.target;
  if(f.dataset.qa){
    e.preventDefault();
    const v = $('#qaInput').value.trim(); if(!v) return;
    (state.questions[f.dataset.qa] ||= []).push({text: v, at: Date.now()}); save();
    patch(['.tabs', '#lessonPanel']); toast('Dúvida registrada.');
  }
  if(f.id === 'profileForm'){
    e.preventDefault();
    const name = $('#pfName').value.trim(); if(!name){ toast('Digite seu nome.'); return; }
    state.user = {...state.user, name, phone: $('#pfPhone').value.trim()}; save(); render(); toast('Perfil atualizado.');
  }
});
document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){ if(!$('#videoModal').classList.contains('hidden')){ closeVideo(); return; } $$('.modal-wrap').forEach(m => m.classList.add('hidden')); closeMenu(); }
});
$$('.modal-wrap').forEach(m => m.addEventListener('click', e => { if(e.target !== m) return; if(m.id === 'videoModal') closeVideo(); else m.classList.add('hidden'); }));


/* ------------------------------------------------------------------
   Player em janela para videoaulas
   ------------------------------------------------------------------ */
let vmCurrent = null;   // {c, mi, li}
function videoTarget(href){
  const m = String(href || '').match(/^#\/aula\/([^/]+)\/(\d+)\/(\d+)$/);
  if(!m) return null;
  const c = findCourse(decodeURIComponent(m[1])); if(!c || c.locked) return null;
  const mi = +m[2], li = +m[3], l = c.modules[mi]?.lessons[li];
  if(!l || l.type !== 'video' || !embedUrl(l.url)) return null;
  return {c, mi, li};
}
function openVideo({c, mi, li}, push = true){
  const l = c.modules[mi].lessons[li];
  vmCurrent = {c, mi, li};
  markStudy();
  const src = embedUrl(l.url);
  const auto = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
  const frame = $('#vmPlayer iframe');
  if(!frame || frame.dataset.src !== src) $('#vmPlayer').innerHTML = `<iframe data-src="${esc(src)}" src="${esc(auto)}" title="${esc(l.title)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`;
  paintVideoBody();
  const wrap = $('#videoModal');
  if(wrap.classList.contains('hidden')){
    wrap.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if(push) history.pushState({vm: true}, '', location.href);
  }
}
function paintVideoBody(){
  if(!vmCurrent) return;
  const {c, mi, li} = vmCurrent, m = c.modules[mi], l = m.lessons[li];
  const k = key(c, mi, li), d = isDone(k), s = stats(c);
  const all = lessonsOf(c), idx = all.findIndex(x => x.k === k), next = all[idx + 1];
  const nextHref = next ? `#/aula/${encodeURIComponent(c.id)}/${next.mi}/${next.li}` : '';
  $('#vmBody').innerHTML = `
    <div class="vm-info">
      <div class="vm-crumbs">${esc(c.name)} · ${esc(m.name)} · Aula ${idx + 1} de ${s.total}${l.min ? ' · ' + fmtMin(l.min) : ''}</div>
      <h2 id="vmTitle">${esc(l.title)}</h2>
      <div class="vm-progress"><span>${s.pct}%</span><div class="bar"><i style="width:${s.pct}%"></i></div><span>${s.done}/${s.total}</span></div>
    </div>
    <div class="vm-actions">
      <button class="btn ${d ? 'done' : 'btn-primary'}" data-act="vm-complete">${ic('check')} ${d ? 'Concluída' : 'Marcar como concluída'}</button>
      ${next ? `<a class="btn ${d ? 'btn-primary' : 'btn-ghost'}" href="${nextHref}" data-vm-next="1">Próxima aula ${ic('chevron-right')}</a>` : ''}
      <a class="btn btn-line" href="#/aula/${encodeURIComponent(c.id)}/${mi}/${li}" data-vm-page="1">${ic('note')} Anotações</a>
    </div>
    ${resButtons(resources(l), 'vm-res')}`;
}
function closeVideo(fromUser = true){
  const wrap = $('#videoModal');
  if(wrap.classList.contains('hidden')) return;
  wrap.classList.add('hidden');
  $('#vmPlayer').innerHTML = '';          // para o vídeo
  document.body.style.overflow = '';
  vmCurrent = null;
  if(fromUser && history.state?.vm) history.back();
  render();                                // atualiza o progresso na página de trás
}
window.addEventListener('popstate', () => { if(!$('#videoModal').classList.contains('hidden')) closeVideo(false); });
// intercepta cliques em videoaulas (fora da página da aula) para abrir na janela
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#/aula/"]');
  if(!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if(a.dataset.vmPage){ e.preventDefault(); const h = a.getAttribute('href'); closeVideo(false); if(history.state?.vm) history.replaceState(null, '', location.href); location.hash = h; return; }
  const inModal = !!a.closest('#videoModal');
  if(!inModal && parseRoute().name === 'aula') return;      // na página da aula, segue normal
  const t = videoTarget(a.getAttribute('href'));
  if(!t){
    if(inModal){ e.preventDefault(); const h = a.getAttribute('href'); closeVideo(false); if(history.state?.vm) history.replaceState(null, '', location.href); location.hash = h; }
    return;
  }
  e.preventDefault(); e.stopImmediatePropagation();
  openVideo(t, !inModal);
}, true);

/* ------------------------------------------------------------------
   Login
   ------------------------------------------------------------------ */
function showApp(){
  $('#loginView').classList.add('hidden');
  $('#appView').classList.remove('hidden');
  const q = new URLSearchParams(location.search).get('curso');
  if(q && findCourse(q)){ history.replaceState(null, '', location.pathname); location.hash = '#/curso/' + encodeURIComponent(q); }
  else if(!location.hash) location.hash = '#/inicio';
  render();
}
$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#memberName').value.trim(), pass = $('#memberPassword').value.trim();
  if(!name){ $('#loginError').textContent = 'Digite seu nome para continuar.'; $('#memberName').focus(); return; }
  if(pass !== DEMO_PASSWORD){ $('#loginError').textContent = 'Senha incorreta. Confira e tente novamente.'; $('#memberPassword').focus(); return; }
  state.user = {name, phone: $('#memberPhone').value.trim()};
  $('#loginError').textContent = '';
  save(); showApp();
});

/* ------------------------------------------------------------------
   Área Master
   ------------------------------------------------------------------ */
function openMasterLogin(){
  $('#masterPassword').value = ''; $('#masterLoginError').textContent = '';
  $('#masterLoginModal').classList.remove('hidden'); $('#masterPassword').focus();
}
function enterMaster(){
  if($('#masterPassword').value !== DEMO_PASSWORD){ $('#masterLoginError').textContent = 'Senha incorreta.'; return; }
  $('#masterLoginModal').classList.add('hidden');
  openAdmin();
}
$('#masterLoginButton').addEventListener('click', enterMaster);
$('#masterPassword').addEventListener('keydown', e => { if(e.key === 'Enter') enterMaster(); });
/* ------------------------------------------------------------------
   Início
   ------------------------------------------------------------------ */
if(state.user) showApp();
