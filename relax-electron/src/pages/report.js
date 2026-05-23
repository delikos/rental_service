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

function exportReportPDF(){
  let fields;try{const r=localStorage.getItem('rl2_pdf_fields');fields=r?JSON.parse(r):null;}catch(e){fields=null;}
  if(!fields||!fields.length)return;
  const today=new Date();
  const dateStr=`${today.getDate().toString().padStart(2,'0')}.${(today.getMonth()+1).toString().padStart(2,'0')}.${today.getFullYear()}`;
  const pdfDate=`${today.getDate().toString().padStart(2,'0')}_${(today.getMonth()+1).toString().padStart(2,'0')}_${today.getFullYear()}`;
  const rows=buildReportData();
  const addRow=(label,value)=>`<tr><td style="padding:7px 10px;border-bottom:1px solid #ddd;font-size:14px;color:#333">${label}</td><td style="padding:7px 10px;border-bottom:1px solid #ddd;font-size:14px;font-weight:700;color:#111;text-align:right">${value}</td></tr>`;
  const tableRows=rows.map(r=>addRow(r[0],r[1])).join('');
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Raport dzienny — ${dateStr}</title>
  <style>body{font-family:Arial,sans-serif;margin:32px;color:#111;}@media print{body{margin:16px;}@page{margin:18mm;}}
  .date-bar{background:#222;color:#fff;padding:10px 18px;font-size:13px;font-weight:700;margin-bottom:0;display:flex;align-items:center;gap:30px;border-radius:3px 3px 0 0;}
  .date-bar .lbl{color:#aaa;font-size:11px;margin-right:6px;}
  table{width:100%;border-collapse:collapse;}
  th{background:#222;color:#fff;padding:7px 10px;font-size:11px;text-align:left;}th:last-child{text-align:right;}
  tr:nth-child(even) td{background:#f9f9f9;}
  .footer{margin-top:20px;font-size:13px;color:#666;text-align:right;}
  </style></head><body>
  <div style="font-size:28px;font-weight:900;margin-bottom:18px"><span style="color:#e05000">Re</span>lax</div>
  <div style="border:1.5px solid #222;border-radius:3px;overflow:hidden;margin-top:8px">
  <div class="date-bar"><span><span class="lbl">Data:</span>${dateStr}</span><span><span class="lbl">Wygenerowano:</span>${today.getHours().toString().padStart(2,'0')}:${today.getMinutes().toString().padStart(2,'0')}</span></div>
  <table><thead><tr><th>POZYCJA</th><th style="text-align:right">WARTOŚĆ</th></tr></thead><tbody>${tableRows}</tbody></table></div>
  <div class="footer">Relax Wypożyczalnia • Raport dzienny • ${dateStr}</div>
  </body></html>`;
  const a=document.createElement('a');
  a.href='data:text/html;charset=utf-8,'+encodeURIComponent(html);
  a.download=`relax_raport_${pdfDate}.html`;
  document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);},500);
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
