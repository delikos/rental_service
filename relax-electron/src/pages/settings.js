// ═══ SETTINGS ═══
var DEFAULT_PERMS={viewRentals:true,addRental:true,endRental:true,viewHistory:true,viewReport:true,viewTracker:true};
function renderSettings(){
  if(!currentUser||currentUser.role!=='admin'){document.getElementById('content').innerHTML=`<div class="empty"><p>Brak dostępu — tylko administrator</p></div>`;return;}
  const inSt='width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:8px 10px;color:var(--t1);font-family:var(--font);font-size:12px;outline:none';
  const sortedUsers=[...users].sort((a,b)=>{
    if(a.role==='admin'&&b.role!=='admin')return -1;
    if(a.role!=='admin'&&b.role==='admin')return 1;
    if(a.role!=='admin'&&b.role!=='admin')return a.name.localeCompare(b.name,'pl');
    return 0;
  });
  document.getElementById('content').innerHTML=`
    <div class="sett-card">
      <h3>${t('settUsers')||'Użytkownicy systemu'}</h3>
      ${sortedUsers.map(u=>{
        const perms=u.perms||DEFAULT_PERMS;
        const isAdmin=u.role==='admin';
        const cardId='ucard-'+u.id;
        return `<div style="background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);margin-bottom:8px;overflow:hidden">
          <div style="display:flex;align-items:center;padding:10px 12px;gap:8px">
            <div class="uav${isAdmin?' adm':''}" style="width:30px;height:30px;font-size:10px;flex-shrink:0">${initials(u.name)}</div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:13px;font-weight:600">${u.name}</span>
                <button onclick="toggleUserCard('${u.id}')" id="ucard-btn-${u.id}" style="height:22px;padding:0 7px;border-radius:var(--rsm);border:1px solid var(--bd);background:var(--s3);color:var(--t2);cursor:pointer;font-size:10px;white-space:nowrap">▼</button>
              </div>
              <div style="font-size:10px;color:var(--t2)">${isAdmin?t('settRoleAdmin')||'Administrator':t('settRoleWorker')||'Pracownik'}</div>
            </div>
            ${u.id!=='admin'?`<button class="btn" style="height:28px;font-size:11px;background:rgba(232,64,64,.08);color:var(--red);border:1px solid rgba(232,64,64,.2);flex-shrink:0" onclick="delUser('${u.id}')">${t('settDelete')||'Usuń'}</button>`:''}
          </div>
          <div id="${cardId}" style="display:none;padding:0 12px 12px;border-top:1px solid var(--bd)">
            ${!isAdmin?`
            <div style="display:flex;gap:6px;align-items:center;margin-top:10px;margin-bottom:10px">
              <input id="uname-${u.id}" value="${u.name}" style="background:var(--s3);border:1px solid var(--bd);border-radius:var(--rsm);padding:5px 8px;color:var(--t1);font-family:var(--font);font-size:13px;font-weight:600;outline:none;flex:1" onfocus="this.style.borderColor='var(--acc)'" onblur="this.style.borderColor='var(--bd)'">
              <button onclick="renameUser('${u.id}')" style="height:30px;padding:0 10px;border-radius:var(--rsm);border:1px solid var(--bd);background:var(--s3);color:var(--t2);cursor:pointer;font-size:11px;flex-shrink:0" onmouseover="this.style.borderColor='var(--acc)';this.style.color='var(--acc)'" onmouseout="this.style.borderColor='var(--bd)';this.style.color='var(--t2)'">${t('settRename')||'Zmień'}</button>
            </div>
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--bd)">
              <div style="font-size:11px;color:var(--t2);flex-shrink:0;min-width:50px">${t('settLang')||'Język:'}</div>
              <div style="display:flex;gap:4px;flex:1">
                <button id="lang-btn-${u.id}-pl" onclick="setUserLang('${u.id}','pl')" style="flex:1;height:32px;border-radius:var(--rsm);border:2px solid ${(u.lang||'pl')==='pl'?'var(--acc)':'var(--bd)'};background:none;cursor:pointer;font-size:20px;line-height:1;color:var(--t1)" title="Polski">🇵🇱</button>
                <button id="lang-btn-${u.id}-en" onclick="setUserLang('${u.id}','en')" style="flex:1;height:32px;border-radius:var(--rsm);border:2px solid ${u.lang==='en'?'var(--acc)':'var(--bd)'};background:none;cursor:pointer;font-size:20px;line-height:1;color:var(--t1)" title="English">🇬🇧</button>
                <button id="lang-btn-${u.id}-uk" onclick="setUserLang('${u.id}','uk')" style="flex:1;height:32px;border-radius:var(--rsm);border:2px solid ${u.lang==='uk'?'var(--acc)':'var(--bd)'};background:none;cursor:pointer;font-size:20px;line-height:1;color:var(--t1)" title="Українська">🇺🇦</button>
              </div>
              <button onclick="showUserSessions('${u.id}')" style="height:30px;padding:0 8px;border-radius:var(--rsm);border:1px solid var(--bd);background:var(--s3);color:var(--t2);cursor:pointer;font-size:11px;white-space:nowrap;flex-shrink:0">${t('settSessionsBtn')||'Historia logowań'}</button>
            </div>
            <div id="user-sessions-${u.id}" style="display:none;background:var(--s3);border-radius:var(--rsm);padding:8px;margin-bottom:10px;max-height:200px;overflow-y:auto"></div>
            <div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">${t('settPerms')||'Uprawnienia'}</div>
            <div class="perm-grid">
              ${[
                ['viewRentals',t('permViewRentals')||'Podgląd aktywnych',t('permSubViewRentals')||'Widzi aktywne wypożyczenia'],
                ['addRental',t('permAddRental')||'Dodawanie',t('permSubAddRental')||'Może tworzyć wypożyczenia'],
                ['endRental',t('permEndRental')||'Kończenie',t('permSubEndRental')||'Może kończyć wypożyczenia'],
                ['viewHistory',t('permViewHistory')||'Historia',t('permSubViewHistory')||'Dostęp do historii'],
                ['viewReport',t('permViewReport')||'Raporty',t('permSubViewReport')||'Może generować raporty'],
                ['viewTracker',t('permViewTracker')||'Śledzenie',t('permSubViewTracker')||'Widzi tracker pojazdów'],
              ].map(([key,lbl,sub])=>`
                <div class="perm-item">
                  <input type="checkbox" class="perm-cb" ${perms[key]?'checked':''} onchange="togglePerm('${u.id}','${key}',this.checked)">
                  <div><div class="perm-lbl">${lbl}</div><div class="perm-sub">${sub}</div></div>
                </div>`).join('')}
            </div>`:''}
            ${isAdmin?`
            <div style="margin-top:10px">
              <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--bd)">
                <div style="font-size:11px;color:var(--t2);flex-shrink:0;min-width:50px">${t('settLang')||'Język:'}</div>
                <div style="display:flex;gap:4px;flex:1">
                  <button id="lang-btn-${u.id}-pl" onclick="setUserLang('${u.id}','pl')" style="flex:1;height:32px;border-radius:var(--rsm);border:2px solid ${(u.lang||'pl')==='pl'?'var(--acc)':'var(--bd)'};background:none;cursor:pointer;font-size:20px;line-height:1;color:var(--t1)" title="Polski">🇵🇱</button>
                  <button id="lang-btn-${u.id}-en" onclick="setUserLang('${u.id}','en')" style="flex:1;height:32px;border-radius:var(--rsm);border:2px solid ${u.lang==='en'?'var(--acc)':'var(--bd)'};background:none;cursor:pointer;font-size:20px;line-height:1;color:var(--t1)" title="English">🇬🇧</button>
                  <button id="lang-btn-${u.id}-uk" onclick="setUserLang('${u.id}','uk')" style="flex:1;height:32px;border-radius:var(--rsm);border:2px solid ${u.lang==='uk'?'var(--acc)':'var(--bd)'};background:none;cursor:pointer;font-size:20px;line-height:1;color:var(--t1)" title="Українська">🇺🇦</button>
                </div>
              </div>
              <div style="font-size:11px;font-weight:600;color:var(--t2);margin-bottom:8px">${t('settChangeAdminPw')||'Zmień hasło'}</div>
              <div style="max-width:360px">
                <div class="fr" style="margin-bottom:8px"><label>${t('settNewPw')||'Nowe hasło'}</label><input type="password" id="adm-pw1" placeholder="${t('pwMin')||'Min. 3 znaki'}" style="width:100%;background:var(--s3);border:1px solid var(--bd);border-radius:var(--rsm);padding:7px 10px;color:var(--t1);font-family:var(--font);font-size:12px;outline:none"></div>
                <div class="fr" style="margin-bottom:8px"><label>${t('settRepeatPw')||'Powtórz hasło'}</label><input type="password" id="adm-pw2" placeholder="${t('settRepeatPw')||'Powtórz'}" style="width:100%;background:var(--s3);border:1px solid var(--bd);border-radius:var(--rsm);padding:7px 10px;color:var(--t1);font-family:var(--font);font-size:12px;outline:none"></div>
                <div id="adm-pw-msg" style="font-size:11px;min-height:14px;margin-bottom:6px"></div>
                <button class="btn btn-p" onclick="saveAdminPw()" style="width:auto;padding:0 14px;height:30px;font-size:11px">${t('settSavePw')||'Zapisz hasło'}</button>
              </div>
            </div>`:''}
          </div>
        </div>`;
      }).join('')}
      <div style="display:flex;gap:8px;margin-top:12px;align-items:flex-end">
        <div style="flex:1"><input id="new-uname" placeholder="${t('settUserPh')||'Imię i nazwisko nowego pracownika'}" style="width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:8px 10px;color:var(--t1);font-family:var(--font);font-size:12px;outline:none"></div>
        <button class="btn btn-p" style="flex:none;width:auto;padding:0 14px;height:30px;font-size:11px" onclick="addUser()">${t('settAddUser')||'Dodaj pracownika'}</button>
      </div>
    </div>

    <div class="sett-card">
      <h3 style="display:flex;align-items:center;justify-content:space-between">${t('settPrices')||'Cennik'} <button class="btn btn-g" style="height:26px;padding:0 12px;font-size:11px" onclick="showV('settings-prices')">${t('settPricesEdit')||'Edytuj →'}</button></h3>
    </div>

    <div class="sett-card">
      <h3 style="display:flex;align-items:center;justify-content:space-between">${t('settEquip')||'Sprzęt'} <span style="font-size:12px;color:var(--t2);font-weight:400">${FLEET.length} ${t('settVehiclesCount')||'pojazdów'}</span> <button class="btn btn-g" style="height:26px;padding:0 12px;font-size:11px" onclick="showV('settings-equipment')">${t('settEquipManage')||'Zarządzaj →'}</button></h3>
    </div>

    <div class="sett-card">
      <details>
        <summary style="cursor:pointer;font-size:11px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.07em;list-style:none;display:flex;align-items:center;justify-content:space-between;height:40px;margin-bottom:12px;border-bottom:1px solid var(--bd)">
          ${t('settReportCfg')||'Konfiguracja raportu dziennego'}
          <span style="font-size:10px;color:var(--t3)">▼</span>
        </summary>
        <div style="margin-top:12px">
          <div style="font-size:11px;color:var(--t2);margin-bottom:10px">${t('settRepCatLbl')||'Kategorie pojazdów w raporcie:'}</div>
          ${(()=>{
            let cats;try{const raw=localStorage.getItem('rl2_report_categories');cats=raw?JSON.parse(raw):null;}catch(e){cats=null;}
            const allTypes=[{type:'gokart',label:t('settKarts')||'Gokarty'},{type:'rower',label:t('settBikes')||'Rowery'},...getCustomTypes().filter(x=>x!=='gokart'&&x!=='rower').map(tp=>({type:tp,label:tp.charAt(0).toUpperCase()+tp.slice(1)}))];
            if(!cats)cats=[...allTypes];
            return allTypes.map(at=>{const checked=cats.some(c=>c.type===at.type);return `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;margin-bottom:8px"><input type="checkbox" ${checked?'checked':''} onchange="toggleReportCat('${at.type}','${at.label}',this.checked)" style="width:14px;height:14px;accent-color:var(--acc)"><span>${at.label}</span></label>`;}).join('')+`<div style="font-size:12px;color:var(--t2);margin-top:6px">${t('settRepAutoSave')||'Zmiany są zapisywane automatycznie.'}</div>`;
          })()}
          <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--bd)">
            <div style="font-size:11px;font-weight:600;color:var(--t2);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">${t('settRepFieldsLbl')||'Dane w raporcie PDF:'}</div>
            ${(()=>{
              const pdfFields=[{k:'pdf_rentals',l:t('pdfFieldRentals')||'Ilość wypożyczeń'},{k:'pdf_per_equip',l:t('pdfFieldPerEquip')||'Wypożyczenia według sprzętu'},{k:'pdf_revenue',l:t('pdfFieldRevenue')||'Łączny przychód'},{k:'pdf_surcharge',l:t('pdfFieldSurcharge')||'Łączne dopłaty'},{k:'pdf_top_model',l:t('pdfFieldTopModel')||'Najczęściej wypożyczany model'},{k:'pdf_avg_dur',l:t('pdfFieldAvgDur')||'Średni czas wypożyczenia'},{k:'pdf_peak_hour',l:t('pdfFieldPeakHour')||'Godzina szczytu'}];
              let saved;try{const r=localStorage.getItem('rl2_pdf_fields');saved=r?JSON.parse(r):null;}catch(e){saved=null;}
              if(!saved)saved=pdfFields.map(f=>f.k);
              return pdfFields.map(f=>{const checked=saved.includes(f.k);return `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;margin-bottom:7px"><input type="checkbox" ${checked?'checked':''} onchange="togglePdfField('${f.k}',this.checked)" style="width:14px;height:14px;accent-color:var(--acc)"><span>${f.l}</span></label>`;}).join('');
            })()}
            <div style="margin-top:10px;display:flex;gap:7px;flex-wrap:wrap">
              ${(()=>{let saved;try{const r=localStorage.getItem('rl2_pdf_fields');saved=r?JSON.parse(r):null;}catch(e){saved=null;}if(!saved)saved=['pdf_rentals','pdf_per_equip','pdf_revenue','pdf_surcharge','pdf_top_model','pdf_avg_dur','pdf_peak_hour'];const has=saved.length>0;const bg=has?'var(--acc)':'var(--s4)';const cl=has?'#fff':'var(--t3)';const cu=has?'pointer':'not-allowed';const icon=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;return `<button id="pdf-export-btn" onclick="${has?'exportReportPDF()':''}" style="width:auto;padding:0 14px;height:30px;font-size:11px;display:flex;align-items:center;gap:6px;background:${bg};color:${cl};border:none;border-radius:var(--rsm);cursor:${cu}">${icon} PDF</button><button id="csv-export-btn" onclick="${has?'exportReportCSV()':''}" style="width:auto;padding:0 14px;height:30px;font-size:11px;display:flex;align-items:center;gap:6px;background:${bg};color:${cl};border:none;border-radius:var(--rsm);cursor:${cu}">${icon} CSV</button><button id="xlsx-export-btn" onclick="${has?'exportReportXLSX()':''}" style="width:auto;padding:0 14px;height:30px;font-size:11px;display:flex;align-items:center;gap:6px;background:${bg};color:${cl};border:none;border-radius:var(--rsm);cursor:${cu}">${icon} XLS</button>`;})()}
            </div>
          </div>
        </div>
      </details>
    </div>

    <div class="sett-card">
      <details>
        <summary style="cursor:pointer;font-size:11px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.07em;list-style:none;display:flex;align-items:center;justify-content:space-between;height:40px;margin-bottom:0;border-bottom:1px solid transparent">
          ${t('settBackup')||'Kopia zapasowa danych'}
          <span style="font-size:10px;color:var(--t3)">▼</span>
        </summary>
        <div style="margin-top:12px">
          <div style="font-size:11px;color:var(--t2);margin-bottom:12px">${t('settBackupDesc')||'Eksportuj lub importuj wszystkie dane: wypożyczenia, użytkowników, sprzęt, ceny, zadania i ustawienia.'}</div>
          <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--bd)">
            <div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">${t('settExportPwLbl')||'Hasło do eksportu danych'}</div>
            <div style="display:flex;gap:6px;align-items:center">
              <input type="password" id="export-pw-input" value="${localStorage.getItem('rl2_export_pw')||''}" placeholder="••••••••" style="flex:1;background:var(--s3);border:1px solid var(--bd);border-radius:var(--rsm);padding:6px 10px;color:var(--t1);font-family:var(--font);font-size:12px;outline:none">
              <button onclick="saveExportPw()" style="height:30px;padding:0 12px;border-radius:var(--rsm);border:1px solid var(--bd);background:var(--s3);color:var(--t2);cursor:pointer;font-size:11px;white-space:nowrap">${t('settExportPwSave')||'Zapisz'}</button>
            </div>
            <div id="export-pw-msg" style="font-size:10px;color:var(--t3);margin-top:4px">${t('settExportPwHint')||'Gdy hasło jest ustawione, eksport będzie zaszyfrowany (.rlx).'}</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-g" onclick="exportAllData()" style="width:auto;padding:0 14px;height:30px;font-size:11px;display:flex;align-items:center;gap:6px">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              ${t('settExport')||'Eksportuj dane'}
            </button>
            <button class="btn btn-g" onclick="importAllData()" style="width:auto;padding:0 14px;height:30px;font-size:11px;display:flex;align-items:center;gap:6px">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              ${t('settImport')||'Importuj dane'}
            </button>
          </div>
          <div id="backup-msg" style="font-size:11px;color:var(--t3);margin-top:8px"></div>
        </div>
      </details>
    </div>`
}
function saveExportPw(){
  const inp=document.getElementById('export-pw-input');
  const msg=document.getElementById('export-pw-msg');
  if(!inp)return;
  const pw=inp.value;
  if(pw.length>0){localStorage.setItem('rl2_export_pw',pw);}
  else{localStorage.removeItem('rl2_export_pw');}
  if(msg){
    msg.textContent=pw.length>0?(t('settExportPwSet')||'Hasło eksportu ustawione.'):(t('settExportPwClear')||'Hasło eksportu wyczyszczone.');
    msg.style.color='var(--green)';
    setTimeout(()=>{if(msg){msg.textContent=t('settExportPwHint')||'Gdy hasło jest ustawione, eksport będzie zaszyfrowany (.rlx).';msg.style.color='var(--t3)';}},2000);
  }
}
function toggleUserCard(uid){
  const el=document.getElementById('ucard-'+uid);
  const btn=document.getElementById('ucard-btn-'+uid);
  if(!el)return;
  const open=el.style.display!=='none';
  el.style.display=open?'none':'block';
  if(btn)btn.textContent=open?'▼':'▲';
}
function rerenderSettingsKeepState(){
  if(currentView!=='settings')return;
  // Save which cards are open
  const openIds=users.map(u=>u.id).filter(id=>{const el=document.getElementById('ucard-'+id);return el&&el.style.display!=='none';});
  renderSettings();
  // Restore open state
  openIds.forEach(id=>{
    const el=document.getElementById('ucard-'+id);
    const btn=document.getElementById('ucard-btn-'+id);
    if(el){el.style.display='block';if(btn)btn.textContent='▲';}
  });
}
async function saveAdminPw(){
  const p1=document.getElementById('adm-pw1')?.value;
  const p2=document.getElementById('adm-pw2')?.value;
  const msg=document.getElementById('adm-pw-msg');
  if(!p1||p1.length<3){msg.textContent=t('pwMin')||'Hasło musi mieć min. 3 znaki.';msg.style.color='var(--red)';return;}
  if(p1!==p2){msg.textContent=t('pwMismatch')||'Hasła nie są identyczne.';msg.style.color='var(--red)';return;}
  const u=users.find(x=>x.id===currentUser.id);
  if(!u)return;
  u.passwordHash=await hashPw(p1);
  IAPI.saveUsers(users);
  msg.textContent='✓ '+(t('settAdminPw')||'Hasło administratora zmienione.');msg.style.color='var(--green)';
  document.getElementById('adm-pw1').value='';
  document.getElementById('adm-pw2').value='';
}
function renderSettingsUser(){
  if(!currentUser)return;
  const inSt='width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:8px 10px;color:var(--t1);font-family:var(--font);font-size:12px;outline:none';
  document.getElementById('content').innerHTML=`
    <div style="max-width:460px">
      <div class="sett-card">
        <h3>${t('myAccount')||'Moje konto'}: ${currentUser.name}</h3>
        <div class="fr" style="margin-bottom:14px">
          <label>Język / Language / Мова</label>
          <div style="display:flex;gap:6px;margin-top:6px">
            <button onclick="setSelfLang('pl')" style="flex:1;height:38px;border-radius:var(--rsm);border:2px solid ${(currentUser.lang||'pl')==='pl'?'var(--acc)':'var(--bd)'};background:none;cursor:pointer;font-size:22px;display:flex;align-items:center;justify-content:center;color:#fff;line-height:1" title="Polski" id="self-lang-pl">🇵🇱</button>
            <button onclick="setSelfLang('en')" style="flex:1;height:38px;border-radius:var(--rsm);border:2px solid ${currentUser.lang==='en'?'var(--acc)':'var(--bd)'};background:none;cursor:pointer;font-size:22px;display:flex;align-items:center;justify-content:center;color:#fff;line-height:1" title="English" id="self-lang-en">🇬🇧</button>
            <button onclick="setSelfLang('uk')" style="flex:1;height:38px;border-radius:var(--rsm);border:2px solid ${currentUser.lang==='uk'?'var(--acc)':'var(--bd)'};background:none;cursor:pointer;font-size:22px;display:flex;align-items:center;justify-content:center;color:#fff;line-height:1" title="Українська" id="self-lang-uk">🇺🇦</button>
          </div>
        </div>
        <div class="fr" style="margin-bottom:10px">
          <label>${t('newPw')||'Nowe hasło'}</label>
          <input type="password" id="usr-pw1" placeholder="${t('pwMin')||'Min. 3 znaki'}" style="${inSt}">
        </div>
        <div class="fr" style="margin-bottom:10px">
          <label>${t('repeatPw')||'Powtórz hasło'}</label>
          <input type="password" id="usr-pw2" placeholder="${t('repeatPw')||'Powtórz nowe hasło'}" style="${inSt}">
        </div>
        <div id="usr-pw-msg" style="font-size:11px;min-height:16px;margin-bottom:8px"></div>
        <button class="btn btn-p" onclick="saveUserPw()" style="width:100%">${t('savePw')||'Zapisz nowe hasło'}</button>
      </div>
    </div>
    <div style="max-width:460px">
    <div class="sett-card">
      <details>
        <summary style="cursor:pointer;font-size:11px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.07em;list-style:none;display:flex;align-items:center;justify-content:space-between;height:40px;margin-bottom:0;border-bottom:1px solid transparent">
          ${t('settBackup')||'Kopia zapasowa danych'}
          <span style="font-size:10px;color:var(--t3)">▼</span>
        </summary>
        <div style="margin-top:12px">
          <div style="font-size:11px;color:var(--t2);margin-bottom:12px">${t('settBackupDesc')||'Eksportuj lub importuj wszystkie dane: wypożyczenia, użytkowników, sprzęt, ceny, zadania i ustawienia.'}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-g" onclick="exportAllData()" style="width:auto;padding:0 14px;height:30px;font-size:11px;display:flex;align-items:center;gap:6px">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              ${t('settExport')||'Eksportuj dane'}
            </button>
            <button class="btn btn-g" onclick="importAllData()" style="width:auto;padding:0 14px;height:30px;font-size:11px;display:flex;align-items:center;gap:6px">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              ${t('settImport')||'Importuj dane'}
            </button>
          </div>
          <div id="backup-msg" style="font-size:11px;color:var(--t3);margin-top:8px"></div>
        </div>
      </details>
    </div>
    </div>
    `
}
async function saveUserPw(){
  const p1=document.getElementById('usr-pw1')?.value;
  const p2=document.getElementById('usr-pw2')?.value;
  const msg=document.getElementById('usr-pw-msg');
  if(!p1||p1.length<3){msg.textContent=t('pwMin')||'Hasło musi mieć min. 3 znaki.';msg.style.color='var(--red)';return;}
  if(p1!==p2){msg.textContent=t('pwMismatch')||'Hasła nie są identyczne.';msg.style.color='var(--red)';return;}
  const u=users.find(x=>x.id===currentUser.id);
  if(!u)return;
  u.passwordHash=await hashPw(p1);
  IAPI.saveUsers(users);
  msg.textContent='✓ '+(t('pwSaved')||'Hasło zostało zmienione.');msg.style.color='var(--green)';
  document.getElementById('usr-pw1').value='';
  document.getElementById('usr-pw2').value='';
}
function clearSessions(){sessions=[];IAPI.saveSessions(sessions);renderSettings();}
function setSelfLang(lang){
  if(!currentUser)return;
  currentUser.lang=lang;
  const u=users.find(x=>x.id===currentUser.id);
  if(u){u.lang=lang;IAPI.saveUsers(users);}
  ['pl','en','uk'].forEach(l=>{
    const btn=document.getElementById('self-lang-'+l);
    if(btn)btn.style.borderColor=l===lang?'var(--acc)':'var(--bd)';
  });
  applyLang();
  renderSettingsUser();
}
function setUserLang(uid,lang){
  const u=users.find(x=>x.id===uid);if(!u)return;
  u.lang=lang;
  IAPI.saveUsers(users);
  if(currentUser&&u.id===currentUser.id){
    currentUser.lang=lang;
    applyLang();
    ['pl','en','uk'].forEach(l=>{
      const btn=document.getElementById('lang-btn-'+uid+'-'+l);
      if(btn)btn.style.borderColor=l===lang?'var(--acc)':'var(--bd)';
    });
    return;
  }
  ['pl','en','uk'].forEach(l=>{
    const btn=document.getElementById('lang-btn-'+uid+'-'+l);
    if(btn)btn.style.borderColor=l===lang?'var(--acc)':'var(--bd)';
  });
}
function showUserSessions(uid){
  const uSes=sessions.filter(s=>s.userId===uid).reverse();
  const pad=n=>String(n).padStart(2,'0');
  const fmtDate=ts=>{const d=new Date(ts);return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`;};
  const fmtTime=ts=>{const d=new Date(ts);return `${pad(d.getHours())}:${pad(d.getMinutes())}`;};
  const el=document.getElementById('user-sessions-'+uid);
  if(!el)return;
  if(el.style.display!=='none'){el.style.display='none';return;}
  el.style.display='block';
  if(uSes.length===0){el.innerHTML='<div style="color:var(--t3);font-size:11px;padding:4px 0">Brak logowań</div>';return;}
  const byDay={};
  uSes.forEach(s=>{const day=fmtDate(s.loginTs);if(!byDay[day])byDay[day]=[];byDay[day].push(s);});
  el.innerHTML=Object.entries(byDay).map(([day,daySes])=>{
    const rows=daySes.map(s=>{
      const dur=s.logoutTs?Math.round((s.logoutTs-s.loginTs)/60000):null;
      return `<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:4px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:11px">
        <div><span style="font-size:9px;color:var(--t3);text-transform:uppercase;display:block">Od</span><b>${fmtTime(s.loginTs)}</b></div>
        <div><span style="font-size:9px;color:var(--t3);text-transform:uppercase;display:block">Do</span><b style="color:${s.logoutTs?'var(--t1)':'var(--orange)'}">${s.logoutTs?fmtTime(s.logoutTs):'Aktywna'}</b></div>
        <div style="text-align:right;padding-top:14px;color:var(--t2)">${dur!==null?dur+' min':'—'}</div>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:6px">
      <div onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'" style="font-size:10px;font-weight:700;color:var(--acc);cursor:pointer;padding:4px 0;display:flex;align-items:center;gap:6px">
        <span>📅 ${day}</span><span style="color:var(--t3);font-weight:400">(${daySes.length} ${t('settSessions')||'sesji'})</span>
      </div>
      <div style="display:none;padding:0 4px">${rows}</div>
    </div>`;
  }).join('');
}

function renderSettingsEquipment(){
  const customTypes=[...new Set(FLEET.filter(f=>f.type!=='gokart'&&f.type!=='rower').map(f=>f.type))];

  document.getElementById('content').innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <button onclick="showV('settings')" style="height:32px;padding:0 12px;border-radius:var(--rsm);border:1px solid var(--bd);background:var(--s2);color:var(--t2);cursor:pointer;font-size:12px;font-weight:500;display:flex;align-items:center;gap:6px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        ${t('settPricesBack')||'Powrót'}
      </button>
      <h2 style="font-size:15px;font-weight:700">${t('settEquipTitle')||'Zarządzanie sprzętem'}</h2>
    </div>

    <div class="sett-card">
      <h3>${t('settEquipAddNew')||'Dodaj nowy pojazd'}</h3>
      <div class="fg3" style="margin-bottom:8px">
        <div class="fr" style="margin-bottom:0">
          <label>${t('settEquipTypeLbl')||'Typ pojazdu'}</label>
          <input id="eq-type" placeholder="${t('settEquipTypePh')||'np. Gokart, Rower...'}" oninput="eqCheckNewType()" style="width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:8px 10px;color:var(--t1);font-family:var(--font);font-size:12px;outline:none">
        </div>
        <div class="fr" style="margin-bottom:0">
          <label>${t('settEquipModelLbl')||'Model / Nazwa'}</label>
          <input id="eq-model" placeholder="${t('settEquipModelPh')||'np. Maluch, Kajak...'}" oninput="eqCheckNewType();const p=document.getElementById('eq-model-preview');if(p)p.textContent=this.value||'—';" style="width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:8px 10px;color:var(--t1);font-family:var(--font);font-size:12px;outline:none">
        </div>
        <div class="fr" style="margin-bottom:0">
          <label>${t('settEquipNumLbl')||'Numer'}</label>
          <input id="eq-num" placeholder="np. 1, 2, 3..." style="width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:8px 10px;color:var(--t1);font-family:var(--font);font-size:12px;outline:none">
        </div>
      </div>
      <!-- Price/dur fields shown for new/unknown models -->
      <div id="eq-price-section" style="display:none;margin-bottom:8px">
        <!-- Prices section - cennik style -->
        <div style="background:var(--s2);border-radius:var(--rsm);overflow:hidden;margin-bottom:8px">
          <div style="background:#1a1a1a;padding:5px 8px;font-size:10px;font-weight:800;color:#fff;text-align:center;letter-spacing:.06em;text-transform:uppercase">${t('settEquipPricesHdr')||'CENY'}</div>
          <!-- Column header row: MARKA | OKRES | CENA -->
          <div style="display:grid;grid-template-columns:1fr 100px 64px 26px;gap:4px;background:#1a1a1a;padding:4px 8px;border-top:1px solid rgba(255,255,255,.1)">
            <div style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase">${t('cpMarka')||'MARKA'}</div>
            <div style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase;text-align:center">${t('settEquipPeriodHdr')||'OKRES'}</div>
            <div style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase;text-align:center">${t('cpPrice')||'CENA'}</div>
            <div></div>
          </div>
          <!-- Default row: first period -->
          <div style="display:grid;grid-template-columns:1fr 100px 64px 26px;gap:4px;padding:5px 8px;background:var(--s3);align-items:center;border-top:1px solid var(--bd)">
            <div id="eq-model-preview" style="font-size:11px;font-weight:700;color:var(--t1)">—</div>
            <select id="eq-dur30-sel" onchange="checkDupDurs()" style="width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:3px;padding:3px 4px;font-family:var(--mono);font-size:11px;color:var(--t1);outline:none;cursor:pointer">
              ${(()=>{const h=t('durHour')||'godz.';const d=t('allDay')||'Cały dzień';return `<option value="30">30 min</option><option value="60">1 ${h}</option><option value="90">90 min</option><option value="120">2 ${h}</option><option value="180">3 ${h}</option><option value="240">4 ${h}</option><option value="360">6 ${h}</option><option value="720">12 ${h}</option><option value="1440">${d}</option>`;})()}
            </select>
            <div style="display:flex;align-items:center;gap:3px">
              <input type="number" id="eq-price30" placeholder="—" min="0" style="width:48px;background:var(--s2);border:1px solid var(--bd);border-radius:3px;padding:3px;font-family:var(--mono);font-size:12px;font-weight:700;color:var(--t1);text-align:center;outline:none">
              <span style="font-size:11px;color:var(--t3);font-weight:600">zł</span>
            </div>
            <div></div>
          </div>
          <div id="eq-extra-durs"></div>
          <div style="background:#1a1a1a;padding:4px 8px;display:flex;align-items:center;justify-content:flex-end">
            <button type="button" onclick="addEqDurRow()" style="height:22px;padding:0 8px;border-radius:3px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#aaa;cursor:pointer;font-size:10px">${t('settEquipAddPeriod')||'+ Dodaj okres'}</button>
          </div>
        </div>
        <!-- Surcharges section -->
        <div style="background:var(--s2);border-radius:var(--rsm);overflow:hidden">
          <div style="background:#191919;padding:5px 8px;font-size:10px;font-weight:800;color:#fff;text-align:center;letter-spacing:.06em;text-transform:uppercase;border-top:2px solid #c96a10">${t('cpDoplataLbl')||'DOPŁATY'}</div>
          <div id="eq-sur-list">
            <div class="eq-sur-row" style="display:grid;grid-template-columns:1fr 1fr 26px;gap:5px;align-items:center;padding:6px 8px;border-top:1px solid var(--bd)">
              <input class="eq-sur-grace" type="number" min="0" style="width:100%;background:var(--s3);border:1px solid var(--bd);border-radius:var(--rsm);padding:5px 8px;color:var(--t1);font-family:var(--mono);font-size:11px;outline:none">
              <div style="position:relative;grid-column:2/4"><input class="eq-sur-price" type="number" id="eq-sur-price-first" min="0" style="width:100%;background:var(--s3);border:1px solid var(--bd);border-radius:var(--rsm);padding:5px 22px 5px 6px;color:var(--t1);font-family:var(--mono);font-size:12px;font-weight:600;outline:none;text-align:center"><span style="position:absolute;right:4px;top:50%;transform:translateY(-50%);font-size:9px;color:var(--t3)">zł</span></div>
            </div>
          </div>
          <div style="background:#191919;padding:4px 8px;display:flex;align-items:center;justify-content:flex-end">
            <button type="button" onclick="addEqSurRow()" style="height:22px;padding:0 8px;border-radius:3px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#aaa;cursor:pointer;font-size:10px">${t('settEquipAddSurTier')||'+ Dodaj próg dopłaty'}</button>
          </div>
        </div>
        <div style="font-size:11px;color:var(--t3);margin-top:5px">${t('settEquipPriceHint')||'Zostaw puste jeśli nie chcesz teraz.'}</div>
      </div>
      <div id="eq-error" style="color:var(--red);font-size:11px;min-height:16px;margin-bottom:6px"></div>
      <button class="btn btn-p" onclick="addFleetVehicle()" style="width:auto;padding:0 16px;height:30px;font-size:11px">${t('settEquipAddVehicle')||'Dodaj pojazd'}</button>
    </div>

    <div class="sett-card">
      <h3>${t('settEquipListTitle')||'Lista sprzętu'} (${FLEET.length}) <span style="font-size:10px;color:var(--t3);font-weight:400">— ${t('settEquipDragHint')||'przeciągnij żeby zmienić kolejność'}</span></h3>
      <div id="fleet-list" style="display:flex;flex-direction:column;gap:5px">
        ${FLEET.map((v,i)=>`
          <div class="fleet-item" draggable="true" data-idx="${i}"
            style="background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:8px 10px;display:flex;align-items:center;gap:8px;cursor:grab;user-select:none;transition:opacity .15s,border-color .15s">
            <span style="color:var(--t3);font-size:14px;flex-shrink:0">⠿</span>
            <div style="flex:1">
              <div style="font-size:12px;font-weight:600">${v.model}</div>
              <div style="font-size:10px;color:var(--t2)">${v.type==='gokart'?(t('kartType')||'Gokart'):v.type==='rower'?(t('bikeType')||'Rower'):v.type.charAt(0).toUpperCase()+v.type.slice(1)} · nr ${v.num.replace(/^[A-Z]+-0*/,'')}</div>
            </div>
            <button onclick="removeFleetVehicle(${i})" style="width:26px;height:26px;border-radius:5px;border:1px solid rgba(232,64,64,.25);background:rgba(232,64,64,.08);color:var(--red);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0" title="Usuń">✕</button>
          </div>`).join('')}
      </div>
    </div>`;

  initFleetDrag();
}

function addEqSurRow(){
  const list=document.getElementById('eq-sur-list');if(!list)return;
  const row=document.createElement('div');
  row.className='eq-sur-row';
  row.style.cssText='display:grid;grid-template-columns:1fr 1fr 26px;gap:5px;align-items:center;padding:6px 8px;border-top:1px solid var(--bd)';
  const gracePH=t('gracePh')||'Czas przekroczenia (min)';
  const surPH=t('surPricePh')||'zł/godz';
  row.innerHTML=`<input class="eq-sur-grace" type="number" placeholder="${gracePH}" min="0" style="width:100%;background:var(--s3);border:1px solid var(--bd);border-radius:var(--rsm);padding:5px 8px;color:var(--t1);font-family:var(--mono);font-size:11px;outline:none">
    <div style="position:relative;grid-column:2/4"><input class="eq-sur-price" type="number" placeholder="${surPH}" min="0" style="width:100%;background:var(--s3);border:1px solid var(--bd);border-radius:var(--rsm);padding:5px 22px 5px 6px;color:var(--t1);font-family:var(--mono);font-size:12px;font-weight:600;outline:none;text-align:center"><span style="position:absolute;right:4px;top:50%;transform:translateY(-50%);font-size:9px;color:var(--t3)">zł</span></div>
    <button type="button" onclick="this.parentElement.remove()" style="height:26px;width:26px;border-radius:var(--rsm);border:1px solid rgba(232,64,64,.2);background:rgba(232,64,64,.08);color:var(--red);cursor:pointer;font-size:12px">✕</button>`;
  list.appendChild(row);
}
function checkRentalDupDurs(){
  const sels=[...document.querySelectorAll('[id^="dur-sel-"]')];
  const vals=sels.map(s=>s.value);
  sels.forEach((s,i)=>{
    const isDup=vals.indexOf(s.value)!==i;
    s.style.borderColor=isDup?'var(--red)':'';
    s.style.background=isDup?'rgba(232,64,64,.08)':'';
    s.style.boxShadow=isDup?'0 0 0 2px rgba(232,64,64,.2)':'';
  });
}
function checkDupDurs(){
  const allSels=[
    document.getElementById('eq-dur30-sel'),
    ...document.querySelectorAll('#eq-extra-durs .eq-dur-mins')
  ].filter(Boolean);
  const vals=allSels.map(s=>s.value);
  allSels.forEach((s,i)=>{
    const isDup=vals.indexOf(s.value)!==i;
    s.style.borderColor=isDup?'var(--red)':'';
    s.style.background=isDup?'rgba(232,64,64,.08)':'var(--s2)';
    s.style.boxShadow=isDup?'0 0 0 2px rgba(232,64,64,.2)':'';
  });
}
function addEqDurRow(){
  const list=document.getElementById('eq-extra-durs');if(!list)return;
  const _h=t('durHour')||'godz.';const _d=t('allDay')||'Cały dzień';
  const presets=[[30,'30 min'],[60,`1 ${_h}`],[90,'90 min'],[120,`2 ${_h}`],[180,`3 ${_h}`],[240,`4 ${_h}`],[360,`6 ${_h}`],[720,`12 ${_h}`],[1440,_d]];
  const selOpts=presets.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  const row=document.createElement('div');
  row.className='eq-dur-row';
  row.style.cssText='display:grid;grid-template-columns:1fr 100px 64px 26px;background:var(--s3);padding:4px 8px;border-top:1px solid var(--bd);align-items:center;gap:4px;';
  row.innerHTML=`<div></div>
    <select class="eq-dur-mins" style="width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:3px;padding:3px 6px;font-family:var(--mono);font-size:11px;color:var(--t1);outline:none;cursor:pointer">${selOpts}</select>
    <div style="display:flex;align-items:center;gap:3px"><input class="eq-dur-price" type="number" placeholder="—" min="0" style="width:48px;background:var(--s2);border:1px solid var(--bd);border-radius:3px;padding:3px;font-family:var(--mono);font-size:12px;font-weight:700;color:var(--t1);text-align:center;outline:none"><span style="font-size:11px;color:var(--t3);font-weight:600">zł</span></div>
    <button type="button" onclick="this.parentElement.remove()" style="height:22px;width:22px;border-radius:3px;border:1px solid rgba(232,64,64,.25);background:rgba(232,64,64,.08);color:var(--red);cursor:pointer;font-size:11px">✕</button>`;
  list.appendChild(row);
}
function eqCheckNewType(){
  const typeVal=(document.getElementById('eq-type')?.value||'').trim().toLowerCase();
  const modelVal=(document.getElementById('eq-model')?.value||'').trim();
  const knownTypes=['gokart','rower',...new Set(FLEET.filter(f=>f.type!=='gokart'&&f.type!=='rower').map(f=>f.type.toLowerCase()))];
  const isNewType=typeVal.length>0&&!knownTypes.includes(typeVal);
  // Check model only within the same type (not globally across all types)
  let sameTypeModels=[];
  if(typeVal==='gokart')sameTypeModels=KARTS.map(k=>k.name.toLowerCase());
  else if(typeVal==='rower')sameTypeModels=['rower'];
  else{try{const cp=JSON.parse(localStorage.getItem('rl2_custom_prices')||'{}');sameTypeModels=(cp[typeVal]||[]).map(e=>e.name.toLowerCase());}catch(e){}}
  const isNewModel=modelVal.length>0&&!sameTypeModels.includes(modelVal.toLowerCase());
  const section=document.getElementById('eq-price-section');
  if(section)section.style.display=(isNewType||isNewModel)?'block':'none';
  const spf=document.getElementById('eq-sur-price-first');
  if(spf)spf.placeholder=t('surPricePh')||'zł/godz';
  document.querySelectorAll('.eq-sur-grace').forEach(el=>el.placeholder=t('gracePh')||'Grace period (min)');
}

function initFleetDrag(){
  const list=document.getElementById('fleet-list');
  if(!list)return;
  let dragIdx=null;
  list.querySelectorAll('.fleet-item').forEach(item=>{
    item.addEventListener('dragstart',e=>{
      dragIdx=parseInt(item.dataset.idx);
      item.style.opacity='0.4';
      e.dataTransfer.effectAllowed='move';
    });
    item.addEventListener('dragend',()=>{item.style.opacity='1';dragIdx=null;});
    item.addEventListener('dragover',e=>{
      e.preventDefault();e.dataTransfer.dropEffect='move';
      item.style.borderColor='var(--acc)';
    });
    item.addEventListener('dragleave',()=>{item.style.borderColor='var(--bd)';});
    item.addEventListener('drop',e=>{
      e.preventDefault();item.style.borderColor='var(--bd)';
      const toIdx=parseInt(item.dataset.idx);
      if(dragIdx===null||dragIdx===toIdx)return;
      const moved=FLEET.splice(dragIdx,1)[0];
      FLEET.splice(toIdx,0,moved);
      saveFleet();
      renderSettingsEquipment();
    });
  });
}

function eqUpdateModelOpts(){
  const type=document.getElementById('eq-type')?.value;
  const sel=document.getElementById('eq-model');
  if(!sel)return;
  if(type==='gokart'){
    sel.innerHTML=KARTS.map(k=>`<option value="${k.name}">${k.name}</option>`).join('');
  } else {
    sel.innerHTML=`<option value="Rower">Rower</option>`;
  }
}

function addFleetVehicle(){
  const rawType=(document.getElementById('eq-type')?.value||'').trim();
  const rawModel=(document.getElementById('eq-model')?.value||'').trim();
  const numVal=(document.getElementById('eq-num')?.value||'').trim();
  const errEl=document.getElementById('eq-error');
  if(!rawType||!rawModel||!numVal){
    if(errEl)errEl.textContent='Wypełnij wszystkie pola (typ, model, numer).';
    return;
  }
  const capitalize=s=>s.charAt(0).toUpperCase()+s.slice(1).toLowerCase().split(' ').map((w,i)=>i===0?w:w).join(' ');
  const typeVal=capitalize(rawType);
  const modelVal=capitalize(rawModel);
  const typeLower=typeVal.toLowerCase();
  const numParsed=parseInt(numVal);
  const num=isNaN(numParsed)?numVal:String(numParsed);
  const finalModelVal=((document.getElementById('eq-model')?.value||'').trim()||typeVal);
  const finalCapModel=capitalize(finalModelVal);

  // Check model within the same type only
  let sameTypeExistingModels=[];
  if(typeLower==='gokart')sameTypeExistingModels=KARTS.map(k=>k.name.toLowerCase());
  else if(typeLower==='rower')sameTypeExistingModels=['rower'];
  else{try{const cp=JSON.parse(localStorage.getItem('rl2_custom_prices')||'{}');sameTypeExistingModels=(cp[typeLower]||[]).map(e=>e.name.toLowerCase());}catch(e){}}
  const isNewModel=!sameTypeExistingModels.includes(finalCapModel.toLowerCase());
  const priceSection=document.getElementById('eq-price-section');
  const hasPriceInput=priceSection&&priceSection.style.display!=='none';
  // Validate duplicate durations before saving
  if(hasPriceInput){
    const allDurSels=[document.getElementById('eq-dur30-sel'),...document.querySelectorAll('#eq-extra-durs .eq-dur-mins')].filter(Boolean);
    const durVals=allDurSels.map(s=>s.value);
    if(durVals.length!==new Set(durVals).size){if(errEl)errEl.textContent='Nie można dodać dwóch takich samych okresów.';return;}
  }
  const hasSurcharge=document.querySelectorAll('.eq-sur-row').length>0&&Array.from(document.querySelectorAll('.eq-sur-price')).some(el=>parseInt(el.value)>0);
  if(isNewModel||hasPriceInput||hasSurcharge){
    const p30=parseInt(document.getElementById('eq-price30')?.value)||0;
    const dur30=parseInt(document.getElementById('eq-dur30-sel')?.value)||30;
    const durs=[];
    const durInputs=document.querySelectorAll('#eq-extra-durs .eq-dur-row');
    durInputs.forEach(row=>{
      const mins=parseInt(row.querySelector('.eq-dur-mins')?.value)||0;
      const price=parseInt(row.querySelector('.eq-dur-price')?.value)||0;
      if(mins>0)durs.push({v:mins,p:price});
    });
    const surcharges=[];
    document.querySelectorAll('.eq-sur-row').forEach(row=>{
      const grace=parseInt(row.querySelector('.eq-sur-grace')?.value)||0;
      const sp=parseInt(row.querySelector('.eq-sur-price')?.value)||0;
      if(sp>0)surcharges.push({graceMin:grace||SURCHARGE.graceMin,perHour:sp});
    });
    if(p30>0)durs.unshift({v:dur30,p:p30});
    const entry={name:finalCapModel,type:typeLower,p:{30:durs[0]?.p||0,60:durs[1]?.p||0},durs,surcharges};
    try{
      const cp=JSON.parse(localStorage.getItem('rl2_custom_prices')||'{}');
      cp[typeLower]=cp[typeLower]||[];
      const idx=cp[typeLower].findIndex(e=>e.name.toLowerCase()===finalCapModel.toLowerCase());
      if(idx>=0)cp[typeLower][idx]=entry;else cp[typeLower].push(entry);
      localStorage.setItem('rl2_custom_prices',JSON.stringify(cp));
    }catch(e){}
  }

  const numList=numVal.split(/[,;]+/).map(s=>s.trim()).filter(Boolean);
  numList.sort((a,b)=>{const x=parseInt(a),y=parseInt(b);return(isNaN(x)||isNaN(y))?a.localeCompare(b):x-y;});
  if(numList.length>1){
    let addedCount=0;
    for(const nv of numList){
      const np=parseInt(nv);
      const singleNum=isNaN(np)?nv:String(np);
      const dup=FLEET.find(f=>f.model.toLowerCase()===finalCapModel.toLowerCase()&&f.num===singleNum&&f.type===typeLower);
      if(!dup){FLEET.push({type:typeLower,model:finalCapModel,num:singleNum});addedCount++;}
    }
    if(addedCount>0){saveFleet();renderCennikPanel();renderSettingsEquipment();}
    else{if(errEl)errEl.textContent='Wszystkie podane numery już istnieją.';}
    return;
  }

  const dup=FLEET.find(f=>f.model.toLowerCase()===finalCapModel.toLowerCase()&&f.num===num&&f.type===typeLower);
  if(dup){if(errEl)errEl.textContent=`Pojazd "${finalCapModel}" nr "${num}" już istnieje.`;return;}
  if(errEl)errEl.textContent='';

  FLEET.push({type:typeLower,model:finalCapModel,num});
  saveFleet();
  renderCennikPanel();
  renderSettingsEquipment();
}

function removeFleetVehicle(i){
  const removed=FLEET[i];
  FLEET.splice(i,1);
  saveFleet();
  if(removed&&removed.type!=='gokart'&&removed.type!=='rower'){
    const stillExists=FLEET.some(f=>f.type===removed.type&&f.model===removed.model);
    if(!stillExists){
      try{
        const cp=JSON.parse(localStorage.getItem('rl2_custom_prices')||'{}');
        if(cp[removed.type]){
          cp[removed.type]=cp[removed.type].filter(e=>e.name!==removed.model);
          if(!cp[removed.type].length)delete cp[removed.type];
          localStorage.setItem('rl2_custom_prices',JSON.stringify(cp));
        }
      }catch(e){}
    }
  }
  renderCennikPanel();
  renderSettingsEquipment();
}

function renderSettingsPrices(){
  const inp='background:var(--s2);border:1px solid var(--bd);border-radius:3px;padding:3px 2px;color:var(--t1);font-family:var(--mono);font-size:12px;font-weight:700;outline:none;text-align:center;width:44px';
  const zl='font-size:9px;color:var(--t3)';
  const hdr=(cols)=>`<div style="display:grid;grid-template-columns:${cols};gap:8px;background:#1a1a1a;padding:4px 8px;align-items:center">`;
  const subHdr=(label)=>`<div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;padding:7px 10px 4px;border-top:1px solid var(--bd)">${label}</div>`;
  const row=(cols,content)=>`<div style="display:grid;grid-template-columns:${cols};gap:8px;padding:5px 8px;border-top:1px solid var(--bd);align-items:center">${content}</div>`;
  const cell=(id,val,unit,min='0')=>`<div style="display:flex;align-items:center;justify-content:center;gap:2px"><input type="number" id="${id}" value="${val}" min="${min}" max="999" style="${inp}"><span style="${zl}">${unit}</span></div>`;
  const lbl=(text)=>`<div style="font-size:11px;font-weight:700;color:var(--t1)">${text}</div>`;

  let cp={};try{cp=JSON.parse(localStorage.getItem('rl2_custom_prices')||'{}');}catch(e){}
  const customTypes=[...new Set(FLEET.filter(f=>f.type!=='gokart'&&f.type!=='rower').map(f=>f.type))];
  const _h=t('durHour')||'godz.';const _d=t('allDay')||'Cały dzień';
  const durLabels={30:'30 min',60:`1 ${_h}`,90:'90 min',120:`2 ${_h}`,180:`3 ${_h}`,240:`4 ${_h}`,360:`6 ${_h}`,720:`12 ${_h}`,1440:_d};
  const backBtn=`<button onclick="showV('settings')" style="height:32px;padding:0 12px;border-radius:var(--rsm);border:1px solid var(--bd);background:var(--s2);color:var(--t2);cursor:pointer;font-size:12px;font-weight:500;display:flex;align-items:center;gap:6px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>${t('settPricesBack')||'Powrót'}</button>`;

  // ── Custom type price cards (same design as Gokarty/Rowery) ──
  const customPriceCards=customTypes.map(type=>{
    const entries=cp[type]||[];
    const typeLabel=type.charAt(0).toUpperCase()+type.slice(1);
    if(!entries.length)return `<div class="sett-card"><h3>${typeLabel} <span style="font-weight:400;color:var(--t3);font-size:10px">— brak cen</span></h3><div style="font-size:11px;color:var(--t2)">Dodaj pojazdy z cenami w <button onclick="showV('settings-equipment')" style="background:none;border:none;color:var(--acc);cursor:pointer;font-size:11px;padding:0;font-family:var(--font)">${t('settEquipTitle')||'Zarządzaniu sprzętem'}</button>.</div></div>`;
    const allDurVals=[...new Set(entries.flatMap(e=>(e.durs&&e.durs.length?e.durs:[{v:30},{v:60}]).map(d=>d.v)))].sort((a,b)=>a-b);
    const colsCss=`1fr ${allDurVals.map(()=>'68px').join(' ')}`;
    return `<div class="sett-card">
      <h3>${typeLabel}</h3>
      <div style="background:var(--s2);border-radius:var(--rsm);overflow:hidden">
        ${hdr(colsCss)}<div style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase">${t('cpMarka')||'MARKA'}</div>${allDurVals.map(v=>`<div style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase;text-align:center">${durLabels[v]||v+'m'}</div>`).join('')}</div>
        ${entries.map((e,ei)=>row(colsCss,`${lbl(e.name.toUpperCase())}${allDurVals.map(dv=>{const d=(e.durs||[]).find(x=>x.v===dv);return cell(`ctp-${type}-${ei}-${dv}`,d?d.p:0,'zł');}).join('')}`)  ).join('')}
      </div>
      <button class="btn btn-p" style="margin-top:8px;width:auto;padding:0 14px;height:28px;font-size:11px" onclick="saveCustomTypePrices('${type}')">${t('settSave')||'Zapisz'} ${typeLabel}</button>
    </div>`;
  }).join('');

  // ── Custom type surcharge rows for unified dopłaty section ──
  const _surGraceHdr=t('settSurGrace')||'PO MIN';
  const _surDoplataHdr=t('cpDoplataLbl')||'DOPŁATA';
  const customSurRows=customTypes.map(type=>{
    const entries=cp[type]||[];
    const typeLabel=type.charAt(0).toUpperCase()+type.slice(1);
    if(!entries.length)return '';
    const hasSur=entries.some(e=>e.surcharges&&e.surcharges.length);
    if(!hasSur)return '';
    return `${subHdr(typeLabel)}
      <div style="padding:0 10px 8px">
        ${entries.map((e,ei)=>{
          const surs=e.surcharges||[];
          if(!surs.length)return `<div style="margin-bottom:6px;font-size:10px;color:var(--t3)">${e.name}</div>`;
          return `<div style="margin-bottom:10px">
            <div style="font-size:10px;font-weight:700;color:var(--t2);margin-bottom:4px">${e.name.toUpperCase()}</div>
            <div style="background:var(--s2);border-radius:3px;overflow:hidden">
              ${hdr('1fr 68px')}<div></div><div style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase;text-align:center">${_surDoplataHdr}</div></div>
              ${surs.map((s,si)=>row('1fr 68px',`<div style="font-size:11px;color:var(--t2);padding-left:2px">Po ${s.graceMin||0} min</div>${cell('ctsur-'+type+'-'+ei+'-ph-'+si,s.perHour||0,'zł','1')}`)).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }).join('');

  document.getElementById('content').innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      ${backBtn}
      <h2 style="font-size:15px;font-weight:700">${t('settPricesTitle')||'Edycja cen'}</h2>
    </div>

    <div class="sett-card">
      <h3>${t('settKarts')||'Gokarty'}</h3>
      <div style="background:var(--s2);border-radius:var(--rsm);overflow:hidden">
        ${hdr('1fr 76px 76px')}<div style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase">${t('cpMarka')||'MARKA'}</div><div style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase;text-align:center">30 min</div><div style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase;text-align:center">1 ${t('durHour')||'godz.'}</div></div>
        ${KARTS.map((k,i)=>row('1fr 76px 76px',`${lbl(k.name.toUpperCase())}${cell('kp-'+i+'-30',k.p[30],'zł')}${cell('kp-'+i+'-60',k.p[60],'zł')}`)).join('')}
      </div>
      <button class="btn btn-p" style="margin-top:8px;width:auto;padding:0 14px;height:28px;font-size:11px" onclick="saveKartPrices()">${t('settSaveKarts')||'Zapisz gokarty'}</button>
    </div>

    <div class="sett-card">
      <h3>${t('settBikes')||'Rowery'}</h3>
      <div style="background:var(--s2);border-radius:var(--rsm);overflow:hidden">
        ${hdr('1fr 52px')}<div style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase">${t('cpTime')||'CZAS'}</div><div style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase;text-align:center">${t('cpPrice')||'CENA'}</div></div>
        ${[[60,t('cpHour')||'1 GODZINA'],[180,t('cpHours3')||'3 GODZINY'],[1440,t('allDay')||'CAŁY DZIEŃ']].map(([dur,name])=>row('1fr 52px',`${lbl(name.toUpperCase())}${cell('bp-'+dur,BIKES[dur],'zł','1')}`)).join('')}
      </div>
      <button class="btn btn-p" style="margin-top:8px;width:auto;padding:0 14px;height:28px;font-size:11px" onclick="saveBikePrices()">${t('settSaveBikes')||'Zapisz rowery'}</button>
    </div>

    ${customPriceCards}

    <div class="sett-card">
      <h3>${t('settSurTitle')||'Ustawienia dopłat'}</h3>
      <div style="background:var(--s2);border-radius:var(--rsm);overflow:hidden">
        ${subHdr(t('settSurCommon')||'Wspólne')}
        <div style="padding:0 10px 8px">${row('1fr 60px',`${lbl(t('settSurGrace')||'Czas bez dopłaty')}${cell('sp-grace',SURCHARGE.graceMin,'min')}`).replace('border-top:1px solid var(--bd)','')}</div>
        ${subHdr(t('settKarts')||'Gokarty')}
        <div style="padding:0 10px 8px">${row('1fr 60px',`${lbl(t('settSurKartH')||'Dopłata / godz.')}${cell('sp-kart',SURCHARGE.kartHour,'zł','1')}`).replace('border-top:1px solid var(--bd)','')}</div>
        ${subHdr(t('settBikes')||'Rowery')}
        <div style="padding:0 10px 8px">
          ${[['sp-bike1',t('settSurBike1')||'Do 1h',SURCHARGE.bikeUpto1h],['sp-bike3',t('settSurBike3')||'Do 3h',SURCHARGE.bikeUpto3h],['sp-bikeh',t('settSurBikeH')||'Każda nast. godz.',SURCHARGE.bikePerHour]].map(([id,name,val])=>row('1fr 60px',`${lbl(name)}${cell(id,val,'zł','1')}`).replace('border-top:1px solid var(--bd)','')).join('')}
        </div>
        ${customSurRows}
      </div>
      <button class="btn btn-p" style="margin-top:8px;width:auto;padding:0 14px;height:28px;font-size:11px" onclick="saveSurchargePrices()">${t('settSaveSur')||'Zapisz dopłaty'}</button>
    </div>`;
}
function saveCustomTypePrices(type){
  try{
    const cp=JSON.parse(localStorage.getItem('rl2_custom_prices')||'{}');
    const entries=cp[type]||[];
    const allDurVals=[...new Set(entries.flatMap(e=>(e.durs&&e.durs.length?e.durs:[{v:30},{v:60}]).map(d=>d.v)))].sort((a,b)=>a-b);
    entries.forEach((e,ei)=>{
      const newDurs=allDurVals.map(dv=>{const p=parseInt(document.getElementById(`ctp-${type}-${ei}-${dv}`)?.value)||0;return{v:dv,p};}).filter(d=>d.p>0);
      e.durs=newDurs;
      e.p={30:newDurs.find(d=>d.v===30)?.p||0,60:newDurs.find(d=>d.v===60)?.p||0};
    });
    localStorage.setItem('rl2_custom_prices',JSON.stringify(cp));
    renderCennikPanel();
    const btn=event.target;const orig=btn.textContent;
    btn.textContent='✓ Zapisano';btn.style.background='var(--green)';
    setTimeout(()=>{btn.textContent=orig;btn.style.background='';},1500);
  }catch(e){console.error(e);}
}
function saveCustomTypeSurcharges(type,existingCp){
  try{
    const cp=existingCp||JSON.parse(localStorage.getItem('rl2_custom_prices')||'{}');
    const entries=cp[type]||[];
    entries.forEach((e,ei)=>{
      (e.surcharges||[]).forEach((s,si)=>{
        const g=document.getElementById(`ctsur-${type}-${ei}-grace-${si}`);
        const p=document.getElementById(`ctsur-${type}-${ei}-ph-${si}`);
        if(g)s.graceMin=parseInt(g.value)||0;
        if(p)s.perHour=parseInt(p.value)||0;
      });
    });
    if(!existingCp)localStorage.setItem('rl2_custom_prices',JSON.stringify(cp));
  }catch(e){console.error(e);}
}

function togglePriceEdit(id){const el=document.getElementById(id);if(el)el.style.display=el.style.display==='none'?'block':'none';}
function saveKartPrices(){
  KARTS.forEach((k,i)=>{
    const p30=parseInt(document.getElementById(`kp-${i}-30`)?.value)||k.p[30];
    const p60=parseInt(document.getElementById(`kp-${i}-60`)?.value)||k.p[60];
    k.p[30]=p30; k.p[60]=p60;
  });
  savePrices();
  renderCennikPanel();
  const btn=event.target;const orig=btn.textContent;
  btn.textContent='✓ Zapisano';btn.style.background='var(--green)';
  setTimeout(()=>{btn.textContent=orig;btn.style.background='';},1500);
}
function saveBikePrices(){
  [60,180,1440].forEach(dur=>{
    const v=parseInt(document.getElementById(`bp-${dur}`)?.value);
    if(v>0) BIKES[dur]=v;
  });
  savePrices();
  renderCennikPanel();
  const btn=event.target;const orig=btn.textContent;
  btn.textContent='✓ Zapisano';btn.style.background='var(--green)';
  setTimeout(()=>{btn.textContent=orig;btn.style.background='';},1500);
}
function saveSurchargePrices(){
  const g=parseInt(document.getElementById('sp-grace')?.value);
  const k=parseInt(document.getElementById('sp-kart')?.value);
  const b1=parseInt(document.getElementById('sp-bike1')?.value);
  const b3=parseInt(document.getElementById('sp-bike3')?.value);
  const bh=parseInt(document.getElementById('sp-bikeh')?.value);
  if(g>0)SURCHARGE.graceMin=g;
  if(k>0)SURCHARGE.kartHour=k;
  if(b1>0)SURCHARGE.bikeUpto1h=b1;
  if(b3>0)SURCHARGE.bikeUpto3h=b3;
  if(bh>0)SURCHARGE.bikePerHour=bh;
  savePrices();
  // also save custom type surcharges
  try{const cp=JSON.parse(localStorage.getItem('rl2_custom_prices')||'{}');Object.keys(cp).forEach(type=>saveCustomTypeSurcharges(type,cp));}catch(e){}
  renderCennikPanel();
  const btn=event.target;const orig=btn.textContent;
  btn.textContent='✓ Zapisano';btn.style.background='var(--green)';
  setTimeout(()=>{btn.textContent=orig;btn.style.background='';},1500);
}
function renameUser(id){
  const u=users.find(x=>x.id===id);if(!u)return;
  const inp=document.getElementById('uname-'+id);if(!inp)return;
  const newName=inp.value.trim();
  if(!newName)return;
  u.name=newName;
  IAPI.saveUsers(users);
  renderSettings();
}

function togglePerm(uid,key,val){const u=users.find(x=>x.id===uid);if(!u)return;if(!u.perms)u.perms={...DEFAULT_PERMS};u.perms[key]=val;IAPI.saveUsers(users);}
function addUser(){const name=document.getElementById('new-uname').value.trim();if(!name)return;users.push({id:uid(),name,role:'user',perms:{...DEFAULT_PERMS}});IAPI.saveUsers(users);renderSettings();}
function delUser(id){if(!confirm('Usunąć użytkownika?'))return;users=users.filter(u=>u.id!==id);IAPI.saveUsers(users);renderSettings();}

// ═══ BACKUP — export / import ═══
async function exportAllData(){
  const msg=document.getElementById('backup-msg');
  try{
    if(msg){msg.textContent='Eksportowanie...';msg.style.color='var(--t2)';}
    const d=await IAPI.getData();
    const kvKeys=['rl2_fleet','rl2_custom_prices','rl2_prices','rl2_tasks','rl2_report_categories','rl2_pdf_fields','rl2_theme'];
    const backup={version:2,exportedAt:Date.now(),rl2_r:d.rentals,rl2_u:d.users,rl2_sessions:d.sessions};
    kvKeys.forEach(k=>{try{const v=localStorage.getItem(k);if(v!==null)backup[k]=JSON.parse(v);}catch(e){}});
    const json=JSON.stringify(backup,null,2);
    const today=new Date();
    const ds=`${p2(today.getDate())}_${p2(today.getMonth()+1)}_${today.getFullYear()}`;
    const storedPw=localStorage.getItem('rl2_export_pw')||'';
    const a=document.createElement('a');
    if(storedPw.length>0){
      const encrypted=await _rlxEncrypt(json,storedPw);
      const blob=new Blob([encrypted],{type:'application/octet-stream'});
      a.href=URL.createObjectURL(blob);
      a.download=`relax_backup_${ds}.rlx`;
    } else {
      a.href='data:application/json;charset=utf-8,'+encodeURIComponent(json);
      a.download=`relax_backup_${ds}.json`;
    }
    document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);if(a.href.startsWith('blob:'))URL.revokeObjectURL(a.href);},500);
    if(msg){msg.textContent=t('settExportOk')||'✓ Eksport gotowy';msg.style.color='var(--green)';setTimeout(()=>{if(msg)msg.textContent='';},3000);}
  }catch(e){if(msg){msg.textContent='Błąd eksportu: '+e.message;msg.style.color='var(--red)';}}
}

function importAllData(){
  const msg=document.getElementById('backup-msg');
  const inp=document.createElement('input');
  inp.type='file';inp.accept='.json,.rlx';
  inp.onchange=async function(ev){
    const file=ev.target.files[0];if(!file)return;
    try{
      let data;
      if(file.name.endsWith('.rlx')){
        const buf=await file.arrayBuffer();
        const bytes=new Uint8Array(buf);
        const storedPw=localStorage.getItem('rl2_export_pw')||'';
        if(!storedPw){if(msg){msg.textContent=(t('settExportPwHint')||'Ustaw hasło eksportu w Panelu administratora przed importem.');msg.style.color='var(--red)';}return;}
        const plain=await _rlxDecrypt(bytes,storedPw);
        if(!plain){if(msg){msg.textContent=t('backupDecryptFailed')||'Błędne hasło lub uszkodzony plik.';msg.style.color='var(--red)';}return;}
        data=JSON.parse(plain);
      } else {
        const text=await file.text();
        data=JSON.parse(text);
      }
      if(!data||!data.version){if(msg){msg.textContent='Nieprawidłowy plik kopii zapasowej.';msg.style.color='var(--red)';}return;}
      if(!confirm('Czy na pewno chcesz przywrócić dane? Obecne dane zostaną zastąpione przez dane z pliku!'))return;
      if(msg){msg.textContent='Importowanie...';msg.style.color='var(--t2)';}
      if(Array.isArray(data.rl2_r))await IAPI.saveRentals(data.rl2_r);
      if(Array.isArray(data.rl2_u))await IAPI.saveUsers(data.rl2_u);
      if(Array.isArray(data.rl2_sessions))await IAPI.saveSessions(data.rl2_sessions);
      const kvKeys=['rl2_fleet','rl2_custom_prices','rl2_prices','rl2_tasks','rl2_report_categories','rl2_pdf_fields','rl2_theme'];
      for(const k of kvKeys){if(data[k]!==undefined&&data[k]!==null){try{await IAPI._kvSet(k,data[k]);}catch(e){}}}
      if(msg){msg.textContent='✓ Import zakończony — ponowne ładowanie...';msg.style.color='var(--green)';}
      setTimeout(()=>window.location.reload(),800);
    }catch(e){if(msg){msg.textContent='Błąd importu: '+e.message;msg.style.color='var(--red)';}}
  };
  inp.click();
}
