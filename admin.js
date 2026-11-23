/* ==================================================================
   ELITE Academy — Área Master
   Cursos → módulos → aulas. Cada aula tem: vídeo (abre em janela para o
   aluno), texto e botões (arquivo ou site). Usa as funções de app.js.
   ================================================================== */
const ADM = {courseId: null, tab: 'aulas', sheet: null, confirm: null, view: 'course', users: null, created: null};
const COLORS = [['green', 'Verde'], ['purple', 'Roxo'], ['blue', 'Azul'], ['orange', 'Laranja']];

function admCourse(){ return findCourse(ADM.courseId) || state.courses[0] || null; }
function admSave(msg, progressToo = false){ saveContent(); if(progressToo) save(); if(state.user && !$('#appView').classList.contains('hidden')) render(); renderAdmin(); if(msg) toast(msg); }

function openAdmin(){
  ADM.courseId = ADM.courseId && findCourse(ADM.courseId) ? ADM.courseId : state.courses[0]?.id || null;
  $('#adminPanel').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  renderAdmin();
}
function closeAdmin(){
  closeSheet();
  $('#adminPanel').classList.add('hidden');
  document.body.style.overflow = '';
  if(state.user && !$('#appView').classList.contains('hidden')) render();
}

/* ---------------- lista de cursos ---------------- */
function renderAdmin(){
  const cur = admCourse(); ADM.courseId = cur?.id || null;
  $('#admSide').innerHTML = `
    ${API.on ? `<button class="adm-course adm-students-btn${ADM.view === 'students' ? ' active' : ''}" data-adm="students"><span class="adm-course-art adm-ic-art">${ic('user')}</span><span class="adm-course-txt"><b>Alunos</b><small>Acessos e progresso</small></span></button>` : ''}
    <div class="adm-side-head"><span class="kicker">Seus cursos</span><span class="muted">${state.courses.length}</span></div>
    <div class="adm-courses">${state.courses.map(c => `
      <button class="adm-course${c.id === ADM.courseId && ADM.view === 'course' ? ' active' : ''}" data-adm-course="${esc(c.id)}">
        <span class="adm-course-art">${art(c)}</span>
        <span class="adm-course-txt"><b>${esc(c.name)}</b><small>${plural(lessonsOf(c).length, 'aula', 'aulas')} · ${c.locked ? 'Bloqueado' : 'Liberado'}</small></span>
      </button>`).join('')}</div>
    <button class="btn btn-primary full" data-adm="new-course">${ic('plus')} Novo curso</button>`;
  const banner = !API.on
    ? `<div class="adm-banner">${ic('shield')}<span><b>Modo demonstração.</b> O banco de dados não respondeu, então as alterações ficam salvas só neste navegador.</span></div>`
    : API.contentEmpty ? `<div class="adm-banner warn">${ic('upload')}<span><b>O banco ainda não tem cursos salvos.</b> Os alunos veem os cursos de exemplo até você salvar.</span><button class="btn btn-primary" data-adm="publish">Salvar estes cursos no banco</button></div>` : '';
  $('#admMain').innerHTML = banner + (ADM.view === 'students' ? studentsView() : cur ? courseEditor(cur) : '<div class="empty">Crie seu primeiro curso.</div>');
}

function courseEditor(c){
  const s = stats(c);
  return `
    <div class="adm-head">
      <div>
        <span class="kicker">${esc(cap(c.tag || 'Curso'))}</span>
        <h1 class="display">${esc(c.name)}</h1>
        <p class="muted">${plural(c.modules.length, 'módulo', 'módulos')} · ${plural(s.total, 'aula', 'aulas')}${s.mins ? ' · ' + fmtMin(s.mins) : ''}</p>
      </div>
      <div class="adm-head-actions">
        <button class="switch${c.locked ? '' : ' on'}" data-adm="toggle-lock" role="switch" aria-checked="${!c.locked}"><span class="switch-dot"></span><span>${c.locked ? 'Bloqueado (à venda)' : 'Liberado para alunos'}</span></button>
        <button class="btn btn-ghost" data-adm="copy-link">${ic('copy')} Copiar link</button>
        <button class="btn btn-ghost" data-adm="preview">${ic('eye')} Ver como aluno</button>
      </div>
    </div>
    <div class="tabs adm-tabs" role="tablist">
      <button class="${ADM.tab === 'aulas' ? 'active' : ''}" data-adm-tab="aulas">${ic('layers')} Módulos e aulas</button>
      <button class="${ADM.tab === 'dados' ? 'active' : ''}" data-adm-tab="dados">${ic('edit')} Dados do curso</button>
    </div>
    ${ADM.tab === 'dados' ? courseForm(c) : modulesEditor(c)}`;
}

