(() => {
  if (location.origin !== 'https://meurh.brisanet.net.br' || !location.pathname.startsWith('/FrameHTML/web/app/RH/PortalMeuRH/')) {
    alert('Abra o Meu RH da Brisanet antes de usar este favorito.'); return;
  }
  const existing = document.getElementById('painel-ponto-local');
  if (existing) { const panel = existing.shadowRoot?.querySelector('.panel'); if (panel) panel.hidden = false; return; }
  (() => {
  'use strict';
  if (window.top !== window.self || document.getElementById('painel-ponto-local')) return;
  const KEY = 'painel-ponto-v1';
  let config;
  try { config = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { config = {}; }
  config.times ||= [];
  config.days ||= [1, 2, 3, 4, 5];
  config.attempts ||= {};
  config.logs ||= [];
  let active = false, activity = false, simulation = true, testDue = 0, armedAt = 0, lastTick = Date.now(), lastActivity = Date.now();
  const simulated = new Set();
  const host = document.createElement('div');
  host.id = 'painel-ponto-local';
  host.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483647';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host{font:14px 'Segoe UI',system-ui,sans-serif;color:#f1f6ff;color-scheme:dark}*{box-sizing:border-box}
    button,input{font:inherit}button{cursor:pointer;border:1px solid #ffffff24;border-radius:14px;padding:11px 16px;background:linear-gradient(135deg,#40d9cf30,#819aff25);color:#f6fbff;font-weight:600;transition:background .2s,transform .2s,box-shadow .2s}
    button:hover{background:linear-gradient(135deg,#40d9cf50,#819aff45);box-shadow:0 4px 18px #0002;transform:translateY(-1px)}button:active{transform:translateY(1px)}button:focus-visible,input:focus-visible{outline:2px solid #75f1dc;outline-offset:3px}
    .panel{width:min(370px,calc(100vw - 36px));max-height:78vh;overflow:auto;background:linear-gradient(145deg,#162738ed,#182039e0);backdrop-filter:blur(26px) saturate(155%);-webkit-backdrop-filter:blur(26px) saturate(155%);border:1px solid #ffffff30;border-radius:26px;padding:24px;margin-bottom:12px;box-shadow:0 24px 70px #08132350,inset 0 1px 0 #ffffff20;animation:appear .25s ease-out;scrollbar-width:thin;scrollbar-color:#95b6c950 transparent}
    .eyebrow{font-size:10px;letter-spacing:3px;font-weight:700;color:#8ce8d8;margin-bottom:7px}h2{font-size:23px;font-weight:650;letter-spacing:-.7px;margin:0 0 18px}p{line-height:1.6;color:#bed0e2}
    #clock{font-size:16px;letter-spacing:.3px;padding:16px;background:#ffffff09;border:1px solid #ffffff16;border-radius:16px;font-variant-numeric:tabular-nums}#status{display:inline-flex;align-items:center;gap:8px;font-size:11px;color:#a5f3de;background:#63dab015;border:1px solid #63dab025;border-radius:30px;padding:7px 11px;margin:12px 0}#status:before{content:'';width:6px;height:6px;border-radius:50%;background:#87e1c9;box-shadow:0 0 10px #87e1c955}
    input[type=time]{background:#ffffff0c;color:#f4faff;border:1px solid #ffffff24;border-radius:14px;padding:11px;width:145px;font-variant-numeric:tabular-nums}input[type=checkbox]{accent-color:#63e6cd;width:16px;height:16px;margin:0;flex-shrink:0}
    .row{display:flex;gap:9px;align-items:center;margin:12px 0}.row>button{flex:1}.days{display:flex;flex-wrap:wrap;gap:6px;margin:16px 0 20px}.days label{font-size:11px;padding:7px 8px;gap:5px;border:1px solid #ffffff16;border-radius:10px;background:#ffffff05}.days input{width:12px;height:12px}label{cursor:pointer;display:flex;align-items:center;gap:10px;font-size:12px;color:#d5e3f0;padding:7px 0}
    ul{padding:0;list-style:none;margin:12px 0}ul:empty:after{content:'Adicione seus horários para começar';display:block;text-align:center;padding:18px 10px;font-size:12px;color:#95aabf;border:1px dashed #ffffff20;border-radius:14px}li{display:flex;justify-content:space-between;align-items:center;margin:7px 0;padding:8px 10px 8px 16px;background:#ffffff07;border:1px solid #ffffff14;border-radius:14px}li span{font-size:19px;font-weight:600;letter-spacing:.5px}li button{font-size:11px;padding:7px 10px;background:transparent;color:#efb4c4;border-color:#efb4c420}
    #toggle{background:linear-gradient(120deg,#84f0d9,#94baff);border:0;color:#112b3a;box-shadow:0 6px 22px #65cdd220;padding:13px}#toggle:hover{box-shadow:0 8px 26px #65cdd245}#test{font-size:12px;background:#ffffff08}.small{font-size:11px;color:#9fb4c9;margin:18px 0;line-height:1.7}.log{white-space:pre-wrap;max-height:135px;overflow:auto;font-size:11px;line-height:1.7;color:#bed3e7;border-top:1px solid #ffffff13;padding-top:12px}.log:empty{display:none}
    .fab{float:right;display:flex;align-items:center;gap:10px;border-radius:22px;padding:15px 21px;background:linear-gradient(135deg,#142b3eea,#23324cdd);border:1px solid #ffffff3a;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 10px 30px #07162735,inset 0 1px 0 #ffffff20;font-size:14px;letter-spacing:.2px}.fab:hover{background:linear-gradient(135deg,#1b3e50ef,#344568e8)}.orb{display:grid;place-items:center;width:28px;height:28px;border-radius:10px;background:linear-gradient(135deg,#8af1d9,#9bbcff);color:#18333d;font-size:21px}.fab small{font-size:9px;letter-spacing:1.5px;color:#a4c9dc;display:block;text-align:left;margin-top:2px} [hidden]{display:none!important}
    @keyframes appear{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  </style><section class="panel" hidden><div class="eyebrow">MEU RH · ASSISTENTE</div><h2>Seu tempo, organizado.</h2>
  <div id="clock"></div><p id="status">Pausado</p>
  <div class="row"><input type="time" id="time" aria-label="Horário"><button id="add">Adicionar</button></div>
  <p class="small">Disparo 5 segundos após o horário · exemplo: 19:50:05</p>
  <ul id="times"></ul><div class="days" id="days"></div>
  <label><input type="checkbox" id="simulation" checked> Simulação — não bate ponto</label>
  <div class="row"><button id="test">Testar em 1 minuto</button></div>
  <div class="row"><button id="toggle">Ativar agendamento</button></div>
  <label><input type="checkbox" id="activity"> Clique neutro a cada 5 minutos</label>
  <p class="small">Horários usam o relógio e o fuso do computador. Mantenha a página de ponto aberta e o computador acordado. Ao recarregar, o painel volta pausado. Confira o registro no Meu RH: um clique enviado não comprova a batida.</p>
  <div class="log" id="log"></div></section><button class="fab" id="fab" aria-label="Meu ponto"><span class="orb">◷</span><span>Meu ponto<small>ABRIR PAINEL</small></span></button>`;
  document.body.append(host);
  const $ = id => root.getElementById(id);
  const save = () => localStorage.setItem(KEY, JSON.stringify(config));
  function log(message) {
    config.logs.unshift(`${new Date().toLocaleString('pt-BR')} — ${message}`);
    config.logs = config.logs.slice(0, 30); save(); render();
  }
  function render() {
    $('times').replaceChildren();
    for (const time of config.times) {
      const li = document.createElement('li'), text = document.createElement('span'), remove = document.createElement('button');
      text.textContent = time; remove.textContent = 'Excluir';
      remove.onclick = () => { config.times = config.times.filter(t => t !== time); save(); render(); };
      li.append(text, remove); $('times').append(li);
    }
    $('log').textContent = config.logs.join('\n');
    $('toggle').textContent = active ? 'Pausar agendamento' : 'Ativar agendamento';
    $('status').textContent = active ? (simulation ? 'SIMULAÇÃO ativa · nenhum clique no ponto' : 'Ativo · uma tentativa por horário e dia') : 'Pausado';
  }
  ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach((name, day) => {
    const label = document.createElement('label'), input = document.createElement('input');
    input.type = 'checkbox'; input.checked = config.days.includes(day);
    input.onchange = () => { config.days = input.checked ? [...new Set([...config.days, day])] : config.days.filter(d => d !== day); save(); };
    label.append(input, name); $('days').append(label);
  });
  $('fab').onclick = () => { root.querySelector('.panel').hidden = !root.querySelector('.panel').hidden; };
  $('add').onclick = () => {
    const time = $('time').value;
    if (!/^\d{2}:\d{2}$/.test(time)) return;
    config.times = [...new Set([...config.times, time])].sort(); save(); render();
  };
  $('simulation').onchange = () => {
    active = false; testDue = 0; simulation = $('simulation').checked;
    log(simulation ? 'Simulação selecionada. Nenhum clique será enviado ao ponto.' : 'Modo real selecionado. Agendamento pausado.');
  };
  $('test').onclick = () => {
    active = false; simulation = true; $('simulation').checked = true;
    testDue = Date.now() + 60000;
    log('Teste sem batida iniciado. Resultado aparecerá em 1 minuto.');
  };
  $('toggle').onclick = () => {
    testDue = 0;
    if (!active && (!config.times.length || !config.days.length)) { log('Adicione um horário e selecione os dias.'); return; }
    active = !active; armedAt = Date.now(); lastTick = Date.now();
    log(active ? 'Agendamento ativado. Apenas horários futuros serão executados.' : 'Agendamento pausado.');
  };
  $('activity').onchange = () => { activity = $('activity').checked; lastActivity = Date.now(); log(activity ? 'Clique neutro ativado; não garante renovação da sessão.' : 'Clique neutro desativado.'); };
  function tick() {
    const now = new Date(), timestamp = now.getTime();
    $('clock').textContent = now.toLocaleTimeString('pt-BR') + ' · ' + Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (active && timestamp - lastTick > 15000) {
      active = false; log('Pausado: navegador ou computador ficou suspenso. Confira os horários antes de reativar.');
    }
    lastTick = timestamp;
    const onPage = location.hash.includes('/timesheet/clockingsGeo/register');
    if (testDue && timestamp >= testDue) {
      const delay = timestamp - testDue; testDue = 0;
      const found = onPage && [...document.querySelectorAll('#btn-app-swipe-clocking-register .swipe-button')].filter(el => el.getClientRects().length).length === 1;
      log(`TESTE SEM BATIDA: temporizador disparou; atraso ${delay} ms; botão ${found ? 'encontrado' : 'não encontrado'}. Nenhum clique enviado ao ponto.`);
    }
    if (activity && onPage && timestamp - lastActivity >= 300000) {
      lastActivity = timestamp;
      const heading = document.querySelector('#tit-page-header');
      if (heading) { heading.dispatchEvent(new MouseEvent('click', { bubbles: true, view: window })); log('Clique neutro enviado ao título da página.'); }
    }
    if (!active || !config.days.includes(now.getDay())) return;
    const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    for (const time of config.times) {
      const [hours, minutes] = time.split(':').map(Number);
      const due = new Date(now); due.setHours(hours, minutes, 5, 0);
      if (due.getTime() <= armedAt || timestamp < due.getTime() || timestamp - due.getTime() > 10000) continue;
      const key = date + ' ' + time;
      if (simulation) {
        if (simulated.has(key)) continue;
        simulated.add(key);
        const found = onPage && document.querySelectorAll('#btn-app-swipe-clocking-register .swipe-button').length === 1;
        log(`${time}: SIMULAÇÃO — horário atingido; botão ${found ? 'encontrado' : 'não encontrado'}. Nenhum clique enviado ao ponto.`);
        continue;
      }
      if (config.attempts[key]) continue;
      config.attempts[key] = 'tentativa'; save();
      if (!onPage) { log(`${time}: não executado — página de ponto não está aberta.`); continue; }
      const buttons = [...document.querySelectorAll('#btn-app-swipe-clocking-register .swipe-button')].filter(el => el.getClientRects().length);
      const openDialog = [...document.querySelectorAll('[role="dialog"], .po-modal-overlay')].some(el => {
        if (!el.getClientRects().length) return false;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        return el.matches('.po-modal-overlay') || !!el.textContent.trim();
      });
      if (buttons.length !== 1 || openDialog) {
        log(`${time}: não executado — botão indisponível ou diálogo aberto.`); continue;
      }
      const button = buttons[0];
      try {
        for (let detail = 1; detail <= 2; detail++) {
          for (const type of ['mousedown', 'mouseup', 'click']) button.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, detail, button: 0 }));
        }
        button.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window, detail: 2, button: 0 }));
        log(`${time}: duplo clique enviado. Confira a confirmação no Meu RH. Sem repetição automática.`);
      } catch (error) { log(`${time}: falha ao enviar clique — ${error.message}`); }
    }
  }
  render(); tick(); setInterval(tick, 1000);
})();

  const panel = document.getElementById('painel-ponto-local')?.shadowRoot?.querySelector('.panel');
  if (panel) panel.hidden = false;
})();