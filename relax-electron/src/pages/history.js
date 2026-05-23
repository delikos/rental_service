// ═══ HISTORY VIEW ═══
function renderHistory(){
  const done=rentals.filter(r=>!r.active).sort((a,b)=>b.endTs-a.endTs);
  if(!done.length){document.getElementById('content').innerHTML=`<div class="empty"><p>${t('histEmpty')}</p></div>`;return;}
  document.getElementById('content').innerHTML=`
    <div class="lh"><div>${t('colClient')||'Klient'}</div><div>${t('colEquip')||'Sprzęt'}</div><div>${t('colTime')||'Czas'}</div><div>${t('colStartEnd')||'Start / Koniec'}</div><div>${t('colAmt')||'Kwota'}</div><div>${t('colSur')||'Dopłata'}</div><div>${t('colActs')||'Akcje'}</div></div>
    <div class="rlist">${done.map(r=>{
      const et=r.endTs||r.startTs+r.duration*60000;const sur=r.finalSurcharge||0;
      const vHtml=r.vehicles.map(v=>`<div class="vitem"><span class="vtag ${v.vtype==='gokart'?'k':v.vtype==='rower'?'b':'c'}">${v.vtype==='gokart'?'🏎':v.vtype==='rower'?'🚲':''} ${v.vmodel==='Rower'?t('bikeLabel')||'Rower':v.vmodel}</span><span style="color:var(--t3);font-size:10px">#${v.vnum}</span></div>`).join('');
      return `<div class="rrow" style="opacity:.7">
        <div class="rc"><div class="rname">${r.name}</div><div class="rsub">${r.doctype==='Dowód osobisty'?t('docLabel'):r.doctype==='Prawo jazdy'?t('docLabelDl'):t('docLabelOther')}: ${r.docnum}</div></div>
        <div class="rc" style="padding-left:10px"><div class="vlist">${vHtml}</div></div>
        <div class="rc" style="align-items:center;padding:0 8px"><div style="font-family:var(--mono);font-size:12px;font-weight:700;white-space:nowrap">${durLabel((r.vehicles[0]?.vtype||'gokart'),r.duration)}</div></div>
        <div class="rc" style="padding-left:10px">
          <div class="tblock">
            <div class="tentry"><span class="tlbl" style="color:var(--green)">${t('fromLabel')||'OD'}</span><span class="thm" style="font-size:16px">${fmtHM(r.startTs)}</span><span class="tdate">${fmtDate(r.startTs)}</span></div>
            <div class="tentry"><span class="tlbl" style="color:var(--t3)">${t('toLabel')||'DO'}</span><span class="thm" style="font-size:16px">${fmtHM(et)}</span><span class="tdate">${fmtDate(et)}</span></div>
          </div>
        </div>
        <div class="rc" style="align-items:center;padding:0 10px"><div class="priceval">${r.totalPrice} zł</div></div>
        <div class="rc" style="align-items:center;padding:0 10px">${sur>0?`<div class="surval">+${sur} zł</div>`:`<div class="surval none">—</div>`}</div>
        <div class="rc acts">
          <button class="ibtn end-btn" title="${t('ttRestore')||'Przywróć'}" onclick="restoreRental('${r.id}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          </button>
          <button class="ibtn del" title="${t('ttDel')||'Usuń'}" onclick="delRental('${r.id}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>
      </div>`;
    }).join('')}</div>`;
}
