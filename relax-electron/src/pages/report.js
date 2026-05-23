// ═══ DAILY REPORT ═══
function openReport(){
  if(!hasPerm('viewReport')){showNoAccess();return;}
  const el=document.getElementById('modal-report-title');
  if(el)el.textContent=t('fabReport')||'Raport dzienny';
  openM('m-report');renderReport();
}

function toggleReportCat(type,label,checked){
  let cats;try{const r=localStorage.getItem('rl2_report_categories');cats=r?JSON.parse(r):null;}catch(e){cats=null;}
  const allTypes=[{type:'gokart',label:'Gokarty'},{type:'rower',label:'Rowery'},...getCustomTypes().filter(x=>x!=='gokart'&&x!=='rower').map(tp=>{return{type:tp,label:tp.charAt(0).toUpperCase()+tp.slice(1)}})];
  if(!cats)cats=[...allTypes];
  if(checked){if(!cats.some(c=>c.type===type))cats.push({type,label});}
  else{cats=cats.filter(c=>c.type!==type);}
  try{localStorage.setItem('rl2_report_categories',JSON.stringify(cats));}catch(e){}
}

function togglePdfField(key,checked){
  let saved;try{const r=localStorage.getItem('rl2_pdf_fields');saved=r?JSON.parse(r):null;}catch(e){saved=null;}
  const allKeys=['pdf_rentals','pdf_per_equip','pdf_revenue','pdf_surcharge','pdf_top_model','pdf_avg_dur','pdf_peak_hour'];
  if(!saved)saved=[...allKeys];
  if(checked){if(!saved.includes(key))saved.push(key);}
  else{saved=saved.filter(k=>k!==key);}
  try{localStorage.setItem('rl2_pdf_fields',JSON.stringify(saved));}catch(e){}
  const btn=document.getElementById('pdf-export-btn');
  if(btn){const hasAny=saved.length>0;btn.style.background=hasAny?'var(--acc)':'var(--s4)';btn.style.color=hasAny?'#fff':'var(--t3)';btn.style.cursor=hasAny?'pointer':'not-allowed';btn.onclick=hasAny?exportReportPDF:null;}
  const cb=document.getElementById('csv-export-btn');if(cb){cb.style.background=saved.length>0?'var(--acc)':'var(--s4)';cb.style.color=saved.length>0?'#fff':'var(--t3)';cb.style.cursor=saved.length>0?'pointer':'not-allowed';cb.onclick=saved.length>0?exportReportCSV:null;}
  const xb=document.getElementById('xlsx-export-btn');if(xb){xb.style.background=saved.length>0?'var(--acc)':'var(--s4)';xb.style.color=saved.length>0?'#fff':'var(--t3)';xb.style.cursor=saved.length>0?'pointer':'not-allowed';xb.onclick=saved.length>0?exportReportXLSX:null;}
}

function buildReportData(){
  const today=new Date();
  const ds=new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime();
  const tr=rentals.filter(r=>r.startTs>=ds);
  const tot=tr.length;
  const totalRev=tr.reduce((s,r)=>s+r.totalPrice,0);
  const totalSur=tr.reduce((s,r)=>s+(r.finalSurcharge||0),0);
  const avgDurMins=tr.length?Math.round(tr.reduce((s,r)=>s+r.duration,0)/tr.length):0;
  const fmtD=m=>{if(m>=1440)return 'Cały dzień';if(m>=60)return Math.floor(m/60)+'h '+(m%60?m%60+'min':'');return m+' min';};
  const hourCounts=Array(24).fill(0);
  tr.forEach(r=>hourCounts[new Date(r.startTs).getHours()]++);
  const peakHour=hourCounts.indexOf(Math.max(...hourCounts));
  const modelCounts={};
  tr.forEach(r=>r.vehicles.forEach(v=>{modelCounts[v.vmodel]=(modelCounts[v.vmodel]||0)+1;}));
  const topModel=Object.entries(modelCounts).sort((a,b)=>b[1]-a[1])[0];
  const fleetModels=[...new Set(FLEET.map(f=>f.model))];
  const perEquip=fleetModels.map(model=>{return{model,cnt:tr.reduce((s,r)=>s+r.vehicles.filter(v=>v.vmodel===model).length,0)}}).sort((a,b)=>b.cnt-a.cnt);
  let fields;try{const r=localStorage.getItem('rl2_pdf_fields');fields=r?JSON.parse(r):null;}catch(e){fields=null;}
  if(!fields)fields=['pdf_rentals','pdf_per_equip','pdf_revenue','pdf_surcharge','pdf_top_model','pdf_avg_dur','pdf_peak_hour'];
  const rows=[];
  if(fields.includes('pdf_rentals'))rows.push(['Ilość wypożyczeń',tot]);
  if(fields.includes('pdf_revenue'))rows.push(['Łączny przychód',totalRev+' zł']);
  if(fields.includes('pdf_surcharge'))rows.push(['Łączne dopłaty',totalSur+' zł']);
  if(fields.includes('pdf_avg_dur'))rows.push(['Średni czas',fmtD(avgDurMins)]);
  if(fields.includes('pdf_peak_hour'))rows.push(['Godzina szczytu',peakHour+':00–'+(peakHour+1)+':00']);
  if(fields.includes('pdf_top_model'))rows.push(['Najczęściej wypożyczany model',topModel?topModel[0]+' ('+topModel[1]+')':'—']);
  if(fields.includes('pdf_per_equip')&&perEquip.length){rows.push(['Wypożyczenia według sprzętu','']);perEquip.forEach(e=>rows.push(['- '+e.model,e.cnt]));}
  return rows;
}

