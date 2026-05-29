/* ============ wapu tutorial — icons + screens ============ */
const I = {
  chevron:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  eye:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>',
  user:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  caret:'<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowDownRight:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M17 9v8h-8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowUpRight:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M9 7h8v8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  earn:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="9" r="3.4" stroke="currentColor" stroke-width="2"/><path d="M4 20c0-3.4 3-5 7-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 13v6M15 16h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  bolt:'<svg width="14" height="14" viewBox="0 0 24 24" fill="#ffd23f"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
  blockchain:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="9" y="2.5" width="6" height="6" rx="1.4" stroke="currentColor" stroke-width="1.8"/><rect x="2.5" y="15" width="6" height="6" rx="1.4" stroke="currentColor" stroke-width="1.8"/><rect x="15.5" y="15" width="6" height="6" rx="1.4" stroke="currentColor" stroke-width="1.8"/><path d="M12 8.5V12M12 12L5.5 15M12 12l6.5 3" stroke="currentColor" stroke-width="1.8"/></svg>',
  boltBig:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
  info:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7.6" r="1.1" fill="currentColor"/></svg>',
  check:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  checkSm:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  globe:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M3 12h18M12 3c2.6 2.4 2.6 15.6 0 18M12 3c-2.6 2.4-2.6 15.6 0 18" stroke="currentColor" stroke-width="1.4"/></svg>',
  arrowDown:'<svg width="26" height="34" viewBox="0 0 26 40" fill="none"><path d="M13 2v32M5 27l8 8 8-8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  hourglass:'<svg width="46" height="46" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h12v2H6V2zm0 18h12v2H6v-2zM7 4h10c0 4-3 5-3 8s3 4 3 8H7c0-4 3-5 3-8s-3-4-3-8z"/></svg>',
  signal:'<svg width="18" height="12" viewBox="0 0 18 12" fill="#fff"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>',
  wifi:'<svg width="16" height="12" viewBox="0 0 18 13" fill="none"><path d="M1 4.5A12 12 0 0 1 17 4.5M3.6 7.4a8 8 0 0 1 10.8 0M6.4 10.2a4 4 0 0 1 5.2 0" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="9" cy="12" r="1" fill="#fff"/></svg>',
  battery:'<svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x="1" y="1" width="21" height="11" rx="3" stroke="#fff" stroke-width="1.2" opacity=".5"/><rect x="2.6" y="2.6" width="16" height="7.8" rx="1.6" fill="#fff"/><rect x="23.4" y="4" width="2" height="5" rx="1" fill="#fff" opacity=".5"/></svg>',
  tether:'<svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M3 5h18v3.4h-6.6v2.1c3.7.2 6.5.9 6.5 1.8 0 .9-2.8 1.6-6.5 1.8v4.6H9.6v-4.6C5.9 14 3 13.2 3 12.3c0-.9 2.9-1.6 6.6-1.8V8.4H3V5zm9 7.9c3.7 0 6-.5 6-.8 0-.2-1.6-.6-4.1-.7v1.4c-.6 0-1.2 0-1.9 0s-1.3 0-1.9 0v-1.4c-2.5.1-4.1.5-4.1.7 0 .3 2.3.8 6 .8z"/></svg>',
  copy:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="8.5" y="8.5" width="11" height="11" rx="2.4" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 15.5H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h9A1.5 1.5 0 0 1 15.5 5v.5" stroke="currentColor" stroke-width="1.7"/></svg>',
};

// Argentina flag roundel (simple bands + sun dot)
const flagAR = '<span style="width:42px;height:42px;border-radius:50%;overflow:hidden;display:grid;background:#fff;flex:none;position:relative;">'
  + '<span style="position:absolute;top:0;left:0;right:0;height:33%;background:#74acdf;"></span>'
  + '<span style="position:absolute;bottom:0;left:0;right:0;height:33%;background:#74acdf;"></span>'
  + '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:9px;height:9px;border-radius:50%;background:#f6b40e;"></span></span>';

const tetherCircle = '<span style="width:42px;height:42px;border-radius:50%;background:#2bb17f;display:grid;place-items:center;flex:none;color:#fff;">'+I.tether+'</span>';

