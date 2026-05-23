// ═══ EQUIPMENT STATUS VIEW ═══
function renderAvail(searchVnum, filterType){
  const rentedVehicles=rentals.filter(r=>r.active).flatMap(r=>r.vehicles);
  const groups={};
  FLEET.forEach(v=>{
    if(!groups[v.model]) groups[v.model]={type:v.type,total:0,nums:[],isRower:v.model==='Rower'};
    groups[v.model].total++;
    const isRented=isFleetVehicleRented(v, rentedVehicles);
    groups[v.model].nums.push({num:v.num,rented:isRented});
  });
  const ta=FLEET.length;
  const tr=FLEET.filter(v=>isFleetVehicleRented(v,rentedVehicles)).length;
  const tf=ta-tr;

  const allTypes=['', 'gokart', 'rower', ...new Set(FLEET.filter(f=>f.type!=='gokart'&&f.type!=='rower').map(f=>f.type))];
  const typeLabels={'':t('availAll')||'Wszystkie','gokart':t('kartType')||'Gokarty','rower':t('bikeType')||'Rowery'};
  const filterSel=allTypes.map(tp=>`<option value="${tp}"${filterType===tp?'selected':''}>${typeLabels[tp]||tp.charAt(0).toUpperCase()+tp.slice(1)}</option>`).join('');

  const filteredGroups=filterType?Object.fromEntries(Object.entries(groups).filter(([,g])=>g.type===filterType)):groups;

  let searchResult='';
  if(searchVnum && searchVnum.trim()){
    const sv=searchVnum.trim().toUpperCase();
    const activeRentals=rentals.filter(r=>r.active);
    const found=[];
    activeRentals.forEach(r=>{r.vehicles.forEach(v=>{if(v.vnum.toUpperCase()===sv)found.push({r,v});});});
    if(found.length>0){
      const now=Date.now();
      searchResult=found.map(({r,v})=>{
        const endTs=r.startTs+r.duration*60000;
        const sur=calcSurcharge(r,now);
        const st=getStatus(r,now);
        const tc=st==='over'?'var(--red)':st==='warn'?'var(--orange)':'var(--acc)';
        return `<div class="vt-detail" style="margin-bottom:16px;border:1px solid var(--acc)">
          <div style="font-size:12px;font-weight:700;color:var(--acc);margin-bottom:10px">${t('availFound')||'Znaleziono'}: ${v.vnum} — ${v.vmodel==='Rower'?t('bikeLabel')||'Rower':v.vmodel}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:11px">
            <div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:3px">${t('searchClient')||'Klient'}</div><b>${r.name}</b></div>
            <div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:3px">${t('searchDoc')||'Dokument'}</div>${r.doctype==='Dowód osobisty'?t('docLabel'):r.doctype==='Prawo jazdy'?t('docLabelDl'):t('docLabelOther')}: ${r.docnum}</div>
            <div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:3px">${t('searchStart')||'Start'}</div><span style="font-family:var(--mono);font-size:18px;font-weight:600;color:var(--green)">${fmtHM(r.startTs)}</span> ${fmtDate(r.startTs)}</div>
            <div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:3px">${t('searchReturn')||'Planowany powrót'}</div><span style="font-family:var(--mono);font-size:18px;font-weight:600;color:${tc}">${fmtHM(endTs)}</span> ${fmtDate(endTs)}</div>
          </div>
          ${sur>0?`<div style="margin-top:10px;background:rgba(232,64,64,.1);border:1px solid rgba(232,64,64,.2);border-radius:6px;padding:8px;font-size:11px">${t('searchSurcharge')||'Dopłata'}: <span style="font-family:var(--mono);font-weight:700;color:var(--red)">+${sur} zł</span></div>`:''}
        </div>`;
      }).join('');
    } else {
      const freeItem=FLEET.find(f=>f.num.toUpperCase()===sv);
      searchResult=freeItem
        ?`<div class="vt-detail" style="margin-bottom:16px"><div style="color:var(--green);font-size:13px;font-weight:600">✓ ${sv} ${t('trackerAvail')||'jest dostępny'}</div></div>`
        :`<div class="vt-detail" style="margin-bottom:16px"><div style="color:var(--t3);font-size:12px">${t('trackerNotFound')||'Nie znaleziono pojazdu'}: ${sv}</div></div>`;
    }
  }

  document.getElementById('content').innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="scard" style="padding:13px 15px;display:inline-flex;flex-direction:column;min-width:110px">
        <div class="slbl">${t('availTotal')||'Ogółem'}</div><div class="sval">${ta}</div>
      </div>
      <div class="scard" style="padding:13px 15px;display:inline-flex;flex-direction:column;min-width:130px">
        <div class="slbl">${t('availRented')||'Wypożyczonych'}</div><div class="sval" style="color:var(--orange)">${tr}</div>
      </div>
      <div class="scard" style="padding:13px 15px;display:inline-flex;flex-direction:column;min-width:120px">
        <div class="slbl">${t('availFree')||'Dostępnych'}</div><div class="sval" style="color:var(--green)">${tf}</div>
      </div>
      <div style="margin-left:auto;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <select onchange="renderAvail('${searchVnum||''}',this.value)" style="height:30px;padding:0 8px;border-radius:var(--rsm);border:1px solid var(--bd);background:var(--s2);color:var(--t1);font-family:var(--font);font-size:11px;outline:none;cursor:pointer">${filterSel}</select>
        <input class="search-vnum" id="avail-search" placeholder="${t('availSearch')||'Szukaj nr. pojazdu...'}" value="${searchVnum||''}"
          oninput="renderAvail(this.value,'${filterType||''}')" style="width:180px">
        ${searchVnum?`<button onclick="renderAvail('','${filterType||''}')" style="height:30px;padding:0 10px;border-radius:var(--rsm);border:1px solid var(--bd);background:var(--s2);color:var(--t2);cursor:pointer;font-size:11px">✕</button>`:''}
      </div>
    </div>
    ${searchResult}
    <div class="avail-grid">
    ${Object.entries(filteredGroups).map(([model,g],idx)=>{
      const rentedCount=g.nums.filter(n=>n.rented).length;
      const free=g.total-rentedCount;
      const pct=g.total>0?Math.round((free/g.total)*100):0;
      const cls=free===0?'none':'ok';
      const fc=free===0?'var(--red)':'var(--green)';
      const rentedNums=g.nums.filter(n=>n.rented).map(n=>n.num.replace(/^[A-Z]+-0*/,''));
      const availNums=g.nums.filter(n=>!n.rented).map(n=>n.num.replace(/^[A-Z]+-0*/,''));
      return `<div class="acard">
        <div class="acard-name">${g.type==='gokart'?'🏎️':g.type==='rower'?'🚲':''} ${model==='Rower'?t('bikeLabel')||'Rower':model}</div>
        <div class="arow"><span>${t('availTotal')||'Ogółem'}</span><span class="num">${g.total}</span></div>
        <div class="arow">
          <span>${t('availRented')||'Wypożyczone'}</span>
          <span class="num" style="color:var(--orange)">${rentedCount}</span>
        </div>
        <div class="arow"><span>${t('availFree')||'Dostępne'}</span><span class="num ${cls}">${free}</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:8px">
          ${availNums.map(n=>`<span style="font-family:var(--mono);font-size:9px;padding:2px 5px;border-radius:3px;background:rgba(40,199,122,.1);color:var(--green)">${n}</span>`).join('')}${rentedNums.map(n=>`<span style="font-family:var(--mono);font-size:9px;padding:2px 5px;border-radius:3px;background:rgba(128,128,128,.12);color:var(--t3)">${n}</span>`).join('')}
        </div>
        <div class="abar"><div class="afill" style="width:${pct}%;background:${fc}"></div></div>
      </div>`;
    }).join('')}</div>`;
}

// ═══ VEHICLE TRACKER ═══
function openTracker(){
  if(!hasPerm('viewTracker')){showNoAccess();return;}
  const el=document.getElementById('modal-tracker-title');
  if(el)el.textContent=t('fabTracker')||'Śledzenie pojazdów';
  renderTracker(null,'');openM('m-tracker');
}

function renderTracker(selId,filterModel){
  const now=Date.now();
  const items=[];
  rentals.filter(r=>r.active).forEach(r=>{const endTs=r.startTs+r.duration*60000;r.vehicles.forEach(v=>{items.push({r,v,endTs,key:r.id+'_'+v.vnum});});});
  items.sort((a,b)=>a.endTs-b.endTs);

  let ddOpts=`<option value="">${t('trackerAll')||'—— wybierz pojazd ——'}</option>`;
  ddOpts+=`<optgroup label="── ${t('trackerGokarty')||'Gokarty'} ──">`;
  KARTS.forEach(k=>{
    const cnt=items.filter(x=>x.v.vmodel===k.name).length;
    ddOpts+=`<option value="model:${k.name}"${filterModel===('model:'+k.name)?'selected':''}>${k.name}${cnt>0?' ('+cnt+')':''}</option>`;
  });
  ddOpts+=`</optgroup>`;
  const bikeCount=items.filter(x=>x.v.vtype==='rower').length;
  ddOpts+=`<optgroup label="── ${t('trackerRowery')||'Rowery'} ──"><option value="type:rower"${filterModel==='type:rower'?'selected':''}>${t('bikeLabel')||'Rowery'}${bikeCount>0?' ('+bikeCount+')':''}</option></optgroup>`;
  const customTypes=[...new Set(FLEET.filter(f=>f.type!=='gokart'&&f.type!=='rower').map(f=>f.type))];
  customTypes.forEach(type=>{
    const typeLabel=type.charAt(0).toUpperCase()+type.slice(1);
    const typeModels=[...new Set(FLEET.filter(f=>f.type===type).map(f=>f.model))];
    ddOpts+=`<optgroup label="── ${typeLabel} ──">`;
    typeModels.forEach(model=>{
      const cnt=items.filter(x=>x.v.vmodel===model).length;
      ddOpts+=`<option value="model:${model}"${filterModel===('model:'+model)?'selected':''}>${model}${cnt>0?' ('+cnt+')':''}</option>`;
    });
    ddOpts+=`</optgroup>`;
  });

  const filt=filterModel
    ? (filterModel.startsWith('model:')
        ? items.filter(x=>x.v.vmodel===filterModel.slice(6))
        : items.filter(x=>x.v.vtype===filterModel.slice(5)))
    : items;

  const rows=filt.length>0 ? filt.map(({r,v,endTs,key})=>{
    const st=getStatus(r,now);const tc=st==='over'?'var(--red)':st==='warn'?'var(--orange)':'var(--acc)';
    const ovm=Math.round((now-endTs)/60000);
    const tl=ovm>0?'+'+ovm+'m':ovm<-59?`za ${Math.round(-ovm/60)}h ${(-ovm)%60}m`:`za ${-ovm}m`;
    const isSel=selId===key;
    return `<div class="vt-row${isSel?' sel':''}" onclick="renderTracker('${key}','${filterModel||''}')">
      <div class="vt-num">${v.vnum}</div>
      <div><span class="vtag ${v.vtype==='gokart'?'k':'b'}">${v.vmodel}</span> · ${r.name}</div>
      <div style="text-align:right"><div class="vt-time" style="color:${tc}">${fmtHM(endTs)}</div><div style="font-size:9px;color:${tc};font-family:var(--mono)">${tl}</div></div>
    </div>`;
  }).join('') : `<div style="color:var(--t3);font-size:12px;padding:16px 0;text-align:center">Brak wypożyczeń tej kategorii</div>`;

  let det='';
  if(selId){
    const item=items.find(x=>x.key===selId);
    if(item){const sur=calcSurcharge(item.r,now);const st=getStatus(item.r,now);const tc=st==='over'?'var(--red)':st==='warn'?'var(--orange)':'var(--acc)';
      det=`<div class="vt-detail"><div style="font-size:11px;font-weight:700;color:var(--acc);margin-bottom:10px">Szczegóły: ${item.v.vnum} — ${item.v.vmodel}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
          <div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:3px">${t('searchClient')||'Klient'}</div><b>${item.r.name}</b></div>
          <div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:3px">${t('searchDoc')||'Dokument'}</div>${item.r.doctype}: ${item.r.docnum}</div>
          <div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:3px">${t('searchStart')||'Start'}</div><span style="font-family:var(--mono);font-size:16px;font-weight:600;color:var(--green)">${fmtHM(item.r.startTs)}</span></div>
          <div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:3px">Powrót</div><span style="font-family:var(--mono);font-size:16px;font-weight:600;color:${tc}">${fmtHM(item.endTs)}</span></div>
        </div>
        ${sur>0?`<div style="margin-top:10px;background:rgba(232,64,64,.1);border:1px solid rgba(232,64,64,.2);border-radius:6px;padding:8px;font-size:11px">Dopłata: <span style="font-family:var(--mono);font-weight:700;color:var(--red)">+${sur} zł</span></div>`:''}</div>`;
    }
  }
  document.getElementById('tracker-body').innerHTML=`
    <div class="fr" style="margin-bottom:10px"><label>${t('trackerFilter')||'Filtruj według kategorii'}</label>
      <select onchange="renderTracker(null,this.value)" style="background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:8px 10px;color:var(--t1);font-family:var(--font);font-size:12px;width:100%;outline:none">${ddOpts}</select>
    </div>
    ${filterModel?`<div style="font-size:10px;color:var(--t2);margin-bottom:8px">Posortowane wg najszybszego powrotu.</div><div class="vt-grid">${rows}</div>`:''}
    ${det}`;
}
