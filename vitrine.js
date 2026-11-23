/* ==================================================================
   Membros Elite — vitrine pública (cursos à venda)
   Lê /api/vitrine (banco). Sem banco: usa o conteúdo deste navegador
   ou os cursos de exemplo (data.js).
   ================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let products = [];
let tagFilter = 'all';

function esc(s = ''){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function ic(name, cls = ''){ return `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`; }
function plural(n, one, many){ return `${n} ${n === 1 ? one : many}`; }
function cap(t = ''){ const s = String(t).toLocaleLowerCase('pt-BR'); return s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1); }
function fmtMin(m){ m = Math.round(m || 0); if(!m) return ''; if(m < 60) return `${m} min`; const h = Math.floor(m / 60), r = m % 60; return r ? `${h}h ${String(r).padStart(2, '0')}min` : `${h}h`; }
function safeUrl(u){ u = String(u || '').trim(); if(!/^(https?:\/\/|assets\/)/i.test(u)) return ''; return u.replace(/["'()\\\s<>]/g, encodeURIComponent); }
function embedUrl(url){
  const u = safeUrl(url); if(!u) return '';
  const yt = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/);
  if(yt) return 'https://www.youtube-nocookie.com/embed/' + yt[1] + '?rel=0&modestbranding=1&playsinline=1';
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return vm ? 'https://player.vimeo.com/video/' + vm[1] : '';
}
function art(c){
  const u = safeUrl(c.coverUrl);
  if(u) return `<div class="art" style="background-image:url('${u}')"></div>`;
  return `<div class="art art-gen g-${esc(c.color || 'green')}"><span class="art-code">${esc(c.code || '')}</span></div>`;
}
function price(c){
  if(!c.price) return null;
  const [r, cts = '00'] = String(c.price).replace(/[^\d,]/g, '').split(',');
  return {r, c: cts.padEnd(2, '0').slice(0, 2)};
}
function priceHTML(c, cls = ''){
  const p = price(c);
  return p ? `<span class="p-price ${cls}"><small>R$</small>${esc(p.r)}<small>,${esc(p.c)}</small></span>` : `<span class="p-price p-soon ${cls}">Valor em breve</span>`;
}
// mesmo resumo que a API devolve
function summary(courses){
  return courses.filter(c => c.showInStore !== false).map(c => ({
    id: c.id, name: c.name, desc: c.desc || '', tag: c.tag || '', color: c.color || 'green', code: c.code || '',
    coverUrl: c.coverUrl || '', price: c.price || '', checkoutUrl: c.checkoutUrl || '', trailerUrl: c.trailerUrl || '',
    learn: c.learn || [], featured: !!c.featured,
    modules: (c.modules || []).map(m => ({name: m.name, lessons: (m.lessons || []).length, min: (m.lessons || []).reduce((a, l) => a + (+l.min || 0), 0)}))
  }));
}
function totals(c){ return {lessons: c.modules.reduce((a, m) => a + m.lessons, 0), min: c.modules.reduce((a, m) => a + m.min, 0)}; }
function buyButton(c, cls = ''){
  const u = safeUrl(c.checkoutUrl);
  return u ? `<a class="btn btn-primary ${cls}" href="${esc(u)}" target="_blank" rel="noopener">Comprar agora ${ic('arrow-right')}</a>`
    : `<span class="btn btn-ghost ${cls} is-disabled" aria-disabled="true">${ic('clock')} Vendas em breve</span>`;
}

/* ---------------- dados ---------------- */
async function loadProducts(){
  try {
    const r = await fetch('/api/vitrine', {credentials: 'same-origin'});
    if(r.ok && (r.headers.get('content-type') || '').includes('json')){
      const d = await r.json();
      if(d.courses) return d.courses;
      return summary(initialCourses);
    }
  } catch(e) {}
  let local = null; try { local = JSON.parse(localStorage.getItem('eliteAcademyDemoV1'))?.courses; } catch(e) {}
  return summary(Array.isArray(local) && local.length ? local : initialCourses);
}