const TUTORIAL_FLOW = {
  initialBalanceUsd: '$0.00',
  finalBalanceUsd: '$360.00',
  depositSatsInput: '488136',
  depositSatsLabel: '488,136 SAT',
  depositUsdLabel: '$360.00',
  exchangeRateArs: '1400.00',
  sendArsInput: '21000',
  sendArsLabel: '21,000 ARS',
  sendUsdtLabel: '15 USDT',
};

function statusbar(){
  return `<div class="statusbar"><span>9:41</span>
    <span class="sb-icons">${I.signal}${I.wifi}${I.battery}</span></div>`;
}

/* ---------- HOME ---------- */
function homeScreen(balance){
  return `
  <div class="home-card">
    <div class="hc-top">
      <div class="logo">wap<b>u</b></div>
      <div class="avatar">${I.user}</div>
    </div>
    <div class="hc-bal-lbl">Total Balance ${I.eye}</div>
    <div class="hc-bal"><span class="amt" data-balance>${balance}</span>
      <span class="cur">USD ${I.caret}</span></div>
  </div>

  <div class="actions">
    <div class="action" data-tap="deposit"><div class="ic">${I.arrowDownRight}</div><div class="nm">Deposit</div></div>
    <div class="action" data-tap="send"><div class="ic">${I.arrowUpRight}</div><div class="nm">Send</div></div>
    <div class="action" data-tap="earn"><div class="ic">${I.earn}</div><div class="nm">Earn</div></div>
  </div>

  <div class="rate">
    <div>
      <div class="rl">Today's Exchange Rate</div>
      <div class="rtoken"><span class="tdot">T</span> USDT</div>
    </div>
    <div class="rr">
      <div class="price-row"><span class="pic"></span> $${TUTORIAL_FLOW.exchangeRateArs}</div>
      <div class="buy">Buy Price</div>
    </div>
  </div>

  <div class="home-feed">
    <div class="feed-head"><span>Recent activity</span><em>Live</em></div>
    <div class="feed-row">
      <span class="feed-token btc">BTC</span>
      <div class="feed-copy"><strong>Lightning deposit</strong><small>Ready in seconds</small></div>
      <b class="feed-amt plus">+${TUTORIAL_FLOW.depositSatsLabel}</b>
    </div>
    <div class="feed-row">
      <span class="feed-token ars">ARS</span>
      <div class="feed-copy"><strong>Fast Send route</strong><small>Bank transfer available</small></div>
      <b class="feed-amt">2h</b>
    </div>
  </div>

  <div class="home-status">
    <span>Escrow ready</span>
    <strong>Operators online</strong>
  </div>

  <div class="botnav">
    <div class="bi on">${homeIcon()}<span>Home</span></div>
    <div class="bi">${historyIcon()}<span>History</span></div>
  </div>
  <div class="fab" data-tap="fab">${I.arrowUpRight}</div>`;
}
function homeIcon(){ return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'; }
function historyIcon(){ return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'; }

/* ---------- DEPOSIT METHOD ---------- */
function depositMethodScreen(){
  return `${navHeader('Deposit')}
    <div class="h-lg" style="margin-bottom:26px;">Select a deposit<br>method</div>
    <div class="stack" style="gap:14px;">
      <div class="opt"><div class="tile">${I.blockchain}</div>
        <div><div class="o-tt">Blockchain</div><div class="o-sub">Network gas cost</div></div></div>
      <div class="opt" data-tap="bitcoin"><div class="tile">${I.boltBig}</div>
        <div><div class="o-tt">Bitcoin</div><div class="o-sub">Lightning Network cost</div></div></div>
    </div>`;
}

/* ---------- DEPOSIT BITCOIN (Send SAT) ---------- */
function sendSatScreen(){
  return `${navHeader('Deposit Bitcoin')}
    <div class="h-lg" style="text-align:center;margin:6px 0 24px;">Send SAT via<br>Lightning Network</div>
    <div class="field-label">Amount in SATs</div>
    <div class="input" data-tap="sat-field"><span data-sat class="ph">Enter amount in Satoshis</span><span class="caret" data-satcaret style="display:none;"></span></div>
    <div class="hint" style="margin:14px 2px 18px;">Equivalent in USD: <span data-usd style="color:#fff;">$0.00</span></div>
    <div class="infobox">
      <div class="inforow">${I.info}<span>Minimum deposit USD.</span></div>
      <div class="inforow">${I.info}<span>Sender wallet may apply fees.</span></div>
      <div class="inforow">${I.info}<span>1 BTC = 100,000,000 SAT</span></div>
    </div>
    <div class="spacer"></div>
    <div class="btn disabled" data-tap="sat-next" data-btn>Next</div>`;
}

/* ---------- DONE (deposit success) ---------- */
function depositDoneScreen(){
  return `<div class="nav"><div class="back"></div><div class="ntitle"></div><div class="nclose">${I.close}</div></div>
    <div class="center-col">
      <div class="h-md">Done!</div>
      <div class="badge" data-badge>${I.check}</div>
    </div>
    <div class="stack" style="gap:12px;">
      <div class="btn ghost">View Details</div>
      <div class="btn">Go Home</div>
    </div>`;
}

/* ---------- SEND METHOD (ARS speed) ---------- */
function sendMethodScreen(){
  return `${navHeader('Send')}
    <div class="h-lg" style="margin-bottom:24px;">How do you want to<br>send ARS (Argentine<br>Peso)?</div>
    <div class="stack" style="gap:14px;">
      <div class="opt sel" data-tap="fast"><div class="tile indigo">${I.arrowUpRight}</div>
        <div><div class="o-tt">${I.bolt} Fast Send (~2h)</div><div class="o-sub">0.40% of Transaction cost</div></div></div>
      <div class="opt"><div class="tile">${I.arrowUpRight}</div>
        <div><div class="o-tt">Standard Send (~24h)</div><div class="o-sub">0.20% of Transaction cost</div></div></div>
    </div>`;
}

/* ---------- TRANSFER TO ---------- */
function transferToScreen(){
  return `${navHeader('Fast Send')}
    <div class="h-lg" style="margin-bottom:24px;">To whom do you want<br>to transfer?</div>
    <div class="field-label">Receiver name</div>
    <div class="input" style="margin-bottom:20px;"><span data-rname class="ph">&nbsp;</span></div>
    <div class="field-label">Address of receiver</div>
    <div class="input"><span data-raddr class="ph">&nbsp;</span></div>
    <div class="tabs"><div class="tab on">Recent</div><div class="tab">Favorite</div></div>
    <div class="recent-row" data-tap="recent"><div class="rav">${I.user}</div><div class="rln"></div>
      <div class="rright"><div class="chk" data-rcheck></div></div></div>
    <div class="spacer"></div>
    <div class="btn" data-tap="transfer-next">Next</div>`;
}

/* ---------- SEND AMOUNT ---------- */
function sendAmountScreen(){
  return `${navHeader('Fast Send')}
    <div class="h-lg" style="margin-bottom:24px;">How much do you want<br>to send?</div>
    <div class="field-label">Amount</div>
    <div class="input err" data-tap="amt-field"><span data-amt class="ph">&nbsp;</span><span class="caret" data-amtcaret style="display:none;"></span>
      <span class="right">ARS <span style="opacity:.4;">|</span> <span class="max">Max</span></span></div>
    <div class="infobox" data-amterr style="margin-top:16px;">
      <div class="inforow warn">${I.info}<span>You have to send a minimum of $1,000 Pesos.</span></div>
    </div>
    <div class="spacer"></div>
    <div class="btn disabled" data-tap="amt-next" data-amtbtn>Next</div>`;
}

/* ---------- RECEIVE TICKET ---------- */
function ticketScreen(){
  return `${navHeader('Fast Send')}
    <div class="ticket">
      <div class="t-h">Receive amount</div>
      <div class="t-amt">${TUTORIAL_FLOW.sendArsLabel}</div>
      <div class="t-div"></div>
      <div class="trow"><span class="tk">Network</span><span class="tv">Bank transfer</span></div>
      <div class="trow"><span class="tk">Exchange ratio</span><span class="tv">1 USDT = ${TUTORIAL_FLOW.exchangeRateArs} ARS</span></div>
      <div class="trow"><span class="tk">Transaction fee</span><span class="tv">0 USDT</span></div>
      <div class="trow total"><span class="tk">Total amount</span><span class="tv">${TUTORIAL_FLOW.sendUsdtLabel}</span></div>
      <div class="t-arrow">${I.arrowDown}</div>
      <div class="t-to">To</div>
      <div class="t-recip"><div class="gl">${I.globe}</div>
        <div class="lines"><div class="ln" style="width:70px;"></div><div class="ln" style="width:130px;"></div></div></div>
      <div class="t-foot">The money will be taken from your USDT account</div>
    </div>
    <div class="spacer"></div>
    <div class="btn" data-tap="confirm">Confirm</div>`;
}

/* ---------- PROGRESS ---------- */
function progressScreen(){
  return `<div class="nav"><div class="back"></div><div class="ntitle">Fast Send</div><div class="nclose">${I.close}</div></div>
    <div class="center-col">
      <div class="h-md" style="text-align:center;">Transaction in<br>progress</div>
      <div class="spin-wrap">
        <div class="spin-ring"><svg viewBox="0 0 100 100" fill="none">
          <path d="M50 6 a44 44 0 1 1 -31 13" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
          <path d="M16 21 l4 -12 l11 6 z" fill="#fff"/></svg></div>
        <span style="color:#fff;">${I.hourglass}</span>
      </div>
      <div class="hint" style="text-align:center;color:#cfcfd4;max-width:230px;">It will take up to 2 hours to be completed</div>
    </div>
    <div class="stack" style="gap:12px;">
      <div class="btn ghost">View Details</div>
      <div class="btn">Go Home</div>
    </div>`;
}

function navHeader(title){
  return `<div class="nav"><div class="back">${I.chevron}</div><div class="ntitle">${title}</div></div>`;
}

/* ---------- SENT (completed receipt) ---------- */
function sentScreen(){
  return `<div class="nav"><div class="back"></div><div class="ntitle"></div><div class="nclose">${I.close}</div></div>
    <div class="ticket">
      <div class="t-h" style="font-size:18px;">Fast money sent</div>
      <div class="t-amt" style="margin-top:4px;">${TUTORIAL_FLOW.sendArsLabel}</div>
      <div class="t-div"></div>
      <div class="trow"><span class="tk">Date</span><span class="tv">2026-05-28 00:12:32</span></div>
      <div class="trow"><span class="tk">Status</span><span class="tv"><span class="status-pill">Completed</span></span></div>
      <div class="t-div"></div>
      <div class="t-to">To</div>
      <div class="t-recip">
        <div class="gl">${I.globe}</div>
        <div class="recip-id"><div class="rn">satoshi</div><div class="rh">mate.bitcoin.mp</div></div>
      </div>
      <div class="t-div"></div>
      <div class="trow"><span class="tk">Transaction ID</span><span class="tv tid">fc8d84c5… <span class="copy">${I.copy}</span></span></div>
      <div class="trow"><span class="tk">Transaction fee</span><span class="tv">0 USDT</span></div>
      <div class="trow total" style="margin-bottom:0;"><span class="tk">Total</span><span class="tv">${TUTORIAL_FLOW.sendUsdtLabel}</span></div>
    </div>
    <div class="spacer"></div>
    <div class="btn">View Receipt</div>`;
}

/* ---------- overlays that live on top of home ---------- */
function homeOverlays(){
  return `<div class="scrim" data-scrim></div>
    <div class="sheet" data-sheet>
      <div class="srow" data-tap="send-ars"><span class="sic">${flagAR}</span>
        <div><div class="stt">Send Local currency (ARS)</div><div class="ssub">To Argentinian bank account</div></div></div>
      <div class="srow"><span class="sic">${tetherCircle}</span>
        <div><div class="stt">Send Digital Dollar</div><div class="ssub">To Wapu user, other blockchain</div></div></div>
    </div>
    <div class="keypad" data-keypad></div>`;
}
