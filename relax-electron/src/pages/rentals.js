// ═══ RENTALS VIEW ═══
function renderRentals(){
  const now=Date.now();
  const active=rentals.filter(r=>r.active);
  const over=active.filter(r=>getStatus(r,now)==='over').length;
  const warn=active.filter(r=>getStatus(r,now)==='warn').length;
  const ts=active.reduce((s,r)=>s+calcSurcharge(r,now),0);
  document.getElementById('content').innerHTML=`
    <div class="stats-row">
      <div class="scard"><div class="slbl">${t('slblActive')}</div><div class="sval" style="color:var(--t1)">${active.length}</div></div>
      <div class="scard"><div class="slbl">${t('slblWarn')}</div><div class="sval" style="color:var(--orange)">${warn}</div></div>
      <div class="scard"><div class="slbl">${t('slblOver')}</div><div class="sval" style="color:var(--red)">${over}</div></div>
      <div class="scard"><div class="slbl">${t('slblSur')}</div><div class="sval" style="color:var(--t1)">${ts} zł</div></div>
    </div>
    ${active.length===0
      ?`<div class="empty"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg><p>${t('activeEmpty')}</p></div>`
      :`<div class="lh"><div>${t('colClient')||'Klient'}</div><div>${t('colEquip')||'Sprzęt'}</div><div>${t('colTime')||'Czas'}</div><div>${t('colStartEnd')||'Start / Koniec'}</div><div>${t('colAmt')||'Kwota'}</div><div style="text-align:center">${t('colSur')||'Dopłata'}</div><div>${t('colActs')||'Akcje'}</div></div>
       <div class="rlist">${active.sort((a,b)=>a.startTs-b.startTs).map(r=>renderRRow(r,now)).join('')}</div>`}`;
}

