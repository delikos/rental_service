// ═══ TASKS VIEW ═══
var tasks=[];
function loadTasks(){try{const s=localStorage.getItem('rl2_tasks');if(s)tasks=JSON.parse(s);}catch(e){}}
function saveTasks(){try{localStorage.setItem('rl2_tasks',JSON.stringify(tasks));}catch(e){}}

function renderTasks(){
  loadTasks();
  const inSt='width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:8px 10px;color:var(--t1);font-family:var(--font);font-size:12px;outline:none';
  const assignees=[{v:'',l:t('tasksAssignNone')||'— nie przypisano —'},{v:'worker',l:t('tasksWorker')||'Pracownik'},{v:'service',l:t('tasksService')||'Serwisant'}];
  document.getElementById('content').innerHTML=`
    <div class="sett-card">
      <h3>${t('tasksList')||'Lista zadań'} (${tasks.length})</h3>
      ${tasks.length===0?`<div style="color:var(--t3);font-size:13px;padding:8px 0">${t('tasksNone')||'Brak zadań'}</div>`:
        tasks.slice().reverse().map(tk=>`
          <div style="background:var(--s2);border:1px solid var(--bd);border-radius:var(--rsm);padding:12px 14px;margin-bottom:10px">
            <div style="display:flex;align-items:flex-start;gap:10px">
              <div style="flex:1">
                <div style="font-size:15px;font-weight:700;margin-bottom:6px;color:var(--t1)">${tk.title}</div>
                <div style="font-size:12px;color:#fff;display:flex;gap:12px;flex-wrap:wrap;margin-bottom:${tk.desc?'8px':'0'}">
                  ${tk.date?`<span>📅 ${tk.date}</span>`:''}
                  <span>👤 ${tk.author}</span>
                  ${tk.assignee?`<span>🔧 ${tk.assignee==='worker'?t('tasksWorker')||'Pracownik':t('tasksService')||'Serwisant'}</span>`:''}
                </div>
                ${tk.desc?`<div style="font-size:13px;color:#fff;white-space:pre-wrap;word-break:break-word;line-height:1.5">${tk.desc}</div>`:''}
              </div>
              <div style="display:flex;gap:5px;flex-shrink:0">
                <button onclick="editTask('${tk.id}')" style="width:28px;height:28px;border-radius:5px;border:1px solid var(--bd);background:var(--s3);color:var(--t2);cursor:pointer;font-size:12px" title="Edytuj">✏️</button>
                <button onclick="deleteTask('${tk.id}')" style="width:28px;height:28px;border-radius:5px;border:1px solid rgba(232,64,64,.25);background:rgba(232,64,64,.08);color:var(--red);cursor:pointer;font-size:13px">✕</button>
              </div>
            </div>
          </div>`).join('')}
    </div>

    <div id="task-form-wrap" style="display:none">
    <div class="sett-card">
      <h3>${t('tasksNew')||'Nowe zadanie'}</h3>
      <div class="fg2" style="margin-bottom:8px">
        <div class="fr"><label>${t('tasksTitle')||'Tytuł *'}</label><input id="task-title" placeholder="${t('tasksShortDesc')||'Opis problemu w skrócie'}" style="${inSt}"></div>
        <div class="fr"><label>${t('tasksDate')||'Data wystąpienia'}</label><input type="text" id="task-date" placeholder="np. ${new Date().toLocaleDateString('pl-PL')}" style="${inSt}" oninput="(function(el){const v=el.value.replace(/[^0-9.]/g,'');el.value=v;el.style.borderColor=v&&!/^\d{2}\.\d{2}\.\d{4}$/.test(v)?'var(--red)':'var(--bd)'})(this)" onblur="(function(el){const v=el.value.trim();if(v&&/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(v)){const parts=v.split('.');el.value=parts[0].padStart(2,'0')+'.'+parts[1].padStart(2,'0')+'.'+parts[2];}el.style.borderColor=el.value&&!/^\d{2}\.\d{2}\.\d{4}$/.test(el.value)?'var(--red)':'var(--bd)'})(this)"></div>
      </div>
      <div class="fg2" style="margin-bottom:8px">
        <div class="fr"><label>${t('tasksAssign')||'Przypisz do'}</label>
          <select id="task-assignee" style="${inSt};cursor:pointer">
            ${assignees.map(a=>`<option value="${a.v}">${a.l}</option>`).join('')}
          </select>
        </div>
        <div class="fr"><label>${t('tasksAuthor')||'Dodał'}</label>
          <input value="${currentUser?.name||''}" disabled style="${inSt};opacity:.6">
        </div>
      </div>
      <div class="fr" style="margin-bottom:10px"><label>${t('tasksDesc')||'Opis'}</label>
        <textarea id="task-desc" rows="3" placeholder="${t('tasksFullDesc')||'Szczegółowy opis problemu...'}" style="${inSt};resize:vertical;min-height:70px"></textarea>
      </div>
      <div id="task-err" style="color:var(--red);font-size:11px;min-height:14px;margin-bottom:6px"></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-p" id="task-save-btn" onclick="addTask()" style="flex:none;width:auto;padding:0 16px;height:30px;font-size:11px">${t('tasksSave')||'Zapisz zadanie'}</button>
        <button class="btn btn-g" onclick="toggleTaskForm()" style="width:auto;padding:0 16px;height:30px;font-size:11px">${t('tasksCancel')||'Anuluj'}</button>
      </div>
    </div>
    </div>
    <div style="margin-top:4px"><button class="btn btn-p" style="flex:none;width:auto;padding:0 14px;height:30px;font-size:11px" onclick="toggleTaskForm()">${t('tasksNew')||'+ Nowe zadanie'}</button></div>`;
}

