/* -------------------------
  Apple & Oats - script.js
  Vanilla JS for:
   - simple local "auth" (localStorage)
   - scanner (camera capture & upload)
   - mock plant analysis (simulated)
   - chatbot (localStorage)
   - dashboard/profile rendering
------------------------- */

const App = (() => {
  /* keys used in localStorage */
  const LS_USER = "ao_user"; // {email, name, avatar}
  const LS_PLANTS = "ao_plants"; // array of {id, name, dataUrl, result, status, created}
  const LS_CHATS = "ao_chats"; // array of {id, role, text, ts}

  /* helpers */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
  const uid = (n=6) => Math.random().toString(36).slice(2,n+2);

  /* storage helpers */
  function getUser(){ try { return JSON.parse(localStorage.getItem(LS_USER)); } catch(e){ return null; } }
  function setUser(u){ localStorage.setItem(LS_USER, JSON.stringify(u)); }
  function signOut(){ localStorage.removeItem(LS_USER); location.href = "index.html"; }

  function getPlants(){ try { return JSON.parse(localStorage.getItem(LS_PLANTS)) || []; } catch(e){ return []; } }
  function savePlants(arr){ localStorage.setItem(LS_PLANTS, JSON.stringify(arr)); }

  function getChats(){ try { return JSON.parse(localStorage.getItem(LS_CHATS)) || []; } catch(e){ return []; } }
  function saveChats(arr){ localStorage.setItem(LS_CHATS, JSON.stringify(arr)); }

  /* page-specific logic */
  function initNavbar(){
    const user = getUser();
    const nav = $$('.nav-links');
    // if navbar exists on page
    const navLinks = $$('.nav-links')[0];
    if(navLinks){
      navLinks.innerHTML = `
        <li><a href="dashboard.html">Dashboard</a></li>
        <li><a href="scanner.html">Scanner</a></li>
        <li><a href="chatbot.html">Chatbot</a></li>
        <li><a href="knowledge.html">Knowledge Hub</a></li>
        <li><a href="profile.html">Profile</a></li>
      `;
    }
    const authBtn = document.createElement('div');
    authBtn.className = "center";
    // add sign in/out links conditionally
    const navbar = document.querySelector('.navbar');
    if(!navbar) return;
    const right = document.createElement('div');
    right.style.display='flex';
    right.style.gap='8px';
    right.style.alignItems='center';
    if(user){
      const span = document.createElement('span');
      span.textContent = `Hi, ${user.name || user.email}`;
      span.className = "small";
      const out = document.createElement('button');
      out.textContent = 'Sign Out';
      out.style.padding='6px 8px';
      out.style.borderRadius='8px';
      out.onclick = signOut;
      right.appendChild(span);
      right.appendChild(out);
    } else {
      const inA=document.createElement('a'); inA.href='signin.html'; inA.textContent='Sign In';
      const upA=document.createElement('a'); upA.href='signup.html'; upA.textContent='Sign Up';
      inA.style.padding='6px 8px'; inA.style.borderRadius='8px'; inA.style.background='#fff'; inA.style.textDecoration='none';
      upA.style.padding='6px 8px'; upA.style.borderRadius='8px'; upA.style.background='#fff'; upA.style.textDecoration='none';
      right.appendChild(inA); right.appendChild(upA);
    }
    if(!navbar.querySelector('.nav-right')) {
      const container = document.createElement('div');
      container.className='nav-right';
      container.style.display='flex';
      container.style.alignItems='center';
      container.appendChild(right);
      navbar.appendChild(container);
    } else {
      navbar.querySelector('.nav-right').replaceWith(right);
    }
  }

  /* Simple client auth (mock) */
  function initAuthPages(){
    // signup page
    const signupForm = $('#signup-form');
    if(signupForm){
      signupForm.addEventListener('submit', e=>{
        e.preventDefault();
        const name = $('#su-name').value.trim();
        const email = $('#su-email').value.trim();
        const avatar = $('#su-avatar').files[0] ? URL.createObjectURL($('#su-avatar').files[0]) : '';
        if(!email){ alert('enter email'); return; }
        setUser({name,email,avatar});
        alert('Signed up (mock). Redirecting to profile.');
        location.href='profile.html';
      });
    }

    // signin page
    const signinForm = $('#signin-form');
    if(signinForm){
      signinForm.addEventListener('submit', e=>{
        e.preventDefault();
        const email = $('#si-email').value.trim();
        if(!email){ alert('enter email'); return; }
        // for demo: create user object with email only if not exist
        const existing = getUser();
        setUser({email, name: email.split('@')[0]});
        location.href='dashboard.html';
      });
    }

    // profile edit
    const profileForm = $('#profile-form');
    if(profileForm){
      const user = getUser()||{};
      $('#pf-name').value = user.name||'';
      $('#pf-email').value = user.email||'';
      $('#profile-avatar-preview').src = user.avatar || './assets/plants.png';
      $('#pf-avatar').addEventListener('change', ev=>{
        const f = ev.target.files[0];
        if(f) $('#profile-avatar-preview').src = URL.createObjectURL(f);
      });
      profileForm.addEventListener('submit', e=>{
        e.preventDefault();
        const name = $('#pf-name').value.trim();
        const email = $('#pf-email').value.trim();
        const avatarFile = $('#pf-avatar').files[0];
        let avatar = getUser() && getUser().avatar || '';
        if(avatarFile) avatar = URL.createObjectURL(avatarFile);
        const u = {name,email,avatar};
        setUser(u);
        alert('Profile updated (local).');
        renderProfile();
      });
    }
  }

  /* Dashboard rendering */
  function renderDashboard(){
    const listWrap = $('#plants-list');
    if(!listWrap) return;
    const plants = getPlants();
    listWrap.innerHTML = '';
    if(plants.length===0){
      listWrap.innerHTML = `<div class="small">No plants saved yet. Use Scanner to add plants.</div>`;
      return;
    }
    plants.slice().reverse().forEach(p=>{
      const item = document.createElement('div'); item.className='plant-item';
      const img = document.createElement('img'); img.className='plant-thumb'; img.src = p.dataUrl;
      const meta = document.createElement('div'); meta.className='plant-meta';
      const title = document.createElement('div'); title.innerHTML = `<strong>${p.name || 'Plant'}</strong> <div class="small">${new Date(p.created).toLocaleString()}</div>`;
      const status = document.createElement('div'); status.style.marginTop='6px';
      const pill = document.createElement('span'); pill.className='status-pill ' + (p.status==='Healthy'?'status-healthy':'status-risk'); pill.textContent = p.status==='Healthy' ? 'Healthy 🌿' : 'At-Risk ⚠️';
      status.appendChild(pill);
      const note = document.createElement('div'); note.className='small'; note.style.marginTop='6px'; note.textContent = p.result || '—';
      meta.appendChild(title); meta.appendChild(note); meta.appendChild(status);
      item.appendChild(img); item.appendChild(meta);
      listWrap.appendChild(item);
    });
  }

  /* Scanner: camera + upload, and mock analysis */
  function initScanner(){
    const video = $('#scanner-video');
    const startBtn = $('#scanner-start');
    const captureBtn = $('#scanner-capture');
    const uploadInput = $('#scanner-upload');
    const preview = $('#scanner-preview');
    const analyzeBtn = $('#scanner-analyze');
    let stream = null;

    // show saved plants quick
    renderDashboard();

    function stopStream(){ if(stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; } }

    if(startBtn && navigator.mediaDevices){
      startBtn.addEventListener('click', async ()=>{
        try {
          stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}, audio:false});
          video.srcObject = stream;
          video.play();
          video.style.display='block';
          captureBtn.style.display='inline-block';
        } catch(err){
          alert('Camera access denied or unavailable.');
        }
      });
    }
    if(captureBtn){
      captureBtn.addEventListener('click', ()=>{
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video,0,0,canvas.width,canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg',0.9);
        preview.src = dataUrl; preview.style.display='block';
        $('#scanner-result').textContent = '';
        stopStream();
        video.style.display='none';
        captureBtn.style.display='none';
      });
    }

    if(uploadInput){
      uploadInput.addEventListener('change', e=>{
        const f = e.target.files[0];
        if(!f) return;
        const reader = new FileReader();
        reader.onload = () => { preview.src = reader.result; preview.style.display='block'; $('#scanner-result').textContent = ''; };
        reader.readAsDataURL(f);
      });
    }

    if(analyzeBtn){
      analyzeBtn.addEventListener('click', ()=>{
        const dataUrl = preview.src;
        if(!dataUrl){ alert('Please capture or upload an image first.'); return; }
        // simulate analysis (mock)
        $('#scanner-result').textContent = 'Analysing…';
        analyzeBtn.disabled = true;
        setTimeout(()=>{
          // mock result: random healthy / risk + species
          const species = ['Ficus lyrata','Monstera deliciosa','Aloe vera','Pothos','Rose'];
          const issues = ['Nitrogen deficiency','Spider mite','Overwatering','Fungal spot','No issue detected'];
          const pickS = species[Math.floor(Math.random()*species.length)];
          const issue = issues[Math.floor(Math.random()*issues.length)];
          const status = issue==='No issue detected' ? 'Healthy' : (Math.random() < 0.6 ? 'At-Risk' : 'Healthy');
          const resultText = `Species: ${pickS}. Detected: ${issue}.`;
          $('#scanner-result').textContent = resultText;
          analyzeBtn.disabled = false;

          // save plant to local storage
          const plants = getPlants();
          plants.push({
            id: uid(8),
            name: pickS,
            dataUrl,
            result: resultText,
            status,
            created: Date.now()
          });
          savePlants(plants);
          renderDashboard();
          alert('Analysis saved to your local plant history (demo).');
        }, 1200 + Math.random()*2000);
      });
    }
  }

  /* Chatbot (simple local assistant) */
  function initChatbot(){
    const cw = $('#chat-window');
    const chatForm = $('#chat-form');
    const chatInput = $('#chat-input');
    if(!chatForm) return;
    function renderChats(){
      const chats = getChats();
      cw.innerHTML = '';
      chats.forEach(msg=>{
        const div = document.createElement('div');
        div.className = 'chat-msg ' + (msg.role==='user' ? 'chat-user' : 'chat-bot');
        div.textContent = msg.text;
        cw.appendChild(div);
      });
      cw.scrollTop = cw.scrollHeight;
    }
    renderChats();

    chatForm.addEventListener('submit', e=>{
      e.preventDefault();
      const text = chatInput.value.trim(); if(!text) return;
      const chats = getChats();
      const userMsg = {id:uid(6), role:'user', text, ts:Date.now()};
      chats.push(userMsg);
      saveChats(chats);
      renderChats();
      chatInput.value='';
      // simulate bot reply
      setTimeout(()=>{
        const reply = simpleBotReply(text);
        const chats2 = getChats();
        chats2.push({id: uid(6), role:'bot', text:reply, ts:Date.now()});
        saveChats(chats2);
        renderChats();
      }, 700 + Math.random()*800);
    });
  }

  // very small rule-based reply (demo)
  function simpleBotReply(q){
    q = q.toLowerCase();
    if(q.includes('water')) return 'Watering tip: check soil moisture. Water when top 1-2 inches are dry. Avoid waterlogging.';
    if(q.includes('sun')||q.includes('light')) return 'Light advice: most houseplants prefer bright indirect light. Direct sun may scorch leaves.';
    if(q.includes('toxic')) return 'Toxicity: many plants can be toxic to pets. If concerned, avoid ingestion and keep plants out of reach.';
    if(q.includes('help')||q.includes('sick')) return 'Try checking for pests, brown spots, and watering routine. You can upload a photo in Scanner for analysis.';
    return "That's interesting — can you share a photo? I can help guess from the image (demo).";
  }

  /* Profile page rendering */
  function renderProfile(){
    const user = getUser();
    if(!user) return;
    const pName = $('#profile-name'); if(pName) pName.textContent = user.name || user.email;
    const pEmail = $('#profile-email'); if(pEmail) pEmail.textContent = user.email;
    const avatar = $('#profile-avatar') || $('#profile-avatar-preview');
    if(avatar) avatar.src = user.avatar || './assets/plants.png';
    // render saved plants
    const wrap = $('#profile-plants');
    if(wrap){
      const plants = getPlants();
      wrap.innerHTML = '';
      plants.slice().reverse().forEach(p=>{
        const el = document.createElement('div'); el.className='plant-item';
        const img = document.createElement('img'); img.className='plant-thumb'; img.src = p.dataUrl;
        const meta = document.createElement('div'); meta.className='plant-meta';
        meta.innerHTML = `<strong>${p.name}</strong><div class="small">${new Date(p.created).toLocaleString()}</div><div class="small">${p.result}</div>`;
        el.appendChild(img); el.appendChild(meta);
        wrap.appendChild(el);
      });
      if(plants.length===0) wrap.innerHTML = `<div class="small">No saved plant history.</div>`;
    }
  }

  /* common init - run on every page */
  function initCommon(){
    initNavbar();
    initAuthPages();
    // page-specific
    if(document.location.pathname.endsWith('dashboard.html')) renderDashboard();
    if(document.location.pathname.endsWith('scanner.html')) initScanner();
    if(document.location.pathname.endsWith('chatbot.html')) initChatbot();
    if(document.location.pathname.endsWith('profile.html')) renderProfile();
  }

  /* expose */
  return { initCommon };
})();

document.addEventListener('DOMContentLoaded', ()=>{
  App.initCommon();
});