async function exportReportPDF(){
  let fields;try{const r=localStorage.getItem('rl2_pdf_fields');fields=r?JSON.parse(r):null;}catch(e){fields=null;}
  if(!fields)fields=['pdf_rentals','pdf_per_equip','pdf_revenue','pdf_surcharge','pdf_top_model','pdf_avg_dur','pdf_peak_hour'];
  if(!fields.length)return;
  const today=new Date();
  const p2=n=>String(n).padStart(2,'0');
  const dateStr=`${p2(today.getDate())}.${p2(today.getMonth()+1)}.${today.getFullYear()}`;
  const pdfDate=`${p2(today.getDate())}_${p2(today.getMonth()+1)}_${today.getFullYear()}`;
  const rows=buildReportData();
  const tableRows=rows.map(r=>`<tr><td style="padding:7px 10px;border-bottom:1px solid #ddd;font-size:14px;color:#333">${r[0]}</td><td style="padding:7px 10px;border-bottom:1px solid #ddd;font-size:14px;font-weight:700;color:#111;text-align:right">${r[1]}</td></tr>`).join('');
  const reportContent=`
    <div style="font-family:Arial,sans-serif;color:#111;padding:32px">
      <div style="font-size:28px;font-weight:900;margin-bottom:18px"><span style="color:#e05000">Re</span>lax</div>
      <div style="border:1.5px solid #222;border-radius:3px;overflow:hidden;margin-top:8px">
        <div style="background:#222;color:#fff;padding:10px 18px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:30px">
          <span><span style="color:#aaa;font-size:11px;margin-right:6px">Data:</span>${dateStr}</span>
          <span><span style="color:#aaa;font-size:11px;margin-right:6px">Wygenerowano:</span>${p2(today.getHours())}:${p2(today.getMinutes())}</span>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr><th style="background:#222;color:#fff;padding:7px 10px;font-size:11px;text-align:left">POZYCJA</th><th style="background:#222;color:#fff;padding:7px 10px;font-size:11px;text-align:right">WARTOŚĆ</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
      <div style="margin-top:20px;font-size:13px;color:#666;text-align:right">Relax Wypożyczalnia • Raport dzienny • ${dateStr}</div>
    </div>`;

  const btn=document.getElementById('pdf-export-btn');
  const origText=btn?btn.innerHTML:'';
  const origBg=btn?btn.style.background:'';
  if(btn){btn.innerHTML='⏳ PDF';btn.style.opacity='.6';btn.style.pointerEvents='none';}

  // Populate print frame and trigger PDF via Electron (main window printToPDF)
  if(typeof window.electronAPI!=='undefined'&&window.electronAPI.generatePDF){
    let frame=document.getElementById('rl-print-frame');
    if(!frame){frame=document.createElement('div');frame.id='rl-print-frame';document.body.appendChild(frame);}
    frame.innerHTML=reportContent;
    try{
      const ok=await window.electronAPI.generatePDF(`relax_raport_${pdfDate}.pdf`);
      if(ok===true){
        if(btn){btn.innerHTML='✓ PDF';btn.style.background='var(--green)';}
        setTimeout(()=>{if(btn){btn.innerHTML=origText;btn.style.background=origBg||'var(--acc)';}},2000);
      }
    }catch(err){
      if(btn){btn.innerHTML='✕ Błąd';btn.style.background='var(--red)';}
      setTimeout(()=>{if(btn){btn.innerHTML=origText;btn.style.background=origBg||'var(--acc)';}},3000);
      console.error('PDF error:',err);
    }finally{
      frame.innerHTML='';
      if(btn){btn.style.opacity='1';btn.style.pointerEvents='';}
    }
  } else {
    // Browser fallback: print iframe
    const fullHtml=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;}@page{margin:18mm;}</style></head><body>${reportContent}</body></html>`;
    const iframe=document.createElement('iframe');
    iframe.style.cssText='position:fixed;width:0;height:0;border:0;left:-9999px;top:-9999px';
    document.body.appendChild(iframe);
    const doc=iframe.contentDocument||iframe.contentWindow.document;
    doc.open();doc.write(fullHtml);doc.close();
    setTimeout(()=>{
      try{iframe.contentWindow.focus();iframe.contentWindow.print();}catch(e){}
      setTimeout(()=>{try{document.body.removeChild(iframe);}catch(e){}},2000);
    },500);
    if(btn){btn.style.opacity='1';btn.style.pointerEvents='';}
  }
}

function exportReportCSV(){
  const rows=buildReportData();const today=new Date();
  const ds=`${today.getDate().toString().padStart(2,'0')}_${(today.getMonth()+1).toString().padStart(2,'0')}_${today.getFullYear()}`;
  const csv='﻿'+'POZYCJA,WARTOŚĆ\n'+rows.map(r=>'"'+String(r[0]).replace(/"/g,'""')+'","'+String(r[1]).replace(/"/g,'""')+'"').join('\n');
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download=`relax_raport_${ds}.csv`;
  document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);},500);
}

function exportReportXLSX(){
  const rows=buildReportData();const today=new Date();
  const ds=`${today.getDate().toString().padStart(2,'0')}_${(today.getMonth()+1).toString().padStart(2,'0')}_${today.getFullYear()}`;
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const xlsRows=rows.map(r=>`<Row><Cell><Data ss:Type="String">${esc(r[0])}</Data></Cell><Cell><Data ss:Type="String">${esc(r[1])}</Data></Cell></Row>`).join('');
  const xls=`<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Raport"><Table><Row><Cell><Data ss:Type="String">POZYCJA</Data></Cell><Cell><Data ss:Type="String">WARTOŚĆ</Data></Cell></Row>${xlsRows}</Table></Worksheet></Workbook>`;
  const a=document.createElement('a');
  a.href='data:application/vnd.ms-excel;charset=utf-8,'+encodeURIComponent('﻿'+xls);
  a.download=`relax_raport_${ds}.xls`;
  document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);},500);
}

