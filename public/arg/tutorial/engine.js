/* ============ wapu tutorial — timeline engine ============ */
(function(){
  const device = document.getElementById('device');
  const screensEl = document.getElementById('screens');
  const pointer = document.getElementById('pointer');
  const capWrap = document.getElementById('caption');
  const dotsWrap = document.getElementById('dots');

  // ---- screen registry ----
  const SCREENS = {
    'home':           homeScreen(TUTORIAL_FLOW.initialBalanceUsd),
    'deposit-method': depositMethodScreen(),
    'send-sat':       sendSatScreen(),
    'deposit-done':   depositDoneScreen(),
    'send-method':    sendMethodScreen(),
    'transfer-to':    transferToScreen(),
    'send-amount':    sendAmountScreen(),
    'ticket':         ticketScreen(),
    'progress':       progressScreen(),
    'sent':           sentScreen(),
  };
  const els = {};
  for(const id in SCREENS){
    const d = document.createElement('div');
    d.className = 'screen'; d.dataset.id = id; d.innerHTML = SCREENS[id];
    screensEl.appendChild(d); els[id] = d;
  }

  // ---- device-level overlays (scrim + sheet + keypad) ----
  device.insertAdjacentHTML('beforeend',
    `<div class="scrim" data-scrim></div>
     <div class="sheet" data-sheet>
       <div class="srow" data-tap="send-ars"><span class="sic">${flagAR}</span>
         <div><div class="stt">Send Local currency (ARS)</div><div class="ssub">To Argentinian bank account</div></div></div>
       <div class="srow"><span class="sic">${tetherCircle}</span>
         <div><div class="stt">Send Digital Dollar</div><div class="ssub">To Wapu user, other blockchain</div></div></div>
     </div>`);
  // keypad
  const keypad = document.createElement('div');
  keypad.className = 'keypad'; keypad.dataset.keypad = '';
  ['1','2','3','4','5','6','7','8','9','.','0','⌫'].forEach(k=>{
    const key = document.createElement('div'); key.className='key'; key.dataset.key=k; key.textContent=k; keypad.appendChild(key);
  });
  device.appendChild(keypad);

  const scrim = device.querySelector('[data-scrim]');
  const sheet = device.querySelector('[data-sheet]');
  const fadeover = document.createElement('div'); fadeover.className='fadeover'; device.appendChild(fadeover);
  function blackout(on){ fadeover.style.opacity = on ? '1' : '0'; }

  // ---- dots ----
  const DOT_N = 5;
  for(let i=0;i<DOT_N;i++){ const d=document.createElement('div'); d.className='d'; dotsWrap.appendChild(d); }
  const dotEls = [...dotsWrap.children];
  function dot(i){ dotEls.forEach((d,k)=> d.classList.toggle('on', k===i)); }

  // ---- helpers ----
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  const q = (sel,root=device)=> root.querySelector(sel);

  let current = null;
  function activate(id){
    if(current) current.classList.remove('active');
    current = els[id]; current.classList.add('active');
  }

  function cut(id){
    for(const k in els) els[k].className='screen';
    activate(id);
  }

  async function fadeTo(id){
    const next = els[id], prev = current;
    next.className = 'screen fade active'; next.style.opacity='0';
    void next.offsetWidth; next.style.opacity='1';
    if(prev && prev!==next){ prev.classList.add('fade'); prev.style.opacity='0'; }
    await wait(440);
    if(prev && prev!==next){ prev.className='screen'; prev.style.opacity=''; }
    next.className='screen active'; next.style.opacity='';
    current = next;
  }

  async function pushTo(id){
    const next = els[id], prev = current;
    next.className = 'screen active from-right';
    void next.offsetWidth;
    next.classList.add('anim'); next.classList.remove('from-right');
    if(prev && prev!==next){ prev.classList.add('anim','to-left'); }
    await wait(480);
    if(prev && prev!==next){ prev.className='screen'; }
    next.className='screen active';
    current = next;
  }

  // ---- pointer ----
  function center(el){
    const r = el.getBoundingClientRect(), d = device.getBoundingClientRect();
    const stageEl = document.getElementById('stage');
    const scale = stageEl ? stageEl.getBoundingClientRect().width / stageEl.offsetWidth : 1;
    return { x: (r.left - d.left + r.width/2) / scale, y: (r.top - d.top + r.height/2) / scale };
  }
  async function moveTo(el){
    const c = center(el);
    pointer.style.transform = `translate(${c.x-15}px, ${c.y-15}px)`;
    await wait(560);
  }
  function press(el){
    pointer.classList.add('press','tap');
    if(el){ el.classList.add('is-tapped'); }
    setTimeout(()=>{ pointer.classList.remove('press'); el && el.classList.remove('is-tapped'); },150);
    setTimeout(()=> pointer.classList.remove('tap'), 560);
  }
  async function tap(sel){
    const el = q(sel); if(!el) return;
    await moveTo(el); press(el); await wait(260);
  }

  // ---- caption ----
  let capEl=null;
  function caption(html){
    if(capEl){ capEl.classList.remove('show'); const old=capEl; setTimeout(()=>old.remove(),350); capEl=null; }
    if(!html) return;
    capEl = document.createElement('div'); capEl.className='cap'; capEl.innerHTML=html;
    capWrap.appendChild(capEl); void capEl.offsetWidth; capEl.classList.add('show');
  }

  // ---- overlays ----
  function showKeypad(on){ keypad.classList.toggle('show', on); }
  function openSheet(on){
    scrim.classList.toggle('show',on); sheet.classList.toggle('show',on);
    const fab = q('.fab');
    if(fab) fab.innerHTML = on ? I.close : I.arrowUpRight;
  }

  // ---- field typing ----
  function setField(scope, sel, caretSel, value){
    const f = q(`[data-${sel}]`, els[scope]);
    f.textContent = value; f.classList.remove('ph');
    const c = q(`[data-${caretSel}]`, els[scope]); if(c) c.style.display='inline-block';
  }
  function clearCaret(scope, caretSel){ const c=q(`[data-${caretSel}]`,els[scope]); if(c) c.style.display='none'; }

  async function typeKeypad(scope, sel, caretSel, str, onUpdate){
    let val='';
    for(const ch of str){
      await tap(`[data-key="${ch}"]`);
      val += ch;
      setField(scope, sel, caretSel, val);
      if(onUpdate) onUpdate(val);
      await wait(120);
    }
    return val;
  }

  // ---- derived updates ----
  const BTC_USD = 73750;
  function updateUsd(sats){
    const usd = (parseInt(sats||'0',10)/1e8)*BTC_USD;
    q('[data-usd]', els['send-sat']).textContent = '$'+usd.toFixed(2);
  }
  function updateAmtState(val){
    const n = parseInt(val||'0',10);
    const box = q('[data-amterr]', els['send-amount']);
    const inp = q('.input', els['send-amount']);
    const btn = q('[data-amtbtn]', els['send-amount']);
    if(n>=1000){ box.style.display='none'; inp.classList.remove('err'); btn.classList.remove('disabled'); }
    else { box.style.display=''; inp.classList.add('err'); btn.classList.add('disabled'); }
  }
  function enableBtn(sel){ const b=q(sel); if(b) b.classList.remove('disabled'); }
  function setBalance(v){ const b=q('[data-balance]', els['home']); if(b) b.textContent=v; }
  function badgePulse(){ const b=q('[data-badge]', els['deposit-done']); if(b){ b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); } }
  function fillTransfer(){
    const t = els['transfer-to'];
    const nm=q('[data-rname]',t); nm.textContent='satoshi'; nm.classList.remove('ph');
    const ad=q('[data-raddr]',t); ad.textContent='mate.bitcoin.mp'; ad.classList.remove('ph');
    const ck=q('[data-rcheck]',t); ck.innerHTML=I.checkSm;
  }

  // ---- reset to start ----
  function reset(){
    showKeypad(false); openSheet(false);
    setBalance(TUTORIAL_FLOW.initialBalanceUsd);
    // reset sat screen
    const s=els['send-sat']; const sf=q('[data-sat]',s); sf.textContent='Enter amount in Satoshis'; sf.classList.add('ph'); clearCaret('send-sat','satcaret');
    q('[data-usd]',s).textContent='$0.00'; q('[data-btn]',s).classList.add('disabled');
    // reset amount screen
    const a=els['send-amount']; const af=q('[data-amt]',a); af.innerHTML='&nbsp;'; af.classList.add('ph'); clearCaret('send-amount','amtcaret');
    q('[data-amterr]',a).style.display=''; q('.input',a).classList.add('err'); q('[data-amtbtn]',a).classList.add('disabled');
    // reset transfer
    const t=els['transfer-to']; const nm=q('[data-rname]',t); nm.innerHTML='&nbsp;'; nm.classList.add('ph');
    const ad=q('[data-raddr]',t); ad.innerHTML='&nbsp;'; ad.classList.add('ph'); q('[data-rcheck]',t).innerHTML='';
    pointer.style.transition='none'; pointer.style.transform='translate(200px,500px)';
    void pointer.offsetWidth; pointer.style.transition='';
    caption('');
    cut('home');
    blackout(false);
  }

  // ---- the tutorial timeline ----
  async function run(){
    reset();
    await wait(700);
    dot(0); caption('Tu billetera <b>wapu</b>');
    await wait(1500);

    await tap('[data-tap="deposit"]');
    await pushTo('deposit-method');
    caption('Elige cómo depositar');
    await wait(1300);

    await tap('[data-tap="bitcoin"]');
    await pushTo('send-sat');
    caption('Deposita BTC por <b>Lightning</b>');
    await wait(1100);

    await tap('[data-tap="sat-field"]');
    setField('send-sat','sat','satcaret','');
    showKeypad(true); await wait(650);
    await typeKeypad('send-sat','sat','satcaret', TUTORIAL_FLOW.depositSatsInput, updateUsd);
    await wait(550); showKeypad(false); clearCaret('send-sat','satcaret');
    await wait(350); enableBtn('[data-btn]');
    caption(`${TUTORIAL_FLOW.depositSatsLabel} ≈ <b>${TUTORIAL_FLOW.depositUsdLabel}</b>`);
    await wait(900);
    await tap('[data-tap="sat-next"]');
    await fadeTo('deposit-done'); badgePulse();
    dot(1); caption('¡Depósito realizado!');
    await wait(2000);

    setBalance(TUTORIAL_FLOW.finalBalanceUsd);
    await fadeTo('home');
    caption('Saldo actualizado');
    await wait(1300);
    await tap('[data-tap="fab"]');
    openSheet(true); caption('Ahora, envía dinero');
    await wait(1300);

    await tap('[data-tap="send-ars"]');
    openSheet(false);
    await pushTo('send-method');
    dot(2); caption('Elige la velocidad');
    await wait(1300);
    await tap('[data-tap="fast"]');
    await pushTo('transfer-to');
    caption('¿A quién le envías?');
    await wait(1100);
    await tap('[data-tap="recent"]');
    fillTransfer();
    await wait(900);
    await tap('[data-tap="transfer-next"]');
    await pushTo('send-amount');
    dot(3); caption('Indica el monto');
    await wait(800);
    await tap('[data-tap="amt-field"]');
    setField('send-amount','amt','amtcaret','');
    showKeypad(true); await wait(650);
    await typeKeypad('send-amount','amt','amtcaret', TUTORIAL_FLOW.sendArsInput, updateAmtState);
    await wait(550); showKeypad(false); clearCaret('send-amount','amtcaret');
    await wait(350);
    await tap('[data-tap="amt-next"]');
    await pushTo('ticket');
    dot(4); caption('Revisa los detalles');
    await wait(2000);
    await tap('[data-tap="confirm"]');
    await fadeTo('progress');
    caption('Procesando el envío…');
    await wait(2300);
    await fadeTo('sent');
    caption('¡Envío completado!');
    await wait(2900);
    caption('');
    await wait(500);
    blackout(true);
    await wait(520);
  }

  async function loop(){ /* eslint-disable no-constant-condition */ while(true){ await run(); } }

  // ---- fit / scale stage to viewport ----
  const stage = document.getElementById('stage');
  function fit(){
    const pad = 0;
    const sw = stage.offsetWidth, sh = stage.offsetHeight;
    const k = Math.min((innerWidth-pad)/sw, (innerHeight-pad)/sh, 1.35);
    stage.style.transform = `scale(${k})`;
  }
  addEventListener('resize', fit);
  addEventListener('load', fit);
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(fit); }

  // ---- start ----
  cut('home');
  fit();
  setTimeout(()=>{ fit(); loop(); }, 60);
})();
