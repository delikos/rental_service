// ═══ STATISTICS VIEW ═══
function renderStats(){
  const now=Date.now();
  const today=new Date();
  const selMonth=document.getElementById('stats-month-sel')?.value||`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
  const [selY,selM]=selMonth.split('-').map(Number);
  const monthStart=new Date(selY,selM-1,1).getTime();
  const monthEnd=new Date(selY,selM,1).getTime();
  const tr=rentals.filter(r=>r.startTs>=monthStart&&r.startTs<monthEnd);

  const daysInMonth=new Date(selY,selM,0).getDate();
  const revByDay=Array(daysInMonth+1).fill(0);
  tr.forEach(r=>{const d=new Date(r.startTs).getDate();revByDay[d]+=(r.totalPrice+(r.finalSurcharge||0));});
  const maxRev=Math.max(...revByDay,1);
  const getDynamicPct=(day,val)=>{return val>0?Math.max(4,Math.round((val/maxRev)*100)):0;};

  const modelCounts={};
  tr.forEach(r=>r.vehicles.forEach(v=>{modelCounts[v.vmodel]=(modelCounts[v.vmodel]||0)+1;}));
  const sortedModels=Object.entries(modelCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const hourCounts=Array(24).fill(0);
  tr.forEach(r=>hourCounts[new Date(r.startTs).getHours()]++);
  const maxH=Math.max(...hourCounts,1);

  const avgDur=tr.length?Math.round(tr.reduce((s,r)=>s+r.duration,0)/tr.length):0;
  const totalRev=tr.reduce((s,r)=>s+(r.totalPrice+(r.finalSurcharge||0)),0);

  const months=[];
  for(let i=0;i<12;i++){const d=new Date(today.getFullYear(),today.getMonth()-i,1);months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);}
  const _mn=(t('monthNames')||'Styczeń|Luty|Marzec|Kwiecień|Maj|Czerwiec|Lipiec|Sierpień|Wrzesień|Październik|Listopad|Grudzień').split('|');
  const monthNames=[''].concat(_mn);

  document.getElementById('content').innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap">
      <select id="stats-month-sel" onchange="renderStats()" style="background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:7px 12px;color:var(--t1);font-family:var(--font);font-size:13px;outline:none;cursor:pointer">
        ${months.map(m=>{const[y,mo]=m.split('-');return `<option value="${m}"${m===selMonth?'selected':''}>${monthNames[+mo]} ${y}</option>`;}).join('')}
      </select>
      <span style="font-size:12px;color:var(--t2)">${tr.length} ${t('statsRentals')||'wypożyczeń'} · ${t('statsRevenue')||'Przychód'}: <b style="color:var(--acc)">${totalRev} zł</b> · ${t('statsAvgDur')||'Śr. czas'}: <b style="color:var(--t1)">${avgDur} min</b></span>
    </div>

    <div class="scard" style="margin-bottom:14px">
      <div class="slbl" style="margin-bottom:10px">${t('statsDailyRev')||'Przychód dzienny (zł)'}</div>
      <div style="display:flex;align-items:flex-end;gap:2px;height:80px">
        ${Array.from({length:daysInMonth},(_,i)=>{
          const d=i+1;const h=revByDay[d];const pct=getDynamicPct(d,h);
          return `<div style="flex:1;height:${h>0?pct+'%':'2px'};background:var(--acc);opacity:${h>0?'0.8':'0.15'};border-radius:2px 2px 0 0;transition:height .3s" title="${d}.${selM}: ${h} zł"></div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:2px;margin-top:2px">
        ${Array.from({length:daysInMonth},(_,i)=>{const d=i+1;return `<div style="flex:1;font-size:7px;color:var(--t3);text-align:center">${daysInMonth<=15||d%5===0?d:''}</div>`;}).join('')}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
      <div class="scard">
        <div class="slbl" style="margin-bottom:10px">${t('statsTopEquip')||'Najpopularniejszy sprzęt'}</div>
        ${sortedModels.length?sortedModels.map(([model,cnt],i)=>{
          const pct=Math.round((cnt/sortedModels[0][1])*100);
          return `<div style="margin-bottom:7px">
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
              <span style="font-weight:${i===0?'700':'400'}">${model==='Rower'?t('bikeLabel')||'Rower':model}</span>
              <span style="font-family:var(--mono);color:var(--acc)">${cnt}×</span>
            </div>
            <div style="height:4px;background:var(--bd);border-radius:2px;overflow:hidden">
              <div style="height:100%;background:var(--acc);width:${pct}%;border-radius:2px"></div>
            </div>
          </div>`;
        }).join(''):`<div style="color:var(--t3);font-size:12px">${t('statsNoData')||'Brak danych'}</div>`}
      </div>
      <div class="scard">
        <div class="slbl" style="margin-bottom:10px">${t('statsPeakHours')||'Godziny szczytu'}</div>
        <div style="display:flex;align-items:flex-end;gap:1px;height:60px">
          ${Array.from({length:24},(_,h)=>{
            const cnt=hourCounts[h];const pct=maxH>0?Math.round((cnt/maxH)*100):0;
            return `<div style="flex:1;height:${cnt>0?pct+'%':'2px'};background:var(--acc);opacity:${cnt>0?'0.75':'0.1'};border-radius:1px 1px 0 0" title="${h}:00 — ${cnt} wypeł."></div>`;
          }).join('')}
        </div>
        <div style="display:flex;gap:1px;margin-top:2px">
          ${Array.from({length:24},(_,h)=>`<div style="flex:1;font-size:7px;color:var(--t3);text-align:center">${h%6===0?h:''}</div>`).join('')}
        </div>
      </div>
    </div>`;
}