function toggleTaskForm(){
  const w=document.getElementById('task-form-wrap');
  if(w){
    const isOpen=w.style.display!=='none';
    w.style.display=isOpen?'none':'block';
    if(!isOpen){
      const saveBtn=document.getElementById('task-save-btn');
      if(saveBtn){saveBtn.onclick=addTask;saveBtn.textContent=t('tasksSave')||'Zapisz zadanie';}
      document.getElementById('task-title').value='';
      document.getElementById('task-date').value='';
      document.getElementById('task-assignee').value='';
      document.getElementById('task-desc').value='';
      document.getElementById('task-err').textContent='';
    }
  }
}

function editTask(id){
  const tk=tasks.find(t=>t.id===id);if(!tk)return;
  const w=document.getElementById('task-form-wrap');
  if(w){
    w.style.display='block';
    document.getElementById('task-title').value=tk.title||'';
    document.getElementById('task-date').value=tk.date||'';
    document.getElementById('task-assignee').value=tk.assignee||'';
    document.getElementById('task-desc').value=tk.desc||'';
    document.getElementById('task-err').textContent='';
    const saveBtn=document.getElementById('task-save-btn');
    if(saveBtn){
      saveBtn.textContent=t('tasksEditSave')||'Zapisz zmiany';
      saveBtn.onclick=()=>saveEditTask(id);
    }
    w.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
}

function saveEditTask(id){
  const title=document.getElementById('task-title')?.value.trim();
  const errEl=document.getElementById('task-err');
  if(!title){if(errEl)errEl.textContent='Tytuł jest wymagany.';return;}
  if(errEl)errEl.textContent='';
  const tk=tasks.find(t=>t.id===id);if(!tk)return;
  tk.title=title;
  tk.date=document.getElementById('task-date')?.value||'';
  tk.assignee=document.getElementById('task-assignee')?.value||'';
  tk.desc=document.getElementById('task-desc')?.value.trim()||'';
  saveTasks();renderTasks();
}

function addTask(){
  const title=document.getElementById('task-title')?.value.trim();
  const errEl=document.getElementById('task-err');
  if(!title){if(errEl)errEl.textContent='Tytuł jest wymagany.';return;}
  if(errEl)errEl.textContent='';
  tasks.push({id:uid(),title,date:document.getElementById('task-date')?.value||new Date().toISOString().slice(0,10),assignee:document.getElementById('task-assignee')?.value||'',desc:document.getElementById('task-desc')?.value.trim()||'',author:currentUser?.name||'',createdTs:Date.now()});
  saveTasks();renderTasks();
}

function deleteTask(id){tasks=tasks.filter(t=>t.id!==id);saveTasks();renderTasks();}