function renderReport(){
  const today=new Date();const ds=new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime();
  const tr=rentals.filter(r=>r.startTs>=ds);
  const tot=tr.length,base=tr.reduce((s,r)=>s+r.totalPrice,0),sur=tr.reduce((s,r)=>s+(r.finalSurcharge||0),0);
  let reportCategories;
  try{const raw=localStorage.getItem('rl2_report_categories');reportCategories=raw?JSON.parse(raw):null;}catch(e){reportCategories=null;}
  const allTypes=[{type:'gokart',label:'Gokarty'},{type:'rower',label:'Rowery'},...getCustomTypes().filter(x=>x!=='gokart'&&x!=='rower').map(tp=>({type:tp,label:tp.charAt(0).toUpperCase()+tp.slice(1)}))];
  if(!reportCategories)reportCategories=[...allTypes];
  const catStats=reportCategories.map(cat=>({...cat,cnt:tr.reduce((s,r)=>s+r.vehicles.filter(v=>v.vtype===cat.type).length,0)}));
  document.getElementById('report-body').innerHTML=`
    <div style="text-align:center;font-size:11px;color:var(--t2);margin-bottom:14px">${today.toLocaleDateString(getLang()==='uk'?'uk-UA':getLang()==='en'?'en-GB':'pl-PL',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;align-items:stretch">
      <div style="display:flex;flex-direction:column;gap:9px">
        <div class="rst"><div class="rv" style="color:var(--acc)">${tot}</div><div class="rl">${t('reportRentals')||'Wypożyczeń'}</div></div>
        ${catStats.map((cat,i)=>{const colors=['#a78bfa','var(--green)','#60a5fa','#f97316','#ec4899'];return `<div class="rst"><div class="rv" style="color:${colors[i%colors.length]}">${cat.cnt}</div><div class="rl">${cat.label}</div></div>`;}).join('')}
      </div>
      <div class="rst" style="display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div class="rv" style="color:var(--green)">${base+sur} <span style="font-size:16px;font-weight:600">zł</span></div>
        <div class="rl" style="margin-top:6px">${t('reportRevenue')||'Przychód całkowity'}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px">
      <div class="scard"><div class="slbl">${t('reportBase')||'Kwota bazowa'}</div><div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--t1);margin-top:4px">${base} zł</div></div>
      <div class="scard"><div class="slbl">${t('reportSur')||'Dopłaty'}</div><div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--t1);margin-top:4px">${sur} zł</div></div>
    </div>`;
}