function renderRRow(r,now){
  const st=getStatus(r,now);
  const sur=calcSurcharge(r,now);
  const endTs=r.startTs+r.duration*60000;
  const overMin=Math.floor((now-endTs)/60000);
  const cls=st==='over'?'over':st==='warn'?'warn':'';
  const tendCls=st==='over'?'tend-over':st==='warn'?'tend-warn':'';
  const dotCls=st==='over'?'o':st==='warn'?'w':'';
  const vHtml=r.vehicles.map(v=>`
    <div class="vitem">
      <span class="vtag ${v.vtype==='gokart'?'k':v.vtype==='rower'?'b':'c'}">${v.vtype==='gokart'?'🏎':v.vtype==='rower'?'🚲':''} ${v.vmodel==='Rower'?t('bikeLabel')||'Rower':v.vmodel}</span>
      <span style="color:var(--t3);font-size:10px">#${v.vnum}</span>
      <span style="color:var(--t2);font-size:10px">${durLabel(v.vtype,v.dur)} · ${v.price}zł</span>
    </div>`).join('');
  const oiHtml=overMin>0?`<div class="oi ${st==='over'?'oi-over':'oi-warn'}">${overMin>0?'+'+overMin+' min':''}</div>`:'';
  const durStr=durLabel((r.vehicles[0]?.vtype||'gokart'),r.duration);
  return `<div class="rrow ${cls}">
    <div class="rc">
      <div class="rname">${r.name}</div>
      <div class="rsub">${r.doctype==='Dowód osobisty'?t('docLabel'):r.doctype==='Prawo jazdy'?t('docLabelDl'):t('docLabelOther')}: ${r.docnum}</div>
      ${r.notes?`<div class="rnote">💬 ${r.notes}</div>`:''}
    </div>
    <div class="rc" style="padding-left:10px"><div class="vlist">${vHtml}</div></div>
    <div class="rc" style="align-items:center;padding:0 8px">
      <div style="font-family:var(--mono);font-size:12px;font-weight:700;text-align:center;white-space:nowrap">${durStr}</div>
    </div>
    <div class="rc" style="padding-left:10px">
      <div class="tblock">
        <div class="tentry">
          <span class="tlbl" style="color:var(--green)">${t('fromLabel')||'OD'}</span>
          <span class="thm">${fmtHM(r.startTs)}</span>
          <span class="tdate">${fmtDate(r.startTs)}</span>
        </div>
        <div class="tentry ${tendCls}">
          <span class="tlbl" style="color:${st==='over'?'var(--red)':st==='warn'?'var(--orange)':'var(--t3)'}">DO</span>
          <span class="thm">${fmtHM(endTs)}</span>
          <span class="tdate">${fmtDate(endTs)}</span>
          ${oiHtml}
        </div>
      </div>
    </div>
    <div class="rc rc-kwota"><div class="priceval">${r.totalPrice} zł</div></div>
    <div class="rc rc-dopłata">
      ${sur>0?`<div class="surval">+${sur} zł</div>`:`<div class="surval none">—</div>`}
    </div>
    <div class="rc acts">
      ${hasPerm('addRental')?`<button class="ibtn" title="${t('ttEdit')||'Edytuj'}" onclick="openEdit('${r.id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>`:''}
      ${hasPerm('endRental')?`<button class="ibtn end-btn" title="${t('ttEnd')||'Zakończ'}" onclick="quickEnd('${r.id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      </button>`:''}
      <button class="ibtn del" title="${t('ttDel')||'Usuń'}" onclick="delRental('${r.id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
      </button>
    </div>
  </div>`;
}

// ═══ NEW RENTAL ═══
let vehicleRows=[];
function openNewRental(){
  if(!hasPerm('addRental')){showNoAccess();return;}
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  const setP=(id,v)=>{const el=document.getElementById(id);if(el)el.placeholder=v;};
  const setOpt=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('modal-new-title',t('fabNew'));
  set('lbl-fn-name',t('modalName'));
  set('lbl-fn-docnum',t('modalDoc'));
  set('lbl-fn-doctype',t('docType'));
  set('lbl-fn-payment',t('payment'));
  set('lbl-fn-notes',t('notes'));
  set('lbl-btn-cancel',t('cancel'));
  set('lbl-btn-create',t('create'));
  set('lbl-vbuilder',t('equipLabel'));
  set('lbl-add-equip',t('addMore'));
  setOpt('opt-notchosen',t('notChosen'));
  setOpt('opt-cash',t('cash'));
  setOpt('opt-card',t('card'));
  setP('fn-notes',t('optional'));
  setP('fn-name',t('phName')||'Jan Kowalski lub 737 404 100');
  setP('fn-docnum',t('phDoc')||'ABC123456');
  const dt=document.getElementById('fn-doctype');
  if(dt){dt.options[0].text=t('docId');dt.options[1].text=t('docDl');dt.options[2].text=t('docOther');}
  vehicleRows=[];payMode=null;
  ['fn-name','fn-docnum','fn-notes'].forEach(id=>{const e=document.getElementById(id);if(e){e.value='';e.classList.remove('err');}});
  const cashEl=document.getElementById('fn-cash');if(cashEl)cashEl.value='';
  const chEl=document.getElementById('fn-change');if(chEl){chEl.textContent='— zł';chEl.style.color='var(--acc)';}
  document.getElementById('cash-sec').style.display='none';
  const payEl=document.getElementById('fn-payment');if(payEl)payEl.value='';
  const discEl=document.getElementById('fn-discount');if(discEl)discEl.value='0';
  addVehicleRow();openM('m-new');
}

function onPaymentChange(m){payMode=m;document.getElementById('cash-sec').style.display=m==='cash'?'block':'none';if(m==='cash')calcChange();}

function getDefaultModelForType(type){
  if(type==='gokart') return 'Maluch';
  if(type==='rower') return 'Rower';
  const fleetModels=[...new Set(FLEET.filter(f=>f.type===type).map(f=>f.model))];
  if(fleetModels.length) return fleetModels[0];
  try{
    const cp=JSON.parse(localStorage.getItem('rl2_custom_prices')||'{}');
    if(cp[type] && cp[type].length) return cp[type][0].name;
  }catch(e){}
  return type.charAt(0).toUpperCase()+type.slice(1);
}

function getDefaultDurationForType(type,model){
  if(type==='gokart') return 30;
  if(type==='rower') return 60;
  const durs=getCustomDurs(type,model);
  return durs.length ? durs[0].v : 60;
}

function calcVehiclePrice(v){
  if(v.vtype==='gokart'){return KARTS.find(k=>k.name===v.vmodel)?.p[v.dur]||0;}
  if(v.vtype==='rower'){return BIKES[v.dur]||0;}
  return getCustomPrice(v.vtype,v.vmodel,v.dur)||0;
}

function addVehicleRow(){
  const id=uid();
  vehicleRows.push({id,vtype:'gokart',vmodel:'Maluch',vnum:'',dur:30,price:calcVehiclePrice({vtype:'gokart',vmodel:'Maluch',dur:30}),confirmed:true});
  renderVehicleRows();
}

function removeVehicleRow(id){if(vehicleRows.length<=1)return;vehicleRows=vehicleRows.filter(v=>v.id!==id);renderVehicleRows();}

function isVnumAlreadyRented(vnum, vmodel){
  if(!vnum)return false;
  const fn=extractNum(vnum);
  if(fn===null)return false;
  const rentedVehicles=rentals.filter(r=>r.active).flatMap(r=>r.vehicles);
  return rentedVehicles.some(rv=>{
    if(rv.vmodel===vmodel){return extractNum(rv.vnum)===fn;}
    return false;
  });
}

function renderVehicleRows(){
  const list=document.getElementById('vehicles-list');
  list.innerHTML=vehicleRows.map((v,i)=>{
    const kartOpts=KARTS.map(k=>`<option value="${k.name}"${v.vmodel===k.name?' selected':''}>${k.name}</option>`).join('');
    const bikeOpts=`<option value="Rower"${v.vmodel==='Rower'?' selected':''}>${t('bikeType')||'Rower'}</option>`;
    const customOpts=getCustomModelOpts(v.vtype,v.vmodel);
    const modelOpts=v.vtype==='gokart'?kartOpts:v.vtype==='rower'?bikeOpts:customOpts;
    const _durs=v.vtype==='gokart'?getKartDurs():v.vtype==='rower'?getBikeDurs():getCustomDurs(v.vtype,v.vmodel);const durOpts=_durs.map(d=>`<option value="${d.v}"${v.dur==d.v?' selected':''}>${d.l}</option>`).join('');
    const showWarn=!v.confirmed;
    const vnumRented=isVnumAlreadyRented(v.vnum, v.vmodel);
    const vnumStyle=vnumRented?'border-color:var(--red)!important;background:rgba(232,64,64,.06)':'';
    return `<div class="ve-row" id="ve-${v.id}">
      ${showWarn?`<div class="vwarn">!</div>`:''}
      ${vehicleRows.length>1?`<button class="ve-remove" onclick="removeVehicleRow('${v.id}')">✕</button>`:''}
      <div class="fg3" style="margin-bottom:0;padding-right:${vehicleRows.length>1?'26px':'0'}">
        <div class="fr" style="margin-bottom:0"><label>${t('typeLabel')||'Typ'}</label>
          <select onchange="updateVRow('${v.id}','vtype',this.value)">
            <option value="gokart"${v.vtype==='gokart'?' selected':''}>${t('kartType')||'Gokart'}</option>
            <option value="rower"${v.vtype==='rower'?' selected':''}>${t('bikeType')||'Rower'}</option>
            ${getCustomTypes().map(type=>`<option value="${type}"${v.vtype===type?' selected':''}>${type.charAt(0).toUpperCase()+type.slice(1).toLowerCase()}</option>`).join('')}
          </select></div>
        <div class="fr" style="margin-bottom:0"><label>${t('modelLabel')||'Model'}</label>
          <select onchange="updateVRow('${v.id}','vmodel',this.value)">${modelOpts}</select></div>
        <div class="fr" style="margin-bottom:0"><label>${t('numVehicleLabel')||'Nr pojazdu *'}${vnumRented?' — już wypożyczony':''}</label>
          <input id="vnum-${v.id}" placeholder="1" value="${v.vnum}" style="${vnumStyle}"
            oninput="updateVnumOnly('${v.id}',this.value)"
            onblur="finishVnum('${v.id}',this.value)"
            onkeydown="if(event.key==='Enter')finishVnum('${v.id}',this.value)">
          <div id="vnum-err-${v.id}" style="color:var(--red);font-size:10px;margin-top:2px;min-height:12px"></div></div>
      </div>
      <div class="fg2" style="margin-top:6px">
        <div class="fr" style="margin-bottom:0"><label>${t('timeLabel')||'Czas'}</label>
          <select onchange="updateVRow('${v.id}','dur',this.value);checkRentalDupDurs()" id="dur-sel-${v.id}">${durOpts}</select></div>
        <div class="fr" style="margin-bottom:0"><label>${t('priceLabel')||'Cena'}</label>
          <div style="background:var(--acc-dim);border:1px solid rgba(240,122,26,.2);border-radius:var(--rsm);padding:7px 10px;font-family:var(--mono);font-size:14px;font-weight:700;color:var(--acc)">${v.price} zł</div></div>
      </div>
    </div>`;
  }).join('');
  updateDiscount();
}

function updateDiscount(){
  const pct=parseInt(document.getElementById('fn-discount')?.value||'0');
  const base=vehicleRows.reduce((s,v)=>s+v.price,0);
  const disc=Math.round(base*pct/100);
  const tot=base-disc;
  const lbl=document.getElementById('total-price-lbl');
  if(!lbl)return;
  if(base>0){
    lbl.textContent=pct>0?`${t('totalPrice')||'Łącznie'}: ${tot} zł (-${disc} zł)`:
      `${t('totalPrice')||'Łącznie'}: ${tot} zł`;
  } else {
    lbl.textContent='';
  }
}

function updateVnumOnly(id,val){
  const v=vehicleRows.find(x=>x.id===id);if(!v)return;
  v.vnum=val;
  const inp=document.getElementById('vnum-'+id);
  const errEl=document.getElementById('vnum-err-'+id);
  if(val==='/admin'){
    if(inp){inp.style.borderColor='var(--green)';inp.style.background='';}
    if(errEl)errEl.textContent='';
    return;
  }
  const rented=isVnumAlreadyRented(val,v.vmodel);
  const exists=val?FLEET.some(f=>{
    if(f.model!==v.vmodel)return false;
    if(v.vtype==='gokart'||v.vtype==='rower')return extractNum(f.num)===extractNum(val);
    return f.num===val||String(parseInt(f.num))===String(parseInt(val));
  }):true;
  if(inp){
    inp.style.borderColor=rented?'var(--red)':(!exists&&val?'var(--orange)':'');
    inp.style.background=rented?'rgba(232,64,64,.06)':(!exists&&val?'rgba(240,144,32,.06)':'');
  }
  if(errEl){
    if(rented)errEl.textContent=`${v.vmodel} nr ${val} — już wypożyczony`;
    else if(!exists&&val)errEl.textContent=`Brak ${v.vmodel} nr ${val} w bazie sprzętu`;
    else errEl.textContent='';
  }
}

function finishVnum(id,val){updateVRow(id,'vnum',val);}

function updateVRow(id,field,val){
  const v=vehicleRows.find(x=>x.id===id);
  if(!v)return;
  v[field]=field==='dur'?parseInt(val):val;
  if(field==='vtype'){
    v.vmodel=getDefaultModelForType(val);
    v.confirmed=true;
    v.dur=getDefaultDurationForType(val,v.vmodel);
    v.vnum='';
  }
  if(field==='vmodel'){
    v.confirmed=!!val;
    if(v.vtype!=='gokart' && v.vtype!=='rower'){
      v.dur=getDefaultDurationForType(v.vtype,v.vmodel);
    }
  }
  v.price=calcVehiclePrice(v);
  renderVehicleRows();
  calcChange();
}

function calcChange(){
  if(payMode!=='cash')return;
  const base=vehicleRows.reduce((s,v)=>s+v.price,0);
  const discPct=parseInt(document.getElementById('fn-discount')?.value||'0');
  const tot=Math.round(base*(100-discPct)/100);
  const cash=parseFloat(document.getElementById('fn-cash').value)||0;
  const ch=cash-tot;const el=document.getElementById('fn-change');
  if(cash>0){el.textContent=(ch>=0?''+ch.toFixed(2):'-'+Math.abs(ch).toFixed(2))+' zł';el.style.color=ch>=0?'var(--green)':'var(--red)';}
  else{el.textContent='— zł';el.style.color='var(--acc)';}
}

function hilite(id){const el=document.getElementById(id);if(!el)return;el.classList.add('err');setTimeout(()=>el.classList.remove('err'),2500);}

function addRental(){
  const ne=document.getElementById('fn-name');const de=document.getElementById('fn-docnum');
  let ok=true;
  if(!ne.value.trim()){hilite('fn-name');ok=false;}
  const looksLikePhone=/^[\d\s\+\-\(\)]{7,}$/.test(ne.value.trim());
  if(!looksLikePhone&&!de.value.trim()){hilite('fn-docnum');ok=false;}
  if(!ok)return;
  for(const v of vehicleRows){
    if(!v.vnum){const inp=document.getElementById('vnum-'+v.id);if(inp){inp.classList.add('err');setTimeout(()=>inp.classList.remove('err'),2500);}ok=false;continue;}
    if(v.vnum==='/admin')continue;
    const fn=extractNum(v.vnum);
    const fleetMatch=FLEET.find(f=>{
      if(f.model!==v.vmodel)return false;
      if(v.vtype==='gokart'||v.vtype==='rower')return extractNum(f.num)===fn;
      return String(parseInt(f.num))===String(parseInt(v.vnum))||f.num===v.vnum;
    });
    if(!fleetMatch){
      const inp=document.getElementById('vnum-'+v.id);
      if(inp){inp.style.borderColor='var(--red)';inp.title=`Brak pojazdu ${v.vmodel} nr ${v.vnum} w bazie sprzętu`;setTimeout(()=>{inp.style.borderColor='';inp.title='';},3000);}
      const errDiv=document.getElementById('vnum-err-'+v.id);
      if(errDiv)errDiv.textContent=`Brak ${v.vmodel} nr ${v.vnum} w bazie`;
      ok=false;
    }
  }
  if(!ok)return;
  const dur=vehicleRows[0].dur;
  const basePrice=vehicleRows.reduce((s,v)=>s+v.price,0);
  const discPct=parseInt(document.getElementById('fn-discount')?.value||'0');
  const tp=Math.round(basePrice*(100-discPct)/100);
  rentals.push({id:uid(),name:ne.value.trim(),doctype:document.getElementById('fn-doctype').value,docnum:de.value.trim(),vehicles:vehicleRows.map(v=>({...v})),duration:dur,totalPrice:tp,notes:document.getElementById('fn-notes').value.trim(),startTs:Date.now(),active:true,finalSurcharge:0,createdBy:currentUser.name});
  IAPI.saveRentals(rentals);closeM('m-new');renderRentals();
}

function quickEnd(id){
  if(!hasPerm('endRental')){showNoAccess();return;}
  const r=rentals.find(x=>x.id===id);if(!r)return;
  const sur=calcSurcharge(r,Date.now());
  r.active=false;r.endTs=Date.now();r.finalSurcharge=sur;
  IAPI.saveRentals(rentals);renderRentals();
}

function restoreRental(id){const r=rentals.find(x=>x.id===id);if(!r)return;r.active=true;r.endTs=undefined;r.finalSurcharge=0;IAPI.saveRentals(rentals);renderHistory();}
function delRental(id){rentals=rentals.filter(r=>r.id!==id);IAPI.saveRentals(rentals);if(currentView==='rentals')renderRentals();else renderHistory();}

// ═══ EDIT RENTAL ═══
function openEdit(id){
  const editTitleEl=document.getElementById('modal-edit-title');if(editTitleEl)editTitleEl.textContent=t('editTitle')||'Edytuj wypożyczenie';
  const r=rentals.find(x=>x.id===id);if(!r)return;
  const endTs=r.startTs+r.duration*60000;
  const pad=n=>String(n).padStart(2,'0');
  const fmtT=ts=>{const d=new Date(ts);return `${pad(d.getHours())}:${pad(d.getMinutes())}`};
  const fmtD=ts=>{const d=new Date(ts);return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`};
  const inSt='width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:7px 10px;color:var(--t1);font-family:var(--font);font-size:12px;outline:none';
  const inNum='width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:7px 10px;color:var(--t1);font-family:var(--mono);font-size:13px;font-weight:600;outline:none;text-align:center';

  function buildTimeOpts(selectedHM){
    const all=[];
    for(let h=0;h<24;h++)for(let q=0;q<4;q++){const mm=q*15;all.push(`${pad(h)}:${pad(mm)}`);}
    const now=new Date();const ch=now.getHours();const cm=Math.floor(now.getMinutes()/15)*15;
    const curKey=`${pad(ch)}:${pad(cm)}`;
    const curIdx=all.indexOf(curKey);
    const sorted=curIdx>=0?[...all.slice(curIdx),...all.slice(0,curIdx)]:all;
    return sorted.map(t=>`<option value="${t}"${t===selectedHM?' selected':''}>${t}</option>`).join('');
  }

  const startHM=fmtT(r.startTs);
  const endHM=fmtT(endTs);
  const mainType=r.vehicles.length>0?r.vehicles[0].vtype:'gokart';
  const durPresets=mainType==='gokart'
    ?[[30,'30 min'],[60,'1 godzina']]
    :[[60,'1 godzina'],[180,'3 godziny'],[1440,'Cały dzień']];

  const vE=r.vehicles.map((v,i)=>{
    const ko=KARTS.map(k=>`<option value="${k.name}_gokart"${v.vmodel===k.name?' selected':''}>${k.name} (Gokart)</option>`).join('');
    const bo=`<option value="Rower_rower"${v.vtype==='rower'?' selected':''}>Rower</option>`;
    return `<div style="background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:9px;margin-bottom:7px">
      <div style="font-size:9px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:6px">Sprzęt ${i+1}: ${v.vmodel} #${v.vnum} · ${v.price} zł</div>
      <div class="fg2">
        <div class="fr" style="margin-bottom:0"><label>Zmień model</label>
          <select id="ev-model-${i}" onchange="updEV(${i},'${id}',this.value)" style="${inSt}">
            <option value="">— bez zmiany —</option>${ko}${bo}
          </select></div>
        <div class="fr" style="margin-bottom:0"><label>Różnica w cenie</label>
          <div id="ev-diff-${i}" style="padding:7px 10px;font-family:var(--mono);font-size:13px;font-weight:600;color:var(--t3);background:var(--s3);border-radius:var(--rsm)">—</div></div>
      </div></div>`;
  }).join('');

  document.getElementById('edit-body').innerHTML=`
    <div class="fg2">
      <div class="fr"><label>Imię / Telefon</label><input id="e-name" value="${r.name}" style="${inSt}"></div>
      <div class="fr"><label>Numer dokumentu</label><input id="e-docnum" value="${r.docnum}" style="${inSt}"></div>
    </div>
    <div class="fg2">
      <div class="fr">
        <label>Start — godzina</label>
        <div style="display:flex;gap:6px">
          <select id="e-start-sel" style="${inSt};flex:1" onchange="document.getElementById('e-start-txt').value=this.value">${buildTimeOpts(startHM)}</select>
          <input id="e-start-txt" value="${startHM}" placeholder="HH:MM" style="${inSt};width:76px;flex-shrink:0" oninput="document.getElementById('e-start-sel').value=this.value">
        </div>
        <div style="font-size:10px;color:var(--t2);margin-top:3px">Data: ${fmtD(r.startTs)}</div>
      </div>
      <div class="fr">
        <label>${t('editEnd')||'Koniec — godzina'}</label>
        <div style="display:flex;gap:6px">
          <select id="e-end-sel" style="${inSt};flex:1" onchange="document.getElementById('e-end-txt').value=this.value">${buildTimeOpts(endHM)}</select>
          <input id="e-end-txt" value="${endHM}" placeholder="HH:MM" style="${inSt};width:76px;flex-shrink:0" oninput="document.getElementById('e-end-sel').value=this.value">
        </div>
        <div style="font-size:10px;color:var(--t2);margin-top:3px">Data: ${fmtD(endTs)}</div>
      </div>
    </div>
    <div class="fg2">
      <div class="fr">
        <label>${t('editDur')||'Czas wypożyczenia'}</label>
        <div style="display:flex;gap:6px">
          <select id="e-dur-sel" style="${inSt};flex:1" onchange="document.getElementById('e-dur-txt').value=this.value">
            ${durPresets.map(([v,l])=>`<option value="${v}"${r.duration===v?' selected':''}>${l}</option>`).join('')}
          </select>
          <input type="number" id="e-dur-txt" value="${r.duration}" min="1" style="${inNum};width:76px;flex-shrink:0" oninput="document.getElementById('e-dur-sel').value=this.value">
        </div>
      </div>
      <div class="fr">
        <label>${t('editPrice')||'Kwota łącznie (zł)'}</label>
        <input type="number" id="e-price" value="${r.totalPrice}" min="0" style="${inNum}">
      </div>
    </div>
    <div class="fr"><label>${t('editNotes')||'Uwagi'}</label><textarea id="e-notes" style="${inSt};resize:vertical;min-height:50px">${r.notes||''}</textarea></div>
    <div style="font-size:10px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">${t('editVehicle')||'Zmiana pojazdu'}</div>
    ${vE}
    <div class="factions">
      <button class="btn btn-g" onclick="closeM('m-edit')">Anuluj</button>
      <button class="btn btn-p" onclick="saveEdit('${id}')">Zapisz zmiany</button>
    </div>`;
  openM('m-edit');
}