/* ---------------- módulos e aulas ---------------- */
function confirmBtn(id, label, cls = ''){
  const on = ADM.confirm === id;
  return `<button class="icon-btn adm-del ${cls}${on ? ' confirming' : ''}" data-adm-del="${esc(id)}" aria-label="${on ? 'Confirmar exclusão' : label}" title="${on ? 'Clique de novo para confirmar' : label}">${on ? '<span>Confirmar?</span>' : ic('trash')}</button>`;
}
function modulesEditor(c){
  const mods = c.modules.map((m, mi) => `
    <section class="adm-mod">
      <div class="adm-mod-head">
        <span class="adm-mod-num">${pad(mi + 1)}</span>
        <input class="adm-mod-name" value="${esc(m.name)}" data-adm-modname="${mi}" aria-label="Nome do módulo ${mi + 1}">
        <div class="adm-row-actions">
          <button class="icon-btn" data-adm-mod-move="${mi}:-1" aria-label="Subir módulo" ${mi === 0 ? 'disabled' : ''}>${ic('up')}</button>
          <button class="icon-btn" data-adm-mod-move="${mi}:1" aria-label="Descer módulo" ${mi === c.modules.length - 1 ? 'disabled' : ''}>${ic('chevron-down')}</button>
          ${confirmBtn('mod:' + mi, 'Excluir módulo')}
        </div>
      </div>
      <div class="adm-lessons">${m.lessons.map((l, li) => {
        const res = resources(l), thumb = ytThumb(l.url);
        return `<div class="adm-lesson">
          <button class="adm-lesson-main" data-adm-edit="${mi}:${li}">
            <span class="adm-thumb"${thumb ? ` style="background-image:url('${esc(thumb)}')"` : ''}>${thumb ? '' : `<span>${ic(typeIcon(l.type))}</span>`}</span>
            <span class="adm-lesson-txt"><b>${esc(l.title)}</b>
              <small>${l.type === 'video' && isVideoUrl(l.url) ? `<span class="tag tag-ok">${ic('play', 'ic-fill')} Vídeo</span>` : `<span class="tag">${ic(typeIcon(l.type))} ${typeLabel(l.type)}</span>`}
              ${res.length ? `<span class="tag">${ic('link')} ${plural(res.length, 'botão', 'botões')}</span>` : ''}
              ${l.min ? `<span class="tag">${ic('clock')} ${fmtMin(l.min)}</span>` : ''}</small></span>
            <span class="adm-edit-hint">${ic('edit')} Editar</span>
          </button>
          <div class="adm-row-actions">
            <button class="icon-btn" data-adm-les-move="${mi}:${li}:-1" aria-label="Subir aula" ${li === 0 ? 'disabled' : ''}>${ic('up')}</button>
            <button class="icon-btn" data-adm-les-move="${mi}:${li}:1" aria-label="Descer aula" ${li === m.lessons.length - 1 ? 'disabled' : ''}>${ic('chevron-down')}</button>
            ${confirmBtn(`les:${mi}:${li}`, 'Excluir aula')}
          </div>
        </div>`;
      }).join('') || '<p class="adm-empty">Nenhuma aula neste módulo ainda.</p>'}</div>
      <button class="adm-add" data-adm-new-lesson="${mi}">${ic('plus')} Adicionar aula</button>
    </section>`).join('');
  return `<div class="adm-mods">${mods || '<div class="empty">Este curso ainda não tem módulos. Comece criando o primeiro.</div>'}</div>
    <button class="btn btn-line adm-new-mod" data-adm="new-module">${ic('plus')} Novo módulo</button>`;
}