/* ---------------- página ---------------- */
function card(c){
  const t = totals(c);
  return `<button class="p-card" data-product="${esc(c.id)}" aria-label="Ver detalhes de ${esc(c.name)}">
    <div class="p-art">${art(c)}<span class="chip chip-glass p-tag">${esc(cap(c.tag || 'Treinamento'))}</span></div>
    <div class="p-body">
      <h3 class="display">${esc(c.name)}</h3>
      <p>${esc(c.desc)}</p>
      <div class="p-meta">${c.modules.length ? `<span>${ic('layers')} ${plural(c.modules.length, 'módulo', 'módulos')}</span>` : ''}${t.lessons ? `<span>${ic('courses')} ${plural(t.lessons, 'aula', 'aulas')}</span>` : ''}${t.min ? `<span>${ic('clock')} ${fmtMin(t.min)}</span>` : ''}${!c.modules.length ? `<span>${ic('star')} Lançamento</span>` : ''}</div>
      <div class="p-foot">${priceHTML(c)}<span class="p-cta">Ver detalhes ${ic('arrow-right')}</span></div>
    </div>
  </button>`;
}
function render(){
  const feat = products.find(p => p.featured) || products.find(p => safeUrl(p.checkoutUrl)) || products[0];
  const tags = [...new Set(products.map(p => cap(p.tag || 'Treinamento')))];
  const list = products.filter(p => tagFilter === 'all' || cap(p.tag || 'Treinamento') === tagFilter);
  const ft = feat ? totals(feat) : null;
  $('#store').innerHTML = `
    <section class="store-hero">
      <div class="store-hero-copy">
        <span class="kicker">Membros Elite</span>
        <h1 class="display">Treinamentos para quem <em>vai além.</em></h1>
        <p>Aulas em vídeo, materiais de apoio e certificado. Escolha o seu treinamento, estude no seu ritmo e acompanhe sua evolução na área de membros.</p>
        <div class="store-hero-actions"><a class="btn btn-primary btn-lg" href="#catalogo">Ver todos os cursos ${ic('arrow-right')}</a><a class="btn btn-ghost btn-lg" href="/">Já sou aluno</a></div>
      </div>
      ${feat ? `<button class="feat" data-product="${esc(feat.id)}" aria-label="Destaque: ${esc(feat.name)}">
        ${art(feat)}
        <span class="chip chip-accent feat-badge">${ic('star')} Destaque</span>
        <div class="feat-info">
          <span class="kicker">${esc(cap(feat.tag || 'Treinamento'))}</span>
          <h2 class="display">${esc(feat.name)}</h2>
          <p>${esc(feat.desc)}</p>
          <div class="feat-foot">${priceHTML(feat, 'lg')}<span class="btn btn-primary">Conhecer ${ic('arrow-right')}</span></div>
        </div>
      </button>` : ''}
    </section>
    <section class="perks">
      <div>${ic('play')}<b>Aulas em vídeo</b><span>Assista no seu ritmo</span></div>
      <div>${ic('download')}<b>App no celular</b><span>Instale e acesse em um toque</span></div>
      <div>${ic('file')}<b>Materiais de apoio</b><span>Arquivos e links em cada aula</span></div>
      <div>${ic('award')}<b>Certificado</b><span>Ao concluir o curso</span></div>
    </section>
    <section class="sec" id="catalogo">
      <div class="sec-head"><div><h2>Todos os cursos</h2><p>${plural(products.length, 'treinamento disponível', 'treinamentos disponíveis')}</p></div></div>
      ${tags.length > 1 ? `<div class="filters store-filters">${['all', ...tags].map(t => `<button class="filter${tagFilter === t ? ' active' : ''}" data-tag="${esc(t)}">${t === 'all' ? 'Todos' : esc(t)}</button>`).join('')}</div>` : ''}
      <div class="p-grid">${list.map(card).join('') || '<div class="empty">Nenhum curso nesta categoria.</div>'}</div>
    </section>
    <section class="store-cta">
      <div><h2 class="display">Já é aluno?</h2><p>Entre na área de membros para continuar de onde parou.</p></div>
      <a class="btn btn-primary btn-lg" href="/">Entrar na área de membros ${ic('arrow-right')}</a>
    </section>`;
}