function syncEditEnd(){
  const startEl=document.getElementById('e-start');
  const durEl=document.getElementById('e-duration');
  const endEl=document.getElementById('e-end');
  if(!startEl||!durEl||!endEl)return;
  const startTs=new Date(startEl.value).getTime();
  const dur=parseInt(durEl.value)||0;
  if(!isNaN(startTs)&&dur>0){
    const newEnd=new Date(startTs+dur*60000);
    const pad=n=>String(n).padStart(2,'0');
    endEl.value=`${newEnd.getFullYear()}-${pad(newEnd.getMonth()+1)}-${pad(newEnd.getDate())}T${pad(newEnd.getHours())}:${pad(newEnd.getMinutes())}`;
  }
}

function updEV(vi,rid,val){const r=rentals.find(x=>x.id===rid);if(!r)return;const v=r.vehicles[vi];const el=document.getElementById('ev-diff-'+vi);if(!val){el.textContent='—';el.style.color='var(--t3)';return;}const[nm,nt]=val.split('_');const np=nt==='gokart'?(KARTS.find(k=>k.name===nm)?.p[v.dur]||0):(BIKES[v.dur]||0);const d=np-v.price;el.textContent=(d>0?'+':'')+d+' zł';el.style.color=d>0?'var(--red)':d<0?'var(--green)':'var(--t2)';}