/* ---------------- editor de aula (painel lateral) ---------------- */
function openSheet(mi, li){
  const c = admCourse(); if(!c) return;
  const l = li == null ? {title: '', type: 'video', url: '', body: '', links: []} : c.modules[mi].lessons[li];
  const links = [...(l.links || [])];
  if(l.type === 'pdf' && l.url) links.unshift({kind: 'file', label: 'Abrir material', url: l.url});
  ADM.sheet = {mi, li, draft: {title: l.title, url: l.type === 'video' ? l.url || '' : '', body: l.body || '', min: l.min || '', links: links.map(x => ({...x}))}};
  paintSheet();
  $('#admSheetWrap').classList.remove('hidden');
  setTimeout(() => $('#lsTitle')?.focus(), 50);
}
function closeSheet(){ ADM.sheet = null; $('#admSheetWrap').classList.add('hidden'); $('#admSheet').innerHTML = ''; }
function videoStatus(url){
  url = url.trim();
  if(!url) return {cls: '', txt: 'Opcional. Cole o link do YouTube (pode ser não listado) ou do Vimeo.'};
  if(ytId(url)) return {cls: 'ok', txt: 'Link do YouTube reconhecido. O vídeo abre numa janela para o aluno.'};
  if(isVideoUrl(url)) return {cls: 'ok', txt: 'Link do Vimeo reconhecido. O vídeo abre numa janela para o aluno.'};
  return {cls: 'bad', txt: 'Link não reconhecido. Use um link do YouTube ou do Vimeo.'};
}
function paintSheet(){
  const S = ADM.sheet; if(!S) return;
  const c = admCourse(), d = S.draft, vs = videoStatus(d.url), th = ytThumb(d.url);
  $('#admSheet').innerHTML = `
    <header class="sheet-head">
      <div><span class="kicker">${S.li == null ? 'Nova aula' : 'Editar aula'}</span><h2>${esc(c.modules[S.mi]?.name || '')}</h2></div>
      <button class="icon-btn" data-adm="sheet-close" aria-label="Fechar">${ic('close')}</button>
    </header>
    <div class="sheet-body">
      <label for="lsTitle">Título da aula</label>
      <input id="lsTitle" data-draft="title" value="${esc(d.title)}" placeholder="Ex.: Boas-vindas ao curso">
      <div class="form-row">
        <div><label for="lsModule">Módulo</label><select id="lsModule" data-draft-module>${c.modules.map((m, i) => `<option value="${i}" ${i === S.mi ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
        <div class="form-narrow"><label for="lsMin">Duração <small>min</small></label><input id="lsMin" data-draft="min" type="number" min="0" inputmode="numeric" value="${esc(d.min)}" placeholder="10"></div>
      </div>

      <div class="sheet-block">
        <div class="sheet-block-head">${ic('play')} <b>Vídeo da aula</b></div>
        <input id="lsUrl" data-draft="url" value="${esc(d.url)}" placeholder="https://youtu.be/..." inputmode="url" aria-label="Link do vídeo">
        <p class="hint ${vs.cls}" id="lsUrlHint">${esc(vs.txt)}</p>
        <div class="video-preview${th ? '' : ' hidden'}" id="lsPreview">${th ? `<span class="vp-img" style="background-image:url('${esc(th)}')"></span><span>${ic('play', 'ic-fill')}</span>` : ''}</div>
      </div>

      <label for="lsBody">Descrição ou texto da aula</label>
      <textarea id="lsBody" data-draft="body" rows="5" placeholder="O que o aluno vai ver nesta aula, instruções, resumo...">${esc(d.body)}</textarea>

      <div class="sheet-block">
        <div class="sheet-block-head">${ic('link')} <b>Botões da aula</b><span class="muted">Arquivos e sites que o aluno pode abrir</span></div>
        <div class="link-rows">${d.links.map((x, i) => `
          <div class="link-row">
            <div class="seg" role="radiogroup" aria-label="Tipo do botão ${i + 1}">
              <button class="${x.kind !== 'site' ? 'on' : ''}" data-link-kind="${i}:file">${ic('download')} Arquivo</button>
              <button class="${x.kind === 'site' ? 'on' : ''}" data-link-kind="${i}:site">${ic('globe')} Site</button>
            </div>
            <input data-link="${i}:label" value="${esc(x.label || '')}" placeholder="${x.kind === 'site' ? 'Ex.: Acessar a ferramenta' : 'Ex.: Baixar o checklist (PDF)'}" aria-label="Texto do botão ${i + 1}">
            <input data-link="${i}:url" value="${esc(x.url || '')}" placeholder="${x.kind === 'site' ? 'https://site.com' : 'Link do arquivo (Google Drive, Dropbox...)'}" inputmode="url" aria-label="Link do botão ${i + 1}">
            <button class="icon-btn adm-del" data-link-del="${i}" aria-label="Remover botão ${i + 1}">${ic('trash')}</button>
          </div>`).join('')}</div>
        <div class="link-add">
          <button class="adm-add" data-link-add="file">${ic('download')} Adicionar arquivo</button>
          <button class="adm-add" data-link-add="site">${ic('globe')} Adicionar site</button>
        </div>
        <div class="link-preview" id="lsLinkPreview">${linkPreview()}</div>
      </div>
    </div>
    <footer class="sheet-foot">
      <button class="btn btn-ghost" data-adm="sheet-close">Cancelar</button>
      <button class="btn btn-primary" data-adm="sheet-save">${ic('check')} Salvar aula</button>
    </footer>`;
}
function linkPreview(){
  const d = ADM.sheet?.draft; if(!d) return '';
  const list = d.links.filter(x => safeUrl(x.url)).map(x => ({kind: x.kind === 'site' ? 'site' : 'file', label: x.label || (x.kind === 'site' ? 'Acessar site' : 'Baixar arquivo'), url: x.url}));
  return list.length ? `<span class="preview-label">Como o aluno vê</span>${resButtons(list)}` : '';
}
function saveSheet(){
  const S = ADM.sheet, c = admCourse(); if(!S || !c) return;
  const d = S.draft, title = d.title.trim();
  if(!title){ toast('Dê um título para a aula.'); $('#lsTitle').focus(); return; }
  const url = d.url.trim();
  if(url && !isVideoUrl(url)){ toast('O link do vídeo precisa ser do YouTube ou do Vimeo.'); $('#lsUrl').focus(); return; }
  const bad = d.links.find(x => (x.url || '').trim() && !safeUrl(x.url));
  if(bad){ toast('Um dos links dos botões precisa começar com https://'); return; }
  const min = parseInt(d.min, 10);
  const lesson = {title, type: url ? 'video' : 'text', url, body: d.body.trim(),
    links: d.links.filter(x => (x.url || '').trim()).map(x => ({kind: x.kind === 'site' ? 'site' : 'file', label: (x.label || '').trim(), url: x.url.trim()}))};
  if(min > 0) lesson.min = min;
  const target = +($('#lsModule')?.value ?? S.mi);
  if(S.li == null) c.modules[target].lessons.push(lesson);
  else if(target === S.mi) c.modules[S.mi].lessons[S.li] = lesson;
  else { beforeChange(c); const old = c.modules[S.mi].lessons[S.li]; c.modules[S.mi].lessons.splice(S.li, 1); c.modules[target].lessons.push(old); _snap.map.set(lesson, _snap.map.get(old)); c.modules[target].lessons[c.modules[target].lessons.length - 1] = lesson; remapProgress(c); }
  closeSheet(); admSave(S.li == null ? 'Aula adicionada!' : 'Aula salva!');
}

/* ---------------- dados do curso ---------------- */
function courseForm(c){
  return `<form class="adm-form" id="courseForm">
    <div class="form-row">
      <div><label for="cfName">Nome do curso</label><input id="cfName" value="${esc(c.name)}" required></div>
      <div><label for="cfTag">Categoria</label><input id="cfTag" value="${esc(cap(c.tag || ''))}" placeholder="Ex.: Marketing"></div>
    </div>
    <label for="cfDesc">Descrição curta</label><textarea id="cfDesc" rows="2">${esc(c.desc || '')}</textarea>
    <label for="cfLearn">O que o aluno vai aprender <small>um item por linha</small></label><textarea id="cfLearn" rows="4">${esc((c.learn || []).join('\n'))}</textarea>
    <label>Cor da capa</label>
    <div class="swatches">${COLORS.map(([v, n]) => `<label class="swatch g-${v}"><input type="radio" name="cfColor" value="${v}" ${c.color === v ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>
    <label for="cfCover">Imagem de capa <small>link, opcional — substitui a cor</small></label><input id="cfCover" value="${esc(c.coverUrl || '')}" placeholder="https://..." inputmode="url">
    <div class="sheet-block">
      <div class="sheet-block-head">${ic('lock')} <b>Venda</b><span class="muted">Usado quando o curso está bloqueado</span></div>
      <div class="form-row">
        <div><label for="cfPrice">Preço</label><input id="cfPrice" value="${esc(c.price || '')}" placeholder="Ex.: 97,00"></div>
        <div><label for="cfCheckout">Link do checkout</label><input id="cfCheckout" value="${esc(c.checkoutUrl || '')}" placeholder="https://pay..." inputmode="url"></div>
      </div>
      <label for="cfTrailer">Trailer <small>YouTube ou Vimeo</small></label><input id="cfTrailer" value="${esc(c.trailerUrl || '')}" placeholder="https://youtu.be/..." inputmode="url">
    </div>
    <div class="adm-form-foot">
      <button class="btn btn-primary" type="submit">${ic('check')} Salvar dados</button>
      <button class="btn btn-line adm-danger${ADM.confirm === 'course' ? ' confirming' : ''}" type="button" data-adm-del="course">${ic('trash')} ${ADM.confirm === 'course' ? 'Clique de novo para excluir o curso' : 'Excluir curso'}</button>
    </div>
  </form>`;
}

/* ---------------- progresso ao mover/excluir ---------------- */
// as aulas concluídas são guardadas pela posição; ao reordenar, refazemos as chaves
function snapshotKeys(c){ const m = new Map(); lessonsOf(c).forEach(x => m.set(x.l, x.k)); return m; }
let _snap = null;
function beforeChange(c){ _snap = {c, map: snapshotKeys(c), done: new Set(state.completed)}; }
function remapProgress(c){
  if(!_snap || _snap.c !== c) return;
  const prefix = c.id + '-';
  const others = state.completed.filter(k => !k.startsWith(prefix));
  const mine = lessonsOf(c).filter(x => { const old = _snap.map.get(x.l); return old && _snap.done.has(old); }).map(x => x.k);
  state.completed = [...others, ...mine];
  _snap = null;
}

/* ---------------- eventos ---------------- */
$('#adminPanel').addEventListener('click', e => {
  const b = e.target.closest('button, a'); if(!b) return;
  const d = b.dataset, c = admCourse();
  if(d.admDel == null && d.userDel == null && ADM.confirm){ ADM.confirm = null; renderAdmin(); }
  if(d.adm === 'close'){ closeAdmin(); return; }
  if(d.adm === 'export'){ exportData(); return; }
  if(d.adm === 'new-course'){
    const id = 'curso-' + Date.now();
    state.courses.push({id, name: 'Novo curso', desc: '', tag: 'NOVO TREINAMENTO', code: 'NC', color: 'green', locked: true, learn: [], modules: [{name: 'Módulo 01 — Comece aqui', lessons: []}]});
    ADM.view = 'course'; ADM.courseId = id; ADM.tab = 'dados'; admSave('Curso criado. Preencha os dados.');
    setTimeout(() => { const i = $('#cfName'); i?.focus(); i?.select(); }, 30); return;
  }
  if(d.admCourse){ ADM.view = 'course'; ADM.courseId = d.admCourse; ADM.tab = 'aulas'; ADM.confirm = null; renderAdmin(); $('#admMain').scrollTop = 0; return; }
  if(d.admTab){ ADM.tab = d.admTab; renderAdmin(); return; }
  if(d.adm === 'publish'){ saveContent().then(ok => { if(ok){ toast('Cursos salvos no banco!'); renderAdmin(); } }); return; }
  if(d.adm === 'students'){ ADM.view = 'students'; ADM.created = null; renderAdmin(); loadUsers(); return; }
  if(d.adm === 'gen-pass'){ const i = $('#nuPass'); i.value = genPass(); i.type = 'text'; i.focus(); return; }
  if(d.adm === 'copy-access'){ copyText(accessMessage(ADM.created), 'Mensagem de acesso copiada!'); return; }
  if(d.adm === 'dismiss-created'){ ADM.created = null; renderAdmin(); return; }
  if(d.userReset){ const id = +d.userReset; ADM.resetId = ADM.resetId === id ? null : id; renderAdmin(); setTimeout(() => $('#rp-' + id)?.focus(), 30); return; }
  if(d.userResetSave){ resetPassword(+d.userResetSave); return; }
  if(d.userDel){
    const key = 'user:' + d.userDel;
    if(ADM.confirm !== key){ ADM.confirm = key; renderAdmin(); return; }
    ADM.confirm = null;
    api('/admin/users/' + d.userDel, 'DELETE').then(() => { toast('Aluno removido.'); loadUsers(); }).catch(err => toast(err.message)); return;
  }
  if(!c) return;
  if(d.adm === 'toggle-lock'){ c.locked = !c.locked; admSave(c.locked ? 'Curso bloqueado (à venda).' : 'Curso liberado para os alunos.'); return; }
  if(d.adm === 'copy-link'){
    const url = location.origin + location.pathname + '?curso=' + encodeURIComponent(c.id);
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast('Link do curso copiado!')).catch(() => toast(url)); return;
  }
  if(d.adm === 'preview'){
    closeAdmin();
    if(!state.user){ toast('Entre como aluno para ver o curso.'); return; }
    location.hash = (c.locked ? '#/oferta/' : '#/curso/') + encodeURIComponent(c.id); return;
  }
  if(d.adm === 'new-module'){
    c.modules.push({name: `Módulo ${pad(c.modules.length + 1)} — Novo módulo`, lessons: []});
    admSave('Módulo criado.');
    setTimeout(() => { const all = $$('.adm-mod-name'); const i = all[all.length - 1]; i?.focus(); i?.select(); i?.scrollIntoView({block: 'center', behavior: 'smooth'}); }, 30); return;
  }
  if(d.admModMove){
    const [mi, dir] = d.admModMove.split(':').map(Number), to = mi + dir;
    if(to < 0 || to >= c.modules.length) return;
    beforeChange(c); [c.modules[mi], c.modules[to]] = [c.modules[to], c.modules[mi]]; remapProgress(c); admSave('', true); return;
  }
  if(d.admLesMove){
    const [mi, li, dir] = d.admLesMove.split(':').map(Number), arr = c.modules[mi].lessons, to = li + dir;
    if(to < 0 || to >= arr.length) return;
    beforeChange(c); [arr[li], arr[to]] = [arr[to], arr[li]]; remapProgress(c); admSave('', true); return;
  }
  if(d.admDel != null){
    if(ADM.confirm !== d.admDel){ ADM.confirm = d.admDel; renderAdmin(); return; }
    ADM.confirm = null;
    const [kind, a, bb] = d.admDel.split(':');
    if(kind === 'course'){
      state.courses = state.courses.filter(x => x !== c);
      state.completed = state.completed.filter(k => !k.startsWith(c.id + '-'));
      ADM.courseId = state.courses[0]?.id || null; ADM.tab = 'aulas'; admSave('Curso excluído.'); return;
    }
    beforeChange(c);
    if(kind === 'mod') c.modules.splice(+a, 1);
    if(kind === 'les') c.modules[+a].lessons.splice(+bb, 1);
    remapProgress(c); admSave(kind === 'mod' ? 'Módulo excluído.' : 'Aula excluída.', true); return;
  }
  if(d.admNewLesson != null){ openSheet(+d.admNewLesson, null); return; }
  if(d.admEdit){ const [mi, li] = d.admEdit.split(':').map(Number); openSheet(mi, li); return; }
  // editor de aula
  if(d.adm === 'sheet-close'){ closeSheet(); return; }
  if(d.adm === 'sheet-save'){ saveSheet(); return; }
  if(d.linkAdd){ ADM.sheet.draft.links.push({kind: d.linkAdd, label: '', url: ''}); paintSheet(); const r = $$('.link-row'); r[r.length - 1]?.querySelector('[data-link$=":label"]')?.focus(); return; }
  if(d.linkDel != null){ ADM.sheet.draft.links.splice(+d.linkDel, 1); paintSheet(); return; }
  if(d.linkKind){ const [i, k] = d.linkKind.split(':'); ADM.sheet.draft.links[+i].kind = k; paintSheet(); return; }
});
$('#adminPanel').addEventListener('input', e => {
  const t = e.target, S = ADM.sheet;
  if(S && t.dataset.draft){
    S.draft[t.dataset.draft] = t.value;
    if(t.dataset.draft === 'url'){
      const vs = videoStatus(t.value), th = ytThumb(t.value), h = $('#lsUrlHint'), p = $('#lsPreview');
      h.textContent = vs.txt; h.className = 'hint ' + vs.cls;
      p.classList.toggle('hidden', !th);
      p.innerHTML = th ? `<span class="vp-img" style="background-image:url('${esc(th)}')"></span><span>${ic('play', 'ic-fill')}</span>` : '';
    }
  }
  if(S && t.dataset.link){ const [i, f] = t.dataset.link.split(':'); S.draft.links[+i][f] = t.value; $('#lsLinkPreview').innerHTML = linkPreview(); }
});
$('#adminPanel').addEventListener('change', e => {
  const t = e.target, c = admCourse(); if(!c) return;
  if(t.dataset.admModname != null){ const v = t.value.trim(); if(v){ c.modules[+t.dataset.admModname].name = v; saveContent(); if(state.user) render(); toast('Nome do módulo salvo.'); } else t.value = c.modules[+t.dataset.admModname].name; }
});
$('#adminPanel').addEventListener('keydown', e => {
  if(e.key === 'Enter' && e.target.classList.contains('adm-mod-name')){ e.preventDefault(); e.target.blur(); }
  if(e.key === 'Escape'){ e.stopPropagation(); if(ADM.sheet) closeSheet(); else closeAdmin(); }
});
$('#adminPanel').addEventListener('submit', e => {
  if(e.target.id === 'newUserForm'){ e.preventDefault(); createStudent(); return; }
  if(e.target.id !== 'courseForm') return;
  e.preventDefault();
  const c = admCourse(), name = $('#cfName').value.trim();
  if(!name){ toast('O curso precisa de um nome.'); return; }
  Object.assign(c, {
    name, desc: $('#cfDesc').value.trim(),
    tag: ($('#cfTag').value.trim() || 'Treinamento').toLocaleUpperCase('pt-BR'),
    learn: $('#cfLearn').value.split('\n').map(x => x.trim()).filter(Boolean),
    color: ($('input[name="cfColor"]:checked') || {}).value || c.color || 'green',
    coverUrl: $('#cfCover').value.trim(), price: $('#cfPrice').value.trim(),
    checkoutUrl: $('#cfCheckout').value.trim(), trailerUrl: $('#cfTrailer').value.trim(),
    code: name.split(/\s+/).filter(Boolean).map(x => x[0]).join('').slice(0, 2).toUpperCase()
  });
  admSave('Dados do curso salvos!');
});
$('#admSheetWrap').addEventListener('click', e => { if(e.target.id === 'admSheetWrap') closeSheet(); });

/* ---------------- exportar / importar ---------------- */
function exportData(){
  const blob = new Blob([JSON.stringify({app: 'elite-academy', version: 1, exportedAt: new Date().toISOString(), courses: state.courses}, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `elite-academy-conteudo-${todayISO()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Cópia do conteúdo baixada.');
}
$('#admImport').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if(!f) return;
  try {
    const data = JSON.parse(await f.text());
    const courses = Array.isArray(data) ? data : data.courses;
    if(!Array.isArray(courses) || !courses.every(c => c && c.id && c.name && Array.isArray(c.modules))) throw new Error('formato');
    state.courses = courses; ADM.courseId = courses[0]?.id || null; ADM.tab = 'aulas';
    admSave(`Conteúdo importado: ${plural(courses.length, 'curso', 'cursos')}.`);
  } catch(err){ toast('Arquivo inválido. Use um arquivo exportado pelo Master.'); }
});

/* ---------------- alunos (só com banco de dados) ---------------- */
function genPass(){ const a = 'abcdefghjkmnpqrstuvwxyz23456789'; const r = new Uint32Array(8); crypto.getRandomValues(r); return [...r].map(x => a[x % a.length]).join(''); }
function copyText(t, ok){ (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(ok)).catch(() => toast(t)); }
function siteUrl(){ return location.origin + location.pathname; }
function accessMessage(u){ return u ? `Olá, ${u.name.split(' ')[0]}! Seu acesso à ELITE Academy está pronto.\n\nSite: ${siteUrl()}\nE-mail: ${u.email}\nSenha: ${u.password}\n\nDepois de entrar, você pode trocar a senha em Perfil.` : ''; }
function fmtDate(s){ if(!s) return 'nunca'; const d = new Date(s.replace(' ', 'T') + 'Z'); return isNaN(d) ? s : d.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'}) + ' ' + d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}); }
async function loadUsers(){
  try { const {users} = await api('/admin/users'); ADM.users = users; }
  catch(err){ ADM.users = []; toast(err.message); }
  if(ADM.view === 'students') renderAdmin();
}
function studentsView(){
  const total = state.courses.filter(c => !c.locked).reduce((a, c) => a + lessonsOf(c).length, 0);
  const created = ADM.created ? `<div class="adm-created">
      <div><span class="kicker">Aluno criado</span><p>Envie o acesso para <b>${esc(ADM.created.name)}</b>:</p>
      <pre>${esc(accessMessage(ADM.created))}</pre></div>
      <div class="adm-created-actions"><button class="btn btn-primary" data-adm="copy-access">${ic('copy')} Copiar mensagem</button><button class="btn btn-ghost" data-adm="dismiss-created">Fechar</button></div>
    </div>` : '';
  const list = ADM.users == null ? '<p class="muted">Carregando alunos...</p>'
    : ADM.users.length ? ADM.users.map(u => {
      const pct = total ? Math.min(100, Math.round(u.completed.length / total * 100)) : 0;
      const delKey = 'user:' + u.id, conf = ADM.confirm === delKey, isMe = u.email === state.user?.email;
      return `<div class="stu">
        <span class="avatar">${esc((u.name || '?').charAt(0).toUpperCase())}</span>
        <div class="stu-main"><b>${esc(u.name)} ${u.role === 'admin' ? '<span class="tag tag-ok">Master</span>' : ''}</b><small>${esc(u.email)}${u.phone ? ' · ' + esc(u.phone) : ''}</small>
          <div class="stu-meta"><span>${ic('clock')} Último acesso: ${esc(fmtDate(u.lastLogin))}</span><span>${ic('check')} ${plural(u.completed.length, 'aula concluída', 'aulas concluídas')}</span>${u.questions ? `<span>${ic('chat')} ${plural(u.questions, 'dúvida', 'dúvidas')}</span>` : ''}</div>
          <div class="bar"><i style="width:${pct}%"></i></div>
          ${ADM.resetId === u.id ? `<div class="stu-reset"><input id="rp-${u.id}" placeholder="Nova senha (mín. 6)" value="${genPass()}" aria-label="Nova senha de ${esc(u.name)}"><button class="btn btn-primary" data-user-reset-save="${u.id}">Salvar senha</button></div>` : ''}
        </div>
        <div class="adm-row-actions">
          <button class="btn btn-ghost" data-user-reset="${u.id}">${ic('lock')} Nova senha</button>
          ${isMe ? '' : `<button class="icon-btn adm-del${conf ? ' confirming' : ''}" data-user-del="${u.id}" aria-label="${conf ? 'Confirmar exclusão' : 'Remover aluno'}">${conf ? '<span>Confirmar?</span>' : ic('trash')}</button>`}
        </div>
      </div>`;
    }).join('') : '<div class="empty">Nenhum aluno ainda. Cadastre o primeiro acima.</div>';
  return `
    <div class="adm-head"><div><span class="kicker">Gestão de acessos</span><h1 class="display">Alunos</h1><p class="muted">${ADM.users ? plural(ADM.users.filter(u => u.role !== 'admin').length, 'aluno cadastrado', 'alunos cadastrados') : ''}</p></div></div>
    ${created}
    <form class="sheet-block adm-newuser" id="newUserForm" autocomplete="off">
      <div class="sheet-block-head">${ic('plus')} <b>Cadastrar aluno</b><span class="muted">Crie o acesso e envie a mensagem pronta para o aluno</span></div>
      <div class="form-row"><div><label for="nuName">Nome</label><input id="nuName" placeholder="Nome do aluno"></div><div><label for="nuEmail">E-mail</label><input id="nuEmail" type="email" inputmode="email" placeholder="aluno@email.com"></div></div>
      <div class="form-row"><div><label for="nuPhone">Telefone <small>opcional</small></label><input id="nuPhone" type="tel" placeholder="(00) 00000-0000"></div>
        <div><label for="nuPass">Senha inicial</label><div class="pass-gen"><input id="nuPass" value="${genPass()}" autocomplete="new-password"><button type="button" class="btn btn-ghost" data-adm="gen-pass" aria-label="Gerar outra senha">${ic('progress')}</button></div></div></div>
      <button class="btn btn-primary" type="submit" style="margin-top:18px">${ic('plus')} Cadastrar aluno</button>
    </form>
    <div class="stu-list">${list}</div>`;
}
async function createStudent(){
  const body = {name: $('#nuName').value.trim(), email: $('#nuEmail').value.trim(), phone: $('#nuPhone').value.trim(), password: $('#nuPass').value.trim()};
  try { await api('/admin/users', 'POST', body); ADM.created = body; toast('Aluno cadastrado!'); await loadUsers(); }
  catch(err){ toast(err.message); }
}
async function resetPassword(id){
  const v = $('#rp-' + id).value.trim();
  try {
    await api('/admin/users/' + id, 'PATCH', {password: v});
    const u = ADM.users.find(x => x.id === id); ADM.resetId = null;
    ADM.created = u ? {name: u.name, email: u.email, password: v} : null;
    toast('Senha alterada.'); renderAdmin();
  } catch(err){ toast(err.message); }
}
document.addEventListener('content-saved', () => { if(!$('#adminPanel').classList.contains('hidden') && $('.adm-banner.warn')) renderAdmin(); });
