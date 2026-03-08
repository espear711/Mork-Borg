
  // ─── Storage namespace (scoped to this file's path) ───
  const STORAGE_PREFIX = 'gemini_chat_' + window.location.pathname + '_';

  function storageKey(k) { return STORAGE_PREFIX + k; }

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(storageKey(key))) || fallback; }
    catch { return fallback; }
  }
  function saveJSON(key, val) { localStorage.setItem(storageKey(key), JSON.stringify(val)); }

  // ─── State ───
  let chats = loadJSON('chats', {});        // { id: { title, messages: [{role,text}] } }
  let activeChatId = loadJSON('activeChat', null);
  let apiKey = localStorage.getItem(storageKey('apiKey')) || '';
  let memoryDepth = loadJSON('memoryDepth', 40);
  let tableFileHandle = null;
  let randomTables = loadJSON('randomTables', []);
  let editingTableId = null;
  let collapsedTableGroups = loadJSON('collapsedTableGroups', {});

  const MODEL = 'gemini-3.1-flash-lite-preview';

  // ─── Side Panel Toggle ───
  let activePanel = null;

  function togglePanel(name) {
    const panel = document.getElementById('sidePanel');
    const panels = { chat: 'panelChat', lore: 'panelLore', tables: 'panelTables', pipeline: 'panelPipeline', playstate: 'panelPlaystate', console: 'panelConsole', settings: 'panelSettings' };
    const tabs = { chat: 'tabChat', lore: 'tabLore', tables: 'tabTables', pipeline: 'tabPipeline', playstate: 'tabPlaystate', console: 'tabConsole', settings: 'tabSettings' };

    // Clicking the already-active tab collapses the panel
    if (activePanel === name) {
      panel.classList.remove('open');
      document.getElementById(tabs[name]).classList.remove('active');
      document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
      activePanel = null;
      return;
    }

    // Deactivate all tabs & panels
    Object.values(tabs).forEach(id => document.getElementById(id).classList.remove('active'));
    document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));

    // Activate the selected tab & panel
    document.getElementById(tabs[name]).classList.add('active');
    document.getElementById(panels[name]).classList.add('active');
    panel.classList.add('open');
    activePanel = name;
  }

  // ─── Init ───
  if (apiKey) {
    document.getElementById('apiKeyInput').value = apiKey;
    setApiStatus(true);
  }
  document.getElementById('memoryDepthInput').value = memoryDepth;
  renderChatList();
  renderMessages();

  // ─── API Key ───
  function saveApiKey() {
    const val = document.getElementById('apiKeyInput').value.trim();
    if (!val) return;
    apiKey = val;
    localStorage.setItem(storageKey('apiKey'), apiKey);
    setApiStatus(true);
  }

  function setApiStatus(connected) {
    const el = document.getElementById('apiStatus');
    if (connected) {
      el.textContent = 'Key saved';
      el.className = 'api-status connected';
    } else {
      el.textContent = 'No key';
      el.className = 'api-status disconnected';
    }
  }

  function saveMemoryDepth() {
    const val = parseInt(document.getElementById('memoryDepthInput').value);
    memoryDepth = Math.max(4, Math.min(500, val || 40));
    document.getElementById('memoryDepthInput').value = memoryDepth;
    saveJSON('memoryDepth', memoryDepth);
    mtmUpdateStatus();
  }

  // ─── Chat Management ───
  function newChat() {
    const id = 'chat_' + Date.now();
    chats[id] = { title: 'New Chat', messages: [] };
    activeChatId = id;
    persist();
    renderChatList();
    renderMessages();
    document.getElementById('userInput').focus();
  }

  function switchChat(id) {
    activeChatId = id;
    saveJSON('activeChat', activeChatId);
    renderChatList();
    renderMessages();
    mtmRenderSummary();
    mtmUpdateStatus();
    renderPlaystate();
  }

  function deleteChat(id, ev) {
    ev.stopPropagation();
    if (!confirm('Delete this chat? This cannot be undone.')) return;
    delete chats[id];
    delete playstateData[id];
    if (activeChatId === id) activeChatId = Object.keys(chats)[0] || null;
    persist();
    saveJSON('playstateData', playstateData);
    renderChatList();
    renderMessages();
    mtmRenderSummary();
    mtmUpdateStatus();
    renderPlaystate();
  }

  function persist() {
    saveJSON('chats', chats);
    saveJSON('activeChat', activeChatId);
  }

  // ─── Rendering ───
  function renderChatList() {
    const list = document.getElementById('chatList');
    list.innerHTML = '';
    const ids = Object.keys(chats).reverse();
    for (const id of ids) {
      const chat = chats[id];
      const div = document.createElement('div');
      div.className = 'chat-item' + (id === activeChatId ? ' active' : '');
      div.innerHTML = `
        <span class="chat-item-title">${escapeHtml(chat.title)}</span>
        <button class="chat-item-delete" onclick="deleteChat('${id}', event)" title="Delete">&times;</button>
      `;
      div.addEventListener('click', () => switchChat(id));
      list.appendChild(div);
    }
  }

  function renderMessages() {
    const container = document.getElementById('messages');
    container.innerHTML = '';

    if (!activeChatId || !chats[activeChatId]) {
      container.innerHTML = `
        <div class="welcome">
          <h1>Gemini Chat</h1>
          <p>Open Settings (gear icon) to enter your Gemini API key, then start a conversation.</p>
        </div>`;
      return;
    }

    const msgs = chats[activeChatId].messages;
    if (msgs.length === 0) {
      container.innerHTML = `
        <div class="welcome">
          <h1>Start chatting</h1>
          <p>Type a message below to begin your conversation.</p>
        </div>`;
      return;
    }

    for (let i = 0; i < msgs.length; i++) {
      const msg = msgs[i];
      const div = document.createElement('div');
      div.className = 'message ' + msg.role;
      
      const contentDiv = document.createElement('div');
      if (typeof marked !== 'undefined') {
        contentDiv.innerHTML = marked.parse(msg.text, { breaks: true });
      } else {
        contentDiv.textContent = msg.text;
      }
      div.appendChild(contentDiv);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'message-actions';
      
      let actionsHtml = `
        <button class="msg-btn" onclick="editMessage(${i})" title="Edit">
          <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        <button class="msg-btn" onclick="deleteMessage(${i})" title="Delete">
          <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      `;

      if (msg.role === 'user') {
        actionsHtml = `
          <button class="msg-btn" onclick="retryMessage(${i})" title="Retry (Deletes subsequent messages)">
            <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
          </button>
        ` + actionsHtml;
      }
      
      actionsDiv.innerHTML = actionsHtml;
      div.appendChild(actionsDiv);

      container.appendChild(div);
    }

    container.scrollTop = container.scrollHeight;
  }

  // ─── Send Message ───
  async function sendMessage() {
    const input = document.getElementById('userInput');
    let userText = input.value.trim();
    if (!userText) return;

    if (!apiKey) {
      alert('Please enter and save your Gemini API key first.');
      return;
    }

    devLog(`--- New Message Flow Started ---`, 'info');
    devLog(`Raw User Input: "${userText}"`, 'info');

    // Auto-create a chat if none active
    if (!activeChatId || !chats[activeChatId]) {
      newChat();
    }

    const chat = chats[activeChatId];

    // Process !Commands in user message
    const processedUserText = processCommands(userText, 'User Input');
    if (processedUserText !== userText) {
      devLog(`User Input amended by commands: "${processedUserText}"`, 'success');
    }
    userText = processedUserText;

    // Add user message
    chat.messages.push({ role: 'user', text: userText });
    // Auto-title from first message
    if (chat.messages.length === 1) {
      chat.title = userText.length > 40 ? userText.substring(0, 40) + '...' : userText;
    }
    persist();
    renderChatList();
    renderMessages();

    input.value = '';
    autoResize(input);

    // Show typing indicator & disable send
    const typing = document.getElementById('typingIndicator');
    const sendBtn = document.getElementById('sendBtn');
    typing.style.display = 'block';
    sendBtn.disabled = true;

    try {
      const passes = pipeline.passes;
      const passResults = []; // accumulate results from each pass

      if (passes.length > 0) devLog(`Pipeline: ${passes.length} intermediate passes configured.`, 'info');

      // Run intermediate passes
      for (let i = 0; i < passes.length; i++) {
        devLog(`Pipeline Pass ${i + 1} Starting...`, 'info');
        const pass = passes[i];
        const extraSystem = buildPassSystemPrompt(pass.instructions, passResults, i);
        let result = await callGemini(chat.messages, {
          useLorebook: pass.useLorebook,
          useMtm: pass.useMtm,
          useChatHistory: pass.useChatHistory,
          extraSystem
        });
        
        devLog(`Pipeline Pass ${i + 1} Result (Raw): "${result}"`, 'info');
        
        // Process !Commands in the AI's output
        const processedResult = processCommands(result, `Pipeline Pass ${i + 1}`);
        if (processedResult !== result) {
          devLog(`Pipeline Pass ${i + 1} amended by commands: "${processedResult}"`, 'success');
        }
        result = processedResult;
        passResults.push({ passIndex: i + 1, text: result });
      }

      // Final pass
      devLog(`Final Pass Starting...`, 'info');
      const finalExtra = buildPassSystemPrompt(
        pipeline.finalInstructions || '',
        passResults,
        passes.length
      );
      let replyText = await callGemini(chat.messages, {
        useLorebook: pipeline.finalUseLore !== false,
        useMtm: pipeline.finalUseMtm !== false,
        useChatHistory: pipeline.finalUseHistory !== false,
        extraSystem: finalExtra
      });
      
      devLog(`Final Pass Result (Raw): "${replyText}"`, 'info');
      
      // Process !Commands in the final output
      const processedReply = processCommands(replyText, 'Final Pass');
      if (processedReply !== replyText) {
        devLog(`Final Pass amended by commands: "${processedReply}"`, 'success');
      }
      replyText = processedReply;
      
      chat.messages.push({ role: 'assistant', text: replyText });
      devLog(`--- Message Flow Completed Successfully ---`, 'success');
    } catch (err) {
      chat.messages.push({ role: 'error', text: 'Error: ' + err.message });
      devLog(`Error in message flow: ${err.message}`, 'error');
    }

    persist();
    typing.style.display = 'none';
    sendBtn.disabled = false;
    renderMessages();
    document.getElementById('userInput').focus();

    // Check if mid-term memory needs to summarize (runs in background)
    mtmCheckAndSummarize();
    mtmRenderSummary();
    
    // Check and update playstate (runs in background)
    updatePlaystate();
  }

  // ─── Message Actions ───
  function editMessage(idx) {
    if (!activeChatId) return;
    const chat = chats[activeChatId];
    const msg = chat.messages[idx];
    
    const container = document.getElementById('messages').children[idx];
    const contentDiv = container.querySelector('div');
    const currentHeight = contentDiv.offsetHeight;
    contentDiv.innerHTML = `
      <textarea style="width:100%; min-height:${Math.max(80, currentHeight)}px; box-sizing:border-box; background:var(--gray-darkest); color:var(--white); border:1px solid var(--red-accent); padding:8px; border-radius:6px; font-family:inherit; resize:vertical;">${escapeHtml(msg.text)}</textarea>
      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
        <button class="msg-btn" onclick="renderMessages()" style="background:var(--gray-mid); padding:4px 12px; border-radius:4px; font-size:0.8rem;">Cancel</button>
        <button class="msg-btn" onclick="saveEdit(${idx}, this)" style="background:var(--red-dark); padding:4px 12px; border-radius:4px; color:white; font-size:0.8rem;">Save</button>
      </div>
    `;
    const actionsDiv = container.querySelector('.message-actions');
    if(actionsDiv) actionsDiv.style.display = 'none';
  }

  function saveEdit(idx, btnEl) {
    const textarea = btnEl.parentElement.previousElementSibling;
    chats[activeChatId].messages[idx].text = textarea.value;
    persist();
    renderMessages();
    devLog(`Message at index ${idx} edited manually.`, 'info');
  }

  function deleteMessage(idx) {
    if (!activeChatId) return;
    if (!confirm('Delete this message?')) return;
    
    const chat = chats[activeChatId];
    chat.messages.splice(idx, 1);
    
    handleMemoryRewind();
    
    persist();
    renderMessages();
    devLog(`Message at index ${idx} deleted.`, 'warn');
  }

  function retryMessage(idx) {
    if (!activeChatId) return;
    if (!confirm('Retry from here? This will delete all subsequent messages.')) return;
    
    const chat = chats[activeChatId];
    const msgToRetry = chat.messages[idx];
    
    // Truncate to everything before this message
    chat.messages = chat.messages.slice(0, idx);
    
    handleMemoryRewind();
    
    persist();
    renderMessages();
    devLog(`Retrying chat from message index ${idx}. Subsequent messages removed.`, 'warn');
    
    // Place text back in input and send
    const input = document.getElementById('userInput');
    input.value = msgToRetry.text;
    autoResize(input);
    sendMessage();
  }

  function handleMemoryRewind() {
    const chat = chats[activeChatId];
    const totalMsgs = chat.messages.filter(m => m.role === 'user' || m.role === 'assistant').length;
    let data = mtmData[activeChatId];
    
    if (data) {
      if (totalMsgs < data.lastSummarizedIndex) {
        devLog(`MTM: Rewound past summary boundary. Restoring previous state if possible.`, 'warn');
        if (data.prevLastSummarizedIndex !== undefined && totalMsgs >= data.prevLastSummarizedIndex) {
           data.summary = data.prevSummary || '';
           data.lastSummarizedIndex = data.prevLastSummarizedIndex;
        } else {
           data.summary = '';
           data.lastSummarizedIndex = 0;
           data.prevSummary = '';
           data.prevLastSummarizedIndex = 0;
        }
      }
      
      data.lastTotalMsgs = totalMsgs;
      data.counter = Math.max(0, totalMsgs - memoryDepth - data.lastSummarizedIndex);
      mtmData[activeChatId] = data;
      mtmUpdateStatus();
    }
  }

  /** Build a system-level instruction block for a pipeline pass */
  function buildPassSystemPrompt(instructions, priorResults, passIndex) {
    const parts = [];
    if (instructions) {
      parts.push('[Pipeline Pass Instructions]\n' + instructions);
    }
    if (priorResults.length > 0) {
      const resultBlock = priorResults.map(r =>
        `--- Pass ${r.passIndex} Result ---\n${r.text}`
      ).join('\n\n');
      parts.push('[Results from prior pipeline passes — use these to inform your response]\n' + resultBlock);
    }
    return parts.join('\n\n');
  }

  // ─── Gemini API Call ───
  async function callGemini(messages, opts = {}) {
    const { useLorebook = true, useMtm = true, useChatHistory = true, extraSystem = '' } = opts;

    // Build the contents array
    let contents;
    if (useChatHistory) {
      const validMsgs = messages.filter(m => m.role === 'user' || m.role === 'assistant');
      const windowedMsgs = validMsgs.slice(-memoryDepth);
      contents = windowedMsgs.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
    } else {
      // No chat history — only send the latest user message
      const lastUser = [...messages].reverse().find(m => m.role === 'user');
      contents = lastUser
        ? [{ role: 'user', parts: [{ text: lastUser.text }] }]
        : [{ role: 'user', parts: [{ text: '' }] }];
    }

    // Gather context based on toggles
    const systemParts = [];
    if (playstateEnabled) {
      const playstateData = getPlaystateForChat();
      if (playstateData && playstateData.state) {
        devLog(`API Context: Appending Playstate (Character Sheet / State)`, 'info');
        systemParts.push('[Current Playstate — This is the current state of the game/character. Use this to inform your response.]\n' + playstateData.state);
      }
    }
    if (useMtm) {
      const mtmSummary = getMtmSummaryForChat();
      if (mtmSummary) {
        devLog(`API Context: Appending Mid-term Memory Summary`, 'info');
        systemParts.push('[Mid-term Memory — summary of earlier events that have left the immediate conversation window. Use this to maintain continuity but do not mention receiving it.]\n' + mtmSummary);
      }
    }
    if (useLorebook) {
      const loreContext = gatherLoreContext(messages);
      if (loreContext) {
        // Dev log is handled inside gatherLoreContext
        systemParts.push(loreContext);
      }
    }
    if (extraSystem) {
      devLog(`API Context: Appending Pipeline Pass Instructions`, 'info');
      systemParts.push(extraSystem);
    }

    const body = { contents };
    if (systemParts.length > 0) {
      body.systemInstruction = { parts: [{ text: systemParts.join('\n\n') }] };
    }

    devLog(`API Request: Sending ${contents.length} history messages + System Context`, 'info');
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errBody = await res.text();
      let detail = '';
      try { detail = JSON.parse(errBody).error.message; } catch { detail = errBody; }
      throw new Error(`API ${res.status}: ${detail}`);
    }

    const data = await res.json();
    const candidate = data.candidates && data.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      throw new Error('No response from model.');
    }

    devLog(`API Request: Success`, 'success');
    return candidate.content.parts.map(p => p.text).join('');
  }

  // ─── Lorebook ───
  let lorebook = loadJSON('lorebook', []);
  // Each entry: { id, name, keys: 'comma,sep', content, enabled, constant, scanDepth, priority }
  let loreGlobalEnabled = loadJSON('loreEnabled', true);
  let loreAutoExtractEnabled = loadJSON('loreAutoExtract', true);
  let editingLoreId = null;

  document.getElementById('loreGlobalToggle').checked = loreGlobalEnabled;
  document.getElementById('loreAutoExtractToggle').checked = loreAutoExtractEnabled;
  renderLorebook();
  renderPlaystate();

  function lorePersist() {
    saveJSON('lorebook', lorebook);
    saveJSON('loreEnabled', loreGlobalEnabled);
    saveJSON('loreAutoExtract', loreAutoExtractEnabled);
  }

  function loreToggleGlobal(val) {
    loreGlobalEnabled = val;
    lorePersist();
  }

  function loreToggleAutoExtract(val) {
    loreAutoExtractEnabled = val;
    lorePersist();
  }

  function loreNewEntry() {
    const entry = {
      id: 'lore_' + Date.now(),
      name: 'New Entry',
      keys: '',
      content: '',
      enabled: true,
      constant: false,
      isStatic: false,
      scanDepth: 5,
      priority: 0
    };
    lorebook.unshift(entry);
    editingLoreId = entry.id;
    lorePersist();
    renderLorebook();
  }

  function loreDeleteEntry(id) {
    if (!confirm('Delete this lorebook entry? This cannot be undone.')) return;
    lorebook = lorebook.filter(e => e.id !== id);
    if (editingLoreId === id) editingLoreId = null;
    lorePersist();
    renderLorebook();
  }

  function loreToggleEntry(id, val) {
    const e = lorebook.find(e => e.id === id);
    if (e) { e.enabled = val; lorePersist(); renderLorebook(); }
  }

  function loreToggleEditing(id) {
    editingLoreId = editingLoreId === id ? null : id;
    renderLorebook();
  }

  function loreSaveEntry(id) {
    const e = lorebook.find(e => e.id === id);
    if (!e) return;
    const container = document.querySelector(`.lore-entry[data-id="${id}"]`);
    e.name = container.querySelector('.lore-ed-name').value.trim() || 'Unnamed';
    e.keys = container.querySelector('.lore-ed-keys').value.trim();
    e.content = container.querySelector('.lore-ed-content').value;
    e.constant = container.querySelector('.lore-ed-constant').checked;
    e.isStatic = container.querySelector('.lore-ed-static').checked;
    e.scanDepth = parseInt(container.querySelector('.lore-ed-depth').value) || 5;
    e.priority = parseInt(container.querySelector('.lore-ed-priority').value) || 0;
    lorePersist();
    renderLorebook();
  }

  function renderLorebook() {
    const list = document.getElementById('loreList');
    list.innerHTML = '';

    for (const entry of lorebook) {
      const isEditing = editingLoreId === entry.id;
      const div = document.createElement('div');
      div.className = 'lore-entry' + (!entry.enabled ? ' disabled' : '') + (isEditing ? ' editing' : '');
      div.setAttribute('data-id', entry.id);

      div.innerHTML = `
        <div class="lore-entry-header" onclick="loreToggleEditing('${entry.id}')">
          <span class="lore-entry-name">${escapeHtml(entry.name)}</span>
          <span class="lore-entry-keys">${escapeHtml(entry.keys || 'no keys')}</span>
          ${entry.constant ? '<span style="font-size:0.65rem;color:var(--red-accent);" title="Always active">&#9733;</span>' : ''}
          ${entry.isStatic ? '<span style="font-size:0.65rem;color:var(--gray-lighter);" title="Static (AI will not modify)">&#128274;</span>' : ''}
          <label class="toggle" onclick="event.stopPropagation()">
            <input type="checkbox" ${entry.enabled ? 'checked' : ''} onchange="loreToggleEntry('${entry.id}', this.checked)">
            <span class="slider"></span>
          </label>
        </div>
        <div class="lore-editor">
          <label>Name</label>
          <input class="lore-ed-name" type="text" value="${escapeAttr(entry.name)}" placeholder="Entry name">
          <label>Keys <span style="font-weight:normal;color:var(--gray-lighter)">(comma separated trigger words)</span></label>
          <input class="lore-ed-keys" type="text" value="${escapeAttr(entry.keys)}" placeholder="dwarf, Groblin, axe">
          <label>Content <span style="font-weight:normal;color:var(--gray-lighter)">(injected when triggered)</span></label>
          <textarea class="lore-ed-content" placeholder="Lore text that gets sent with the message...">${escapeHtml(entry.content)}</textarea>
          <div class="lore-editor-row">
            <div>
              <label>Scan Depth</label>
              <input class="lore-ed-depth" type="number" min="1" max="50" value="${entry.scanDepth || 5}">
            </div>
            <div>
              <label>Priority</label>
              <input class="lore-ed-priority" type="number" min="0" max="100" value="${entry.priority || 0}">
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:2px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <label class="toggle">
                <input class="lore-ed-constant" type="checkbox" ${entry.constant ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
              <span style="font-size:0.75rem;color:var(--gray-text);" title="Ignore keys and always inject">Always Active</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <label class="toggle">
                <input class="lore-ed-static" type="checkbox" ${entry.isStatic ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
              <span style="font-size:0.75rem;color:var(--gray-text);" title="Prevent AI Auto-Extract from editing or deleting this entry">Static / Locked</span>
            </div>
          </div>
          <div class="lore-editor-actions">
            <button class="lore-btn-delete" onclick="loreDeleteEntry('${entry.id}')">Delete</button>
            <button class="lore-btn-save" onclick="loreSaveEntry('${entry.id}')">Save</button>
          </div>
        </div>
      `;
      list.appendChild(div);
    }

    // Update info bar
    const info = document.getElementById('loreScanInfo');
    const enabled = lorebook.filter(e => e.enabled).length;
    info.textContent = `${enabled} active / ${lorebook.length} entries`;
  }

  // ─── Lorebook Injection (called at send time) ───
  function gatherLoreContext(messages) {
    if (!loreGlobalEnabled) return '';

    const enabledEntries = lorebook.filter(e => e.enabled);
    if (enabledEntries.length === 0) return '';

    const matched = [];

    for (const entry of enabledEntries) {
      // Constant entries always match
      if (entry.constant) {
        matched.push(entry);
        continue;
      }

      // Parse keys
      const keys = (entry.keys || '').split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      if (keys.length === 0) continue;

      // Scan last N valid messages for keyword matches
      const depth = entry.scanDepth || 5;
      const validMsgs = messages.filter(m => m.role === 'user' || m.role === 'assistant');
      const recentMsgs = validMsgs.slice(-depth);
      const haystack = recentMsgs.map(m => m.text).join(' ').toLowerCase();

      for (const key of keys) {
        if (haystack.includes(key)) {
          matched.push(entry);
          break;
        }
      }
    }

    if (matched.length === 0) return '';

    // Sort by priority descending
    matched.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    devLog(`Lorebook: Injected ${matched.length} entries.`, 'info');
    matched.forEach(e => {
      devLog(`  -> [${e.name}] (Priority ${e.priority || 0})`, 'info');
    });

    // Build injection block
    const parts = matched.map(e => `[${e.name}]: ${e.content}`);
    return '[Lorebook Context — the following entries are relevant background information. Use them to inform your response but do not mention that you received them.]\n' + parts.join('\n\n');
  }

  // ─── Lorebook Import / Export ───
  function loreImportExport() {
    const json = JSON.stringify(lorebook, null, 2);
    const action = prompt('EXPORT: Copy the JSON below.\\nIMPORT: Paste lorebook JSON and click OK.\\n\\n' + json);
    if (action && action.trim() !== json.trim()) {
      try {
        const imported = JSON.parse(action);
        if (Array.isArray(imported)) {
          lorebook = imported;
          lorePersist();
          renderLorebook();
          alert('Imported ' + imported.length + ' entries.');
        } else {
          alert('Invalid format: expected an array.');
        }
      } catch (e) {
        alert('Invalid JSON: ' + e.message);
      }
    }
  }

  function escapeAttr(str) {
    return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ─── Playstate ───
  let playstateEnabled = loadJSON('playstateEnabled', true);
  // Per-chat playstate stored in: playstateData = { chatId: { prompt: string, state: string } }
  let playstateData = loadJSON('playstateData', {});
  let playstateUpdating = false;

  document.getElementById('playstateToggle').checked = playstateEnabled;

  function getPlaystateForChat() {
    if (!activeChatId) return { prompt: '', state: '' };
    return playstateData[activeChatId] || { prompt: '', state: '' };
  }

  function renderPlaystate() {
    const data = getPlaystateForChat();
    document.getElementById('playstatePromptInput').value = data.prompt;
    document.getElementById('playstateDataInput').value = data.state;
    document.getElementById('playstateStatus').textContent = playstateEnabled ? 'Idle' : 'Disabled';
  }

  function savePlaystate() {
    if (!activeChatId) return;
    const prompt = document.getElementById('playstatePromptInput').value;
    const state = document.getElementById('playstateDataInput').value;
    playstateData[activeChatId] = { prompt, state };
    saveJSON('playstateData', playstateData);
  }

  function playstateToggleEnabled(val) {
    playstateEnabled = val;
    saveJSON('playstateEnabled', playstateEnabled);
    document.getElementById('playstateStatus').textContent = playstateEnabled ? 'Idle' : 'Disabled';
  }

  async function updatePlaystate() {
    if (!playstateEnabled || !activeChatId || !apiKey || playstateUpdating) return;
    const data = getPlaystateForChat();
    if (!data.prompt.trim()) return; // No instructions, nothing to do.

    const chat = chats[activeChatId];
    // Grab the last 2 valid messages (one user, one AI typically) to see what just happened
    const validMsgs = chat.messages.filter(m => m.role === 'user' || m.role === 'assistant');
    if (validMsgs.length === 0) return;
    
    // Determine how many messages to include. Maybe the last 2 is good enough.
    const recentMsgs = validMsgs.slice(-2);
    const transcript = recentMsgs.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\\n\\n');

    playstateUpdating = true;
    document.getElementById('playstateStatus').textContent = 'Updating playstate...';

    try {
      const promptText = `You are managing a dynamic game/play state. Based on the "Recent Conversation" and your "Instructions", read the "Current State" and output the entirely updated state. Do NOT wrap your output in markdown code blocks unless the state is strictly JSON/code. Only output the new raw state text.

[Instructions]
${data.prompt}

[Current State]
${data.state}

[Recent Conversation]
${transcript}

Updated State:`;

      const contents = [{ role: 'user', parts: [{ text: promptText }] }];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      if (!res.ok) throw new Error('API error ' + res.status);
      const result = await res.json();
      const candidate = result.candidates && result.candidates[0];
      if (!candidate || !candidate.content || !candidate.content.parts) throw new Error('No state returned');

      let newState = candidate.content.parts.map(p => p.text).join('').trim();
      
      // Strip markdown code block if present
      newState = newState.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '');

      // Save it
      playstateData[activeChatId].state = newState;
      saveJSON('playstateData', playstateData);
      
      if (activeChatId === activeChatId) {
        renderPlaystate();
        document.getElementById('playstateStatus').textContent = 'Last updated just now.';
        devLog(`Playstate: Auto-updated successfully.`, 'success');
      }
    } catch (err) {
      console.error('Playstate update failed:', err);
      devLog(`Playstate Error: ${err.message}`, 'error');
      document.getElementById('playstateStatus').textContent = 'Update failed.';
    }
    playstateUpdating = false;
  }

  // ─── Mid-term Memory ───
  // Per-chat summaries stored in: mtmData = { chatId: { summary, lastSummarizedIndex } }
  const DEFAULT_MTM_PROMPT = `{previous_summary}Below is a transcript of recent conversation messages that are about to leave the AI's immediate memory window. Summarize the key events, decisions, character details, plot points, and any important information. Combine this with any previous summary to create one cohesive summary. Be concise but thorough — this summary is the only record of these events.\n\nTranscript:\n---\n{transcript}\n---\n\nProvide an updated combined summary:`;
  let mtmPrompt = loadJSON('mtmPrompt', DEFAULT_MTM_PROMPT);
  let mtmData = loadJSON('mtmData', {});
  let mtmEnabled = loadJSON('mtmEnabled', true);
  let mtmInterval = loadJSON('mtmInterval', 10);
  let mtmSummarizing = false;

  document.getElementById('mtmToggle').checked = mtmEnabled;
  document.getElementById('mtmInterval').value = mtmInterval;
  document.getElementById('mtmPromptTemplate').value = mtmPrompt;
  mtmRenderSummary();
  mtmUpdateStatus();

  function mtmPersist() {
    saveJSON('mtmData', mtmData);
    saveJSON('mtmEnabled', mtmEnabled);
    saveJSON('mtmInterval', mtmInterval);
    saveJSON('mtmPrompt', mtmPrompt);
  }

  function mtmSavePrompt() {
    const val = document.getElementById('mtmPromptTemplate').value.trim();
    mtmPrompt = val || DEFAULT_MTM_PROMPT;
    document.getElementById('mtmPromptTemplate').value = mtmPrompt;
    mtmPersist();
  }

  function mtmResetPrompt() {
    mtmPrompt = DEFAULT_MTM_PROMPT;
    document.getElementById('mtmPromptTemplate').value = mtmPrompt;
    mtmPersist();
  }

  function mtmToggleEnabled(val) {
    mtmEnabled = val;
    mtmPersist();
    mtmUpdateStatus();
  }

  function mtmSaveSettings() {
    mtmInterval = Math.max(3, parseInt(document.getElementById('mtmInterval').value) || 10);
    document.getElementById('mtmInterval').value = mtmInterval;
    mtmPersist();
    // If interval was lowered, check if we need to summarize immediately
    mtmCheckAndSummarize();
    mtmUpdateStatus();
  }

  function mtmChangeCounter() {
    if (!activeChatId) return;
    const chat = chats[activeChatId];
    if (!chat) return;

    const data = mtmData[activeChatId] || { summary: '', lastSummarizedIndex: 0 };
    let newCounter = parseInt(document.getElementById('mtmCounter').value) || 0;

    if (newCounter < 0) newCounter = 0;

    data.counter = newCounter;
    mtmData[activeChatId] = data;
    mtmPersist();

    if (data.counter >= mtmInterval) {
      mtmCheckAndSummarize();
    } else {
      mtmUpdateStatus();
    }
  }
  function mtmAutoOptimize() {
    // Set interval to ~25% of memory window, clamped 5-50
    mtmInterval = Math.max(5, Math.min(50, Math.round(memoryDepth * 0.25)));
    document.getElementById('mtmInterval').value = mtmInterval;
    mtmPersist();
    mtmUpdateStatus();
  }

  function getMtmSummaryForChat() {
    if (!mtmEnabled || !activeChatId) return '';
    const data = mtmData[activeChatId];
    return data ? data.summary || '' : '';
  }

  function mtmRenderSummary() {
    const el = document.getElementById('mtmSummaryDisplay');
    const summary = getMtmSummaryForChat();
    el.textContent = summary;
  }

  function mtmUpdateStatus() {
    const el = document.getElementById('mtmStatus');
    const counterInput = document.getElementById('mtmCounter');
    const intervalDisplay = document.getElementById('mtmIntervalDisplay');
    
    if (intervalDisplay) intervalDisplay.textContent = mtmInterval;
    
    if (!mtmEnabled) {
      el.textContent = 'Mid-term memory disabled';
      if (counterInput) { counterInput.value = 0; counterInput.disabled = true; }
      return;
    }
    if (!activeChatId || !chats[activeChatId]) {
      el.textContent = 'No active chat';
      if (counterInput) { counterInput.value = 0; counterInput.disabled = true; }
      return;
    }
    
    if (counterInput) counterInput.disabled = false;
    
    const chat = chats[activeChatId];
    const totalMsgs = chat.messages.filter(m => m.role === 'user' || m.role === 'assistant').length;
    const data = mtmData[activeChatId] || { lastSummarizedIndex: 0, counter: 0 };

    // Counter tracks ticks until the next summarization check
    const counter = data.counter || 0;
    if (counterInput) counterInput.value = counter;

    const msgsUntilNext = Math.max(0, mtmInterval - counter);
    const outOfWindow = Math.max(0, totalMsgs - memoryDepth - data.lastSummarizedIndex);

    if (totalMsgs <= memoryDepth) {
      el.textContent = `All ${totalMsgs} messages fit in memory (window: ${memoryDepth})`;
    } else {
      el.textContent = `${outOfWindow} msgs waiting to be summarized | next check in ${msgsUntilNext} msgs`;
    }  }

  function mtmClearSummary() {
    if (!activeChatId) return;
    if (!confirm('Clear the mid-term memory summary for this chat?')) return;
    delete mtmData[activeChatId];
    mtmPersist();
    mtmRenderSummary();
    mtmUpdateStatus();
  }

  // Check if we should auto-summarize after a message is sent
  async function mtmCheckAndSummarize() {
    if (!mtmEnabled || !activeChatId || !apiKey) return;
    const chat = chats[activeChatId];
    const totalMsgs = chat.messages.filter(m => m.role === 'user' || m.role === 'assistant').length;

    let data = mtmData[activeChatId];
    let needsSave = false;
    if (!data) {
      data = { summary: '', lastSummarizedIndex: 0, counter: 0 };
      needsSave = true;
    }

    if (data.lastTotalMsgs === undefined) {
      data.lastTotalMsgs = totalMsgs;
      needsSave = true;
    }
    
    const delta = totalMsgs - data.lastTotalMsgs;
    if (delta !== 0) {
      if (delta > 0) data.counter = (data.counter || 0) + delta;
      data.lastTotalMsgs = totalMsgs;
      needsSave = true;
    }

    if (needsSave) {
      mtmData[activeChatId] = data;
      mtmPersist();
    }

    if ((data.counter || 0) >= mtmInterval) {
      devLog(`MTM: Auto-check triggered (Counter ${data.counter} reached interval ${mtmInterval}).`, 'info');
      await mtmRunSummarization();
    } else {
      mtmUpdateStatus();
    }
  }

  async function mtmSummarizeNow() {
    if (!activeChatId || !apiKey) {
      alert('Need an active chat and API key.');
      return;
    }
    devLog('MTM: User manually clicked "Summarize Now".', 'info');
    await mtmRunSummarization();
  }

  async function mtmRunSummarization() {
    if (!activeChatId) return;
    if (mtmSummarizing) return;
    mtmSummarizing = true;
    const btn = document.getElementById('mtmSummarizeBtn');
    btn.disabled = true;
    btn.textContent = 'Summarizing...';

    // Capture the target chat ID to prevent race conditions if the user switches chats
    const targetChatId = activeChatId;

    try {
      const chat = chats[targetChatId];
      const allMsgs = chat.messages.filter(m => m.role === 'user' || m.role === 'assistant');
      const totalMsgs = allMsgs.length;
      const data = mtmData[targetChatId] || { summary: '', lastSummarizedIndex: 0 };

      // We only summarize exactly what has strictly fallen out of memory
      const exitStart = data.lastSummarizedIndex;
      const exitEnd = Math.max(0, totalMsgs - memoryDepth);
      const msgsToSummarize = allMsgs.slice(exitStart, exitEnd);

      devLog(`MTM: Checking for out-of-bounds messages... (Last Index: ${exitStart}, Max Window Index: ${exitEnd})`);

      if (msgsToSummarize.length === 0) {
        devLog(`MTM: No messages have fallen out of the memory window (Memory Depth: ${memoryDepth}). Nothing to summarize.`, 'warn');
        data.counter = 0;
        mtmData[targetChatId] = data;
        mtmPersist();
        if (activeChatId === targetChatId) mtmUpdateStatus();

        btn.disabled = false;
        btn.textContent = 'Summarize Now';
        mtmSummarizing = false;
        return;
      }

      devLog(`MTM: Summarizing ${msgsToSummarize.length} messages...`, 'info');

      // Build the summarization prompt
      const transcript = msgsToSummarize.map(m =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`
      ).join('\n\n');

      const previousSummary = data.summary
        ? `Here is your previous summary of earlier events:\n---\n${data.summary}\n---\n\n`
        : '';

      let prompt = mtmPrompt
        .replace('{previous_summary}', previousSummary)
        .replace('{transcript}', transcript);

      if (loreAutoExtractEnabled) {
        const recentContextMsgs = allMsgs.slice(exitEnd);
        if (recentContextMsgs.length > 0) {
          const recentContext = recentContextMsgs.map(m =>
            `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`
          ).join('\n\n');
          
          prompt += `\n\n[Recent Context For Lore Assessment]\nThe following messages are still in active memory. Do NOT summarize them in the <summary> block. Use them ONLY to determine if characters, places, or items mentioned in the Transcript are actually important enough to extract into the lorebook (e.g. they remained relevant or were significant over time).\n---\n${recentContext}\n---`;
        }

        const mutableLore = lorebook.filter(e => !e.isStatic);
        if (mutableLore.length > 0) {
          const loreContext = mutableLore.map(e => 
            `{ "id": "${e.id}", "name": "${e.name}", "keys": "${e.keys}", "content": "${e.content}" }`
          ).join('\n');
          prompt += `\n\n[Current Mutable Lorebook]\nThe following entries currently exist in the lorebook and are allowed to be updated. If you learn new information about them, you can update them by returning an object with their exact "id".\n---\n${loreContext}\n---`;
        }
      }

      const contents = [{ role: 'user', parts: [{ text: prompt }] }];
      const body = { contents };

      if (loreAutoExtractEnabled) {
        body.systemInstruction = {
          parts: [{ text: `You are an expert lorebook manager. Your task is twofold:
1. Provide the requested mid-term memory summary based ONLY on the "Transcript". Do NOT summarize the "Recent Context For Lore Assessment".
2. Analyze the "Transcript" for any characters, places, factions, items, or quests. To determine if they are important enough to log, cross-reference them with the "Recent Context For Lore Assessment". Only extract entities that are demonstrably significant over the broader conversation.
3. If new significant information arises about an entity already in the "[Current Mutable Lorebook]", you MUST update it by including its exact "id" in your output and providing the newly merged "content" and "keys". If it is a completely new entity, omit the "id" field and one will be generated for it. Consolidate related information (e.g., if a quest involves multiple people, mention them in the quest entry).

You MUST format your response exactly like this, using the XML tags:
<summary>
(write the narrative summary text here)
</summary>
<lorebook>
[
  { "id": "optional_existing_id_here", "name": "Character/Place/Quest Name", "keys": "comma, separated, keywords", "content": "Detailed description of who/what they are and what they have done." }
]
</lorebook>

If there is no new lore to extract or update, just return an empty array [] inside the <lorebook> tags.` }]
        };
        devLog(`MTM: Lore auto-extraction enabled. Appending system instructions & recent context (${allMsgs.slice(exitEnd).length} msgs).`, 'info');
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('API error ' + res.status);

      const result = await res.json();
      const candidate = result.candidates && result.candidates[0];
      if (!candidate || !candidate.content || !candidate.content.parts) {
        throw new Error('No summary returned');
      }

      let rawOutput = candidate.content.parts.map(p => p.text).join('');
      let finalSummary = rawOutput;

      // Extract Lorebook and Summary if tags exist
      if (loreAutoExtractEnabled && rawOutput.includes('<summary>')) {
        const summaryMatch = rawOutput.match(/<summary>([\s\S]*?)<\/summary>/);
        const lorebookMatch = rawOutput.match(/<lorebook>([\s\S]*?)<\/lorebook>/);
        
        if (summaryMatch) finalSummary = summaryMatch[1].trim();
        
        if (lorebookMatch) {
          try {
            let jsonStr = lorebookMatch[1].trim();
            // clean up markdown code blocks if the AI accidentally wrapped the JSON in them
            jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
            const parsedLore = JSON.parse(jsonStr);
            
            if (Array.isArray(parsedLore) && parsedLore.length > 0) {
              let updatedCount = 0;
              let newCount = 0;
              parsedLore.forEach(entry => {
                let existingIndex = -1;
                if (entry.id) {
                   existingIndex = lorebook.findIndex(e => e.id === entry.id && !e.isStatic);
                }
                
                if (existingIndex !== -1) {
                  // Update existing
                  lorebook[existingIndex].name = entry.name || lorebook[existingIndex].name;
                  lorebook[existingIndex].keys = entry.keys || lorebook[existingIndex].keys;
                  lorebook[existingIndex].content = entry.content || lorebook[existingIndex].content;
                  updatedCount++;
                } else {
                  // Create new
                  lorebook.unshift({
                    id: 'lore_auto_' + Date.now() + Math.floor(Math.random() * 1000),
                    name: entry.name || 'Extracted Entry',
                    keys: entry.keys || '',
                    content: entry.content || '',
                    enabled: true,
                    constant: false,
                    isStatic: false,
                    scanDepth: 5,
                    priority: 10
                  });
                  newCount++;
                }
              });
              devLog(`MTM: Extracted ${newCount} new and updated ${updatedCount} existing lorebook entries!`, 'success');
              lorePersist();
              renderLorebook();
            } else {
              devLog(`MTM: No new lore extracted this cycle.`, 'info');
            }
          } catch (e) {
            devLog(`MTM Lore Extraction JSON parse error: ${e.message}`, 'error');
            console.error("Failed to parse lorebook JSON:", lorebookMatch[1]);
          }
        }
      }

      // Save previous state for rewinds
      data.prevSummary = data.summary;
      data.prevLastSummarizedIndex = data.lastSummarizedIndex;

      data.summary = finalSummary;
      data.lastSummarizedIndex = exitEnd;
      data.counter = 0;

      mtmData[targetChatId] = data;
      mtmPersist();

      devLog('MTM: Summary generated and saved successfully.', 'success');

      // Only render if the user is still looking at the same chat
      if (activeChatId === targetChatId) {
        mtmRenderSummary();
        mtmUpdateStatus();
      }
    } catch (err) {
      console.error('Mid-term memory summarization failed:', err);
      devLog(`MTM Error: ${err.message}`, 'error');
    }
    if (activeChatId === targetChatId) {
      btn.disabled = false;
      btn.textContent = 'Summarize Now';
    }
    mtmSummarizing = false;
  }

  // ─── File System Access API & IndexedDB for Auto-Save ───

  async function initTableFileHandle() {
    try {
      const db = await openDB();
      const tx = db.transaction('handles', 'readonly');
      const store = tx.objectStore('handles');
      const request = store.get('tablesJsonHandle');
      
      request.onsuccess = async () => {
        if (request.result) {
          tableFileHandle = request.result;
          // Check permission without prompting
          const options = { mode: 'readwrite' };
          if ((await tableFileHandle.queryPermission(options)) !== 'granted') {
            updateLinkButtonState('Resume Auto-Save Sync', '#b22222', 'white');
          } else {
            updateLinkButtonState('Linked (Auto-Save Active)', '#1a3a1a', '#4caf50');
            await loadTablesFromFile();
          }
        }
      };
    } catch (e) { console.error('IndexedDB init failed', e); }
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('GeminiChatDB', 1);
      req.onupgradeneeded = (e) => { e.target.result.createObjectStore('handles'); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveHandleToDB(handle) {
    const db = await openDB();
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(handle, 'tablesJsonHandle');
  }

  function updateLinkButtonState(text, bg, color) {
    const btns = [document.getElementById('btnLinkTables'), document.getElementById('btnSettingsLinkTables')];
    btns.forEach(btn => {
      if(btn) {
        btn.textContent = text;
        btn.style.background = bg;
        btn.style.color = color;
        btn.style.borderColor = bg;
      }
    });
  }

  async function tableLinkFile() {
    try {
      if (!window.showOpenFilePicker) {
        alert('Your browser does not support the File System Access API. Please use a modern Chromium-based browser (Chrome, Edge, Brave) to use Auto-Save.');
        return;
      }

      if (tableFileHandle) {
        if ((await tableFileHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
          if ((await tableFileHandle.requestPermission({ mode: 'readwrite' })) === 'granted') {
            updateLinkButtonState('Linked (Auto-Save Active)', '#1a3a1a', '#4caf50');
            await loadTablesFromFile();
            return;
          }
        }
      }

      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'JSON Files', accept: {'application/json': ['.json']} }],
        multiple: false
      });
      tableFileHandle = handle;
      await saveHandleToDB(handle);

      await loadTablesFromFile();
      updateLinkButtonState('Linked (Auto-Save Active)', '#1a3a1a', '#4caf50');
      alert('Successfully linked! Tables will now automatically save to ' + handle.name);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to link file:', err);
        alert('Failed to link file: ' + err.message);
      }
    }
  }
  async function loadTablesFromFile() {
    if (!tableFileHandle) return;
    try {
      const file = await tableFileHandle.getFile();
      const text = await file.text();
      const imported = JSON.parse(text);
      if (Array.isArray(imported)) {
        randomTables = imported;
        saveJSON('randomTables', randomTables);
        renderTables();
      } else {
        alert("Failed to load tables: The JSON file must contain an array of tables.");
      }
    } catch (err) {
      console.error("Failed to load tables from file", err);
      alert("Failed to read JSON from the linked file: " + err.message);
    }
  }

  async function tableAutoSave() {
    if (!tableFileHandle) return;
    try {
      if ((await tableFileHandle.queryPermission({ mode: 'readwrite' })) === 'granted') {
        const writable = await tableFileHandle.createWritable();
        await writable.write(JSON.stringify(randomTables, null, 2));
        await writable.close();
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }

  // ─── Random Tables ───
  // Each: { id, name, command, group, rows: 'one per line', enabled, subRolls: [] }

  function toggleTableGroup(group) {
    collapsedTableGroups[group] = !collapsedTableGroups[group];
    saveJSON('collapsedTableGroups', collapsedTableGroups);
    renderTables();
  }

  function tablePersist() { 
    saveJSON('randomTables', randomTables); 
    tableAutoSave();
  }

  function tableNewEntry() {
    const entry = {
      id: 'tbl_' + Date.now(),
      name: 'New Table',
      group: '',
      command: '!Command',
      rows: 'Row 1\nRow 2\nRow 3',
      enabled: true,
      subRolls: []
    };
    randomTables.unshift(entry);
    editingTableId = entry.id;
    tablePersist();
    renderTables();
  }

  function tableAddSubRoll(tableId) {
    const t = randomTables.find(t => t.id === tableId);
    if (!t) return;
    if (!t.subRolls) t.subRolls = [];
    t.subRolls.push({ label: '', formula: '' });
    renderTables();
  }

  function tableRemoveSubRoll(tableId, index) {
    const t = randomTables.find(t => t.id === tableId);
    if (t && t.subRolls) {
      t.subRolls.splice(index, 1);
      renderTables();
    }
  }

  function tableDeleteEntry(id) {
    if (!confirm('Delete this random table? This cannot be undone.')) return;
    randomTables = randomTables.filter(t => t.id !== id);
    if (editingTableId === id) editingTableId = null;
    tablePersist();
    renderTables();
  }

  function tableToggleEditing(id) {
    editingTableId = editingTableId === id ? null : id;
    renderTables();
  }

  function tableSaveEntry(id) {
    const t = randomTables.find(t => t.id === id);
    if (!t) return;
    const container = document.querySelector(`.table-entry[data-id="${id}"]`);
    t.name = container.querySelector('.tbl-ed-name').value.trim() || 'Unnamed';
    t.group = container.querySelector('.tbl-ed-group').value.trim();
    let cmd = container.querySelector('.tbl-ed-cmd').value.trim();
    if (!cmd.startsWith('!')) cmd = '!' + cmd;
    t.command = cmd;
    t.rows = container.querySelector('.tbl-ed-rows').value;
    
    // Save sub-rolls
    t.subRolls = [];
    container.querySelectorAll('.subroll-item').forEach(item => {
      const label = item.querySelector('.sub-label').value.trim();
      const formula = item.querySelector('.sub-formula').value.trim();
      if (label || formula) t.subRolls.push({ label, formula });
    });

    tablePersist();
    renderTables();
  }

  function tableRoll(tableEntry, depth = 0) {
    if (depth > 5) return '[Max Depth]';
    const lines = (tableEntry.rows || '').split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return '[empty table]';
    const mainResult = lines[Math.floor(Math.random() * lines.length)];
    
    if (!tableEntry.subRolls || tableEntry.subRolls.length === 0) return mainResult;
    
    const results = [mainResult];
    for (const sub of tableEntry.subRolls) {
      const rolled = evaluateFormula(sub.formula, mainResult, depth + 1);
      results.push(`${sub.label}: ${rolled}`);
    }
    return results.join(' | ');
  }

  function evaluateFormula(formula, contextResult, depth) {
    let f = formula.replace(/\{Result\}/gi, contextResult);
    
    // If it's a command, lookup and roll
    if (f.startsWith('!')) {
      const tbl = randomTables.find(t => t.command.toLowerCase() === f.toLowerCase());
      if (tbl) return tableRoll(tbl, depth);
      return `[Table ${f} not found]`;
    }
    
    // Dice roll: NdS[+-]M
    const diceRegex = /(\d+)d(\d+)([+-]\d+)?/gi;
    return f.replace(diceRegex, (match) => {
      const m = /(\d+)d(\d+)([+-]\d+)?/i.exec(match);
      const num = parseInt(m[1]);
      const sides = parseInt(m[2]);
      const mod = parseInt(m[3] || 0);
      let total = 0;
      for (let i = 0; i < num; i++) total += Math.floor(Math.random() * sides) + 1;
      return total + mod;
    });
  }

  /** Scan text for !Commands after a pass completes. Returns modified text. */
  function processCommands(text, contextName = 'System') {
    if (randomTables.length === 0) return text;
    let result = text;
    let commandsRun = [];
    
    for (const tbl of randomTables) {
      if (!tbl.enabled || !tbl.command) continue;
      // Case-insensitive match of the command word
      const cmd = tbl.command;
      const regex = new RegExp(cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      let match;
      // Process from end to start to preserve indices
      const matches = [];
      while ((match = regex.exec(result)) !== null) {
        matches.push({ index: match.index, length: match[0].length });
      }
      for (let i = matches.length - 1; i >= 0; i--) {
        const m = matches[i];
        const rolled = tableRoll(tbl);
        commandsRun.push({ table: tbl.name, command: cmd, result: rolled });
        const after = m.index + m.length;
        result = result.slice(0, after) + ' [' + rolled + ']' + result.slice(after);
      }
    }
    
    if (commandsRun.length > 0) {
      devLog(`${contextName}: Executed ${commandsRun.length} commands.`, 'info');
      commandsRun.forEach(c => {
        devLog(`  -> ${c.command} (${c.table}): [${c.result}]`, 'info');
      });
    }
    
    return result;
  }

  function renderTables() {
    const list = document.getElementById('tableList');
    list.innerHTML = '';
    
    const searchInput = document.getElementById('tableSearch');
    const query = searchInput ? searchInput.value.toLowerCase() : '';

    const grouped = {};
    for (const tbl of randomTables) {
      const g = tbl.group || 'Uncategorized';
      
      if (query) {
        const match = tbl.name.toLowerCase().includes(query) || 
                      tbl.command.toLowerCase().includes(query) || 
                      g.toLowerCase().includes(query);
        if (!match) continue;
      }

      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(tbl);
    }

    const sortedGroups = Object.keys(grouped).sort((a, b) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });

    for (const g of sortedGroups) {
      const isCollapsed = query ? false : collapsedTableGroups[g];
      
      const groupHeader = document.createElement('div');
      groupHeader.className = 'table-group-header';
      groupHeader.innerHTML = `
        <span class="table-group-name">${escapeHtml(g)} (${grouped[g].length})</span>
        <span class="table-group-toggle">${isCollapsed ? '+' : '−'}</span>
      `;
      groupHeader.onclick = () => toggleTableGroup(g);
      list.appendChild(groupHeader);

      if (!isCollapsed) {
        for (const tbl of grouped[g]) {
          const isEditing = editingTableId === tbl.id;
          const div = document.createElement('div');
          div.className = 'table-entry' + (isEditing ? ' editing' : '');
          div.setAttribute('data-id', tbl.id);
          const rowCount = (tbl.rows || '').split('\n').filter(l => l.trim()).length;
          
          let subRollsHtml = '';
          if (isEditing) {
            subRollsHtml = `
              <div class="table-subrolls-title">
                <span>
                  Sub-rolls / Linked Tables
                  <span class="help-icon">?
                    <div class="tooltip">
                      <b>Sub-rolls</b> trigger automatically after the main roll.<br><br>
                      <b>Dice:</b> Use formulas like <code>2d6+2</code> or <code>1d100</code>.<br><br>
                      <b>Tables:</b> Use <code>!TableCommand</code> to roll another table.<br><br>
                      <b>Dynamic:</b> Use <code>!{Result}Variants</code> to roll a table named after the main result.
                    </div>
                  </span>
                </span>
                <button class="add-subroll-btn" onclick="tableAddSubRoll('${tbl.id}')">+ Add Sub-roll</button>
              </div>
              <div class="subroll-list">
                ${(tbl.subRolls || []).map((s, idx) => `
                  <div class="subroll-item">
                    <input class="sub-label" type="text" value="${escapeAttr(s.label)}" placeholder="In Lair">
                    <input class="sub-formula" type="text" value="${escapeAttr(s.formula)}" placeholder="1d100%">
                    <button onclick="tableRemoveSubRoll('${tbl.id}', ${idx})" title="Remove">&times;</button>
                  </div>
                `).join('')}
              </div>
            `;
          }

          div.innerHTML = `
            <div class="table-entry-header" onclick="tableToggleEditing('${tbl.id}')">
              <span class="table-entry-name">${escapeHtml(tbl.name)}</span>
              <span class="table-entry-cmd">${escapeHtml(tbl.command)}</span>
              <span class="table-entry-count">${rowCount} rows</span>
            </div>
            <div class="table-editor">
              <div style="display: flex; gap: 8px; margin-bottom: 4px;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                  <label>Table Name</label>
                  <input class="tbl-ed-name" type="text" value="${escapeAttr(tbl.name)}" placeholder="Monster Table">
                </div>
                <div style="flex: 1; display: flex; flex-direction: column;">
                  <label>Folder / Group</label>
                  <input class="tbl-ed-group" type="text" value="${escapeAttr(tbl.group || '')}" placeholder="e.g. Monsters">
                </div>
              </div>
              <label>Command Trigger <span style="font-weight:normal;color:var(--gray-lighter)">(e.g. !Monster)</span></label>
              <input class="tbl-ed-cmd" type="text" value="${escapeAttr(tbl.command)}" placeholder="!Monster">
              <label>Rows <span style="font-weight:normal;color:var(--gray-lighter)">(one per line, random pick)</span></label>
              <textarea class="tbl-ed-rows" placeholder="Goblin\nSkeleton\nDragon">${escapeHtml(tbl.rows)}</textarea>
              ${subRollsHtml}
              <div class="table-editor-actions">
                <button class="tbl-btn-delete" onclick="tableDeleteEntry('${tbl.id}')">Delete</button>
                <button class="tbl-btn-save" onclick="tableSaveEntry('${tbl.id}')">Save</button>
              </div>
            </div>
          `;
          list.appendChild(div);
        }
      }
    }
  }
  renderTables();

  // ─── AI Pipeline ───
  let pipeline = loadJSON('pipeline', { passes: [], finalInstructions: '', finalUseLore: true, finalUseMtm: true, finalUseHistory: true });

  function pipelinePersist() { saveJSON('pipeline', pipeline); }

  function pipelineAddPass(index) {
    const pass = {
      id: 'pass_' + Date.now(),
      name: 'Pass ' + (pipeline.passes.length + 1),
      instructions: '',
      useLorebook: true,
      useMtm: true,
      useChatHistory: true
    };
    pipeline.passes.splice(index, 0, pass);
    pipelinePersist();
    renderPipeline();
  }

  function pipelineRemovePass(id) {
    if (!confirm('Remove this pipeline pass?')) return;
    pipeline.passes = pipeline.passes.filter(p => p.id !== id);
    pipelinePersist();
    renderPipeline();
  }

  function pipelineSave() {
    // Read all pass data from DOM
    for (const pass of pipeline.passes) {
      const node = document.querySelector(`.pipeline-node[data-id="${pass.id}"]`);
      if (!node) continue;
      pass.instructions = node.querySelector('.pipe-instructions').value;
      pass.useLorebook = node.querySelector('.pipe-lore').checked;
      pass.useMtm = node.querySelector('.pipe-mtm').checked;
      pass.useChatHistory = node.querySelector('.pipe-history').checked;
    }
    // Final output node
    const finalNode = document.querySelector('.pipeline-node[data-id="final"]');
    if (finalNode) {
      pipeline.finalInstructions = finalNode.querySelector('.pipe-instructions').value;
      pipeline.finalUseLore = finalNode.querySelector('.pipe-lore').checked;
      pipeline.finalUseMtm = finalNode.querySelector('.pipe-mtm').checked;
      pipeline.finalUseHistory = finalNode.querySelector('.pipe-history').checked;
    }
    pipelinePersist();
  }

  function renderPipeline() {
    const flow = document.getElementById('pipelineFlow');
    flow.innerHTML = '';

    // User Input node (fixed)
    flow.innerHTML += `<div class="pipeline-node fixed-node">User's Input</div>`;
    flow.innerHTML += `<div class="pipeline-arrow">&darr;</div>`;

    // Add-pass button before first pass
    flow.innerHTML += `<button class="pipeline-add-btn" onclick="pipelineAddPass(0)">+ Add Pass</button>`;
    flow.innerHTML += `<div class="pipeline-arrow">&darr;</div>`;

    // Intermediate passes
    for (let i = 0; i < pipeline.passes.length; i++) {
      const pass = pipeline.passes[i];
      flow.innerHTML += `
        <div class="pipeline-node" data-id="${pass.id}">
          <div class="pipeline-pass-header">
            <span class="pipeline-pass-title">Pass ${i + 1}</span>
            <button class="pipeline-pass-remove" onclick="pipelineRemovePass('${pass.id}')" title="Remove pass">&times;</button>
          </div>
          <textarea class="pipe-instructions" placeholder="Instructions for this pass..." onchange="pipelineSave()">${escapeHtml(pass.instructions)}</textarea>
          <div class="pipeline-toggles">
            <label class="pipeline-toggle-item"><input type="checkbox" class="pipe-lore" ${pass.useLorebook ? 'checked' : ''} onchange="pipelineSave()"> Lorebook</label>
            <label class="pipeline-toggle-item"><input type="checkbox" class="pipe-mtm" ${pass.useMtm ? 'checked' : ''} onchange="pipelineSave()"> Mid-term Memory</label>
            <label class="pipeline-toggle-item"><input type="checkbox" class="pipe-history" ${pass.useChatHistory ? 'checked' : ''} onchange="pipelineSave()"> Chat History</label>
          </div>
        </div>
      `;
      flow.innerHTML += `<div class="pipeline-arrow">&darr;</div>`;
      flow.innerHTML += `<button class="pipeline-add-btn" onclick="pipelineAddPass(${i + 1})">+ Add Pass</button>`;
      flow.innerHTML += `<div class="pipeline-arrow">&darr;</div>`;
    }

    // Final Output node
    flow.innerHTML += `
      <div class="pipeline-node final-node" data-id="final">
        <div class="pipeline-pass-header">
          <span class="pipeline-pass-title">Final Output</span>
        </div>
        <textarea class="pipe-instructions" placeholder="Instructions for the final response (optional)..." onchange="pipelineSave()">${escapeHtml(pipeline.finalInstructions || '')}</textarea>
        <div class="pipeline-toggles">
          <label class="pipeline-toggle-item"><input type="checkbox" class="pipe-lore" ${pipeline.finalUseLore !== false ? 'checked' : ''} onchange="pipelineSave()"> Lorebook</label>
          <label class="pipeline-toggle-item"><input type="checkbox" class="pipe-mtm" ${pipeline.finalUseMtm !== false ? 'checked' : ''} onchange="pipelineSave()"> Mid-term Memory</label>
          <label class="pipeline-toggle-item"><input type="checkbox" class="pipe-history" ${pipeline.finalUseHistory !== false ? 'checked' : ''} onchange="pipelineSave()"> Chat History</label>
        </div>
      </div>
    `;
  }
  renderPipeline();

  // ─── Helpers ───
  function handleKey(ev) {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      sendMessage();
    }
  }

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ─── Dev Console ───
  function devLog(msg, type = 'info') {
    const container = document.getElementById('devConsoleLogs');
    if (!container) return;
    const div = document.createElement('div');
    const time = new Date().toLocaleTimeString([], { hour12: false });
    
    let color = 'var(--gray-bright)';
    if (type === 'warn') color = 'orange';
    if (type === 'error') color = 'var(--red-light)';
    if (type === 'success') color = '#4caf50';

    div.innerHTML = `<span style="color:var(--gray-lighter)">[${time}]</span> <span style="color:${color}">${escapeHtml(msg)}</span>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  // Initialize table file handle on load
  initTableFileHandle();