function saveEdit(id){
  const r=rentals.find(x=>x.id===id);if(!r)return;
  r.name=document.getElementById('e-name').value.trim();
  r.docnum=document.getElementById('e-docnum').value.trim();
  r.notes=document.getElementById('e-notes').value.trim();
  const startTxt=(document.getElementById('e-start-txt')?.value||'').trim();
  if(/^\d{1,2}:\d{2}$/.test(startTxt)){
    const [hh,mm]=startTxt.split(':').map(Number);
    const origDate=new Date(r.startTs);origDate.setHours(hh,mm,0,0);
    r.startTs=origDate.getTime();
  }
  const durTxt=parseInt(document.getElementById('e-dur-txt')?.value);
  const durSel=parseInt(document.getElementById('e-dur-sel')?.value);
  const dur=durTxt>0?durTxt:(durSel>0?durSel:r.duration);
  r.duration=dur;
  const endTxt=(document.getElementById('e-end-txt')?.value||'').trim();
  if(/^\d{1,2}:\d{2}$/.test(endTxt)){
    const [eh,em]=endTxt.split(':').map(Number);
    const eDate=new Date(r.startTs);eDate.setHours(eh,em,0,0);
    if(eDate.getTime()<r.startTs)eDate.setDate(eDate.getDate()+1);
    r.duration=Math.max(1,Math.round((eDate.getTime()-r.startTs)/60000));
  }
  const priceVal=parseFloat(document.getElementById('e-price')?.value);
  if(!isNaN(priceVal)&&priceVal>=0)r.totalPrice=priceVal;
  r.vehicles.forEach((v,i)=>{const sel=document.getElementById('ev-model-'+i);if(sel&&sel.value){const[nm,nt]=sel.value.split('_');const np=nt==='gokart'?(KARTS.find(k=>k.name===nm)?.p[v.dur]||0):(BIKES[v.dur]||0);v.vmodel=nm;v.vtype=nt;v.price=np;}});
  IAPI.saveRentals(rentals);closeM('m-edit');renderRentals();
}