/* ---------------- detalhes do produto ---------------- */
function openProduct(id, push = true){
  const c = products.find(p => p.id === id); if(!c) return;
  const t = totals(c), emb = embedUrl(c.trailerUrl);
  $('#productBody').innerHTML = `
    <div class="pm-hero">${art(c)}<div class="pm-hero-info"><span class="kicker">${esc(cap(c.tag || 'Treinamento'))}</span><h2 class="display" id="pmTitle">${esc(c.name)}</h2><p>${esc(c.desc)}</p></div></div>
    <div class="pm-grid">
      <div class="pm-main">
        ${emb ? `<div class="trailer"><iframe src="${esc(emb)}" title="Trailer de ${esc(c.name)}" allow="fullscreen; picture-in-picture; encrypted-media" allowfullscreen loading="lazy"></iframe></div>` : ''}
        ${c.learn.length ? `<h3 class="pm-h">O que você vai aprender</h3><ul class="learn">${c.learn.map(x => `<li>${ic('check')}<span>${esc(x)}</span></li>`).join('')}</ul>` : ''}
        ${c.modules.length ? `<h3 class="pm-h">Conteúdo do curso</h3><div class="locked-mods">${c.modules.map((m, i) => `<div><b>${String(i + 1).padStart(2, '0')}</b>${esc(m.name)}<span class="muted" style="margin-left:auto">${plural(m.lessons, 'aula', 'aulas')}${m.min ? ' · ' + fmtMin(m.min) : ''}</span></div>`).join('')}</div>` : `<h3 class="pm-h">Conteúdo do curso</h3><p class="muted">Os módulos deste lançamento serão apresentados em breve.</p>`}
      </div>
      <aside class="buy-card pm-buy">
        <span class="kicker">Acesso completo</span>
        ${priceHTML(c, 'xl')}
        <ul class="buy-list">
          ${t.lessons ? `<li>${ic('check')} ${plural(t.lessons, 'aula', 'aulas')}${t.min ? ' · ' + fmtMin(t.min) + ' de conteúdo' : ''}</li>` : ''}
          <li>${ic('check')} Assista no celular ou no computador</li>
          <li>${ic('check')} Materiais de apoio nas aulas</li>
          <li>${ic('check')} Certificado ao concluir</li>
        </ul>
        ${buyButton(c, 'btn-lg full')}
        <button class="btn btn-ghost full pm-share" data-share="${esc(c.id)}">${ic('copy')} Copiar link deste curso</button>
      </aside>
    </div>
    <div class="pm-sticky">${priceHTML(c)}${buyButton(c)}</div>`;
  $('#productModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if(push && location.hash !== '#p/' + id) history.pushState({p: id}, '', '#p/' + encodeURIComponent(id));
  $('#productModal .modal').scrollTop = 0;
}
function closeProduct(fromUser = true){
  if($('#productModal').classList.contains('hidden')) return;
  $('#productModal').classList.add('hidden'); $('#productBody').innerHTML = '';
  document.body.style.overflow = '';
  if(fromUser && location.hash.startsWith('#p/')){ if(history.state?.p) history.back(); else history.replaceState(null, '', location.pathname + location.search); }
}
function fromHash(){
  const m = location.hash.match(/^#p\/(.+)$/);
  if(m) openProduct(decodeURIComponent(m[1]), false); else closeProduct(false);
}
function toast(msg){
  let el = $('#toast'); if(!el){ el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2400);
}

document.addEventListener('click', e => {
  const t = e.target.closest('button, a'); if(!t) return;
  if(t.dataset.product){ openProduct(t.dataset.product); return; }
  if(t.dataset.tag){ tagFilter = t.dataset.tag; render(); $('#catalogo').scrollIntoView({block: 'start'}); return; }
  if(t.hasAttribute('data-close-product')){ closeProduct(); return; }
  if(t.dataset.share){
    const url = location.origin + location.pathname + '#p/' + encodeURIComponent(t.dataset.share);
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast('Link copiado!')).catch(() => toast(url));
  }
});
$('#productModal').addEventListener('click', e => { if(e.target.id === 'productModal') closeProduct(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeProduct(); });
window.addEventListener('popstate', fromHash);
window.addEventListener('hashchange', fromHash);

(async () => {
  products = await loadProducts();
  render();
  fromHash();
})();
