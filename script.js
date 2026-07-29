/* ============================================================
   POP 製作台 - 主程式
   ============================================================ */

const MM = 3.7795275591; // px per mm at 96dpi

/* ---------- 版型資料：每個版型是一組色塊 (x/y/w/h 為畫布的百分比) ---------- */
const TEMPLATES = [
  { id:'full',        name:'滿版單張',
    blocks:[ {x:0,y:0,w:100,h:100} ] },

  { id:'stack-half',  name:'上下對半',
    blocks:[ {x:0,y:0,w:100,h:50}, {x:0,y:50,w:100,h:50,tint:'accent'} ] },

  { id:'split-half',  name:'左右對半',
    blocks:[ {x:0,y:0,w:50,h:100}, {x:50,y:0,w:50,h:100,tint:'accent'} ] },

  { id:'stack-70-30', name:'上大下小',
    blocks:[ {x:0,y:0,w:100,h:68}, {x:0,y:68,w:100,h:32,tint:'accent'} ] },

  { id:'split-65-35', name:'左大右小',
    blocks:[ {x:0,y:0,w:64,h:100}, {x:64,y:0,w:36,h:100,tint:'accent'} ] },

  { id:'thirds-row',  name:'橫向三等分',
    blocks:[ {x:0,y:0,w:100,h:33.33}, {x:0,y:33.33,w:100,h:33.33,tint:'accent'}, {x:0,y:66.66,w:100,h:33.34} ] },

  { id:'thirds-col',  name:'直向三等分',
    blocks:[ {x:0,y:0,w:33.33,h:100}, {x:33.33,y:0,w:33.33,h:100,tint:'accent'}, {x:66.66,y:0,w:33.34,h:100} ] },

  { id:'grid-2x2',    name:'四等分',
    blocks:[ {x:0,y:0,w:50,h:50}, {x:50,y:0,w:50,h:50,tint:'accent'}, {x:0,y:50,w:50,h:50,tint:'accent'}, {x:50,y:50,w:50,h:50} ] },

  { id:'big-left-3',  name:'一大三小（直）',
    blocks:[ {x:0,y:0,w:60,h:100}, {x:60,y:0,w:40,h:33.33,tint:'accent'}, {x:60,y:33.33,w:40,h:33.33}, {x:60,y:66.66,w:40,h:33.34,tint:'accent'} ] },

  { id:'big-top-3',   name:'一大三小（橫）',
    blocks:[ {x:0,y:0,w:100,h:60}, {x:0,y:60,w:33.33,h:40,tint:'accent'}, {x:33.33,y:60,w:33.33,h:40}, {x:66.66,y:60,w:33.34,h:40,tint:'accent'} ] },

  { id:'diagonal',    name:'對角分割',
    blocks:[
      {x:0,y:0,w:100,h:100, clip:'polygon(0 0, 100% 0, 0 100%)'},
      {x:0,y:0,w:100,h:100, clip:'polygon(100% 0, 100% 100%, 0 100%)', tint:'accent'}
    ] },
];

/* ---------- 預設 LOGO 庫 ---------- */
const PRESET_LOGOS = [
  { name:'Converse 直式 - 黑', src:'assets/logos/converse-stacked-black.png' },
  { name:'Converse 直式 - 白', src:'assets/logos/converse-stacked-white.png' },
  { name:'Converse 橫式 - 黑', src:'assets/logos/converse-strip-black.png' },
  { name:'Converse 橫式 - 白', src:'assets/logos/converse-strip-white.png' },
  { name:'ABC SELECT', src:'assets/logos/logo01-abc-select.png' },
  { name:'ABC MART KIDS', src:'assets/logos/logo02-abckids-a4.png' },
  { name:'ABC-MART KIDS', src:'assets/logos/logo03-abckids-a4y.png' },
  { name:'ABC-MART GRAND STAGE 直式・白', src:'assets/logos/logo04-grandstage-vertical-white.png' },
  { name:'ABC-MART GRAND STAGE 橫式・黑', src:'assets/logos/logo05-grandstage-horizontal-black.png' },
  { name:'ABC SELECT・白', src:'assets/logos/logo06-abcselect-white.png' },
  { name:'ABC SELECT・黑', src:'assets/logos/logo07-abcselect-black.jpg' },
  { name:'FILA・白', src:'assets/logos/logo08-fila-white.png' },
  { name:'hs', src:'assets/logos/logo09-hs.png' },
  { name:'LOGO A4・白', src:'assets/logos/logo10-a4-white.png' },
  { name:'ABC MART・黑', src:'assets/logos/logo11-a4-black.png' },
  { name:'ABC-MART 橫・黑', src:'assets/logos/logo12-horizontal-black.png' },
  { name:'ABC-MART・紅', src:'assets/logos/logo13-red.png' },
  { name:'ABC MART・紅（透明底）', src:'assets/logos/logo14-red-transparent.png' },
  { name:'NUOVO', src:'assets/logos/logo15-nuovo.png' },
  { name:'SKECHERS', src:'assets/logos/logo16-skechers.png' },
];
let customLogos = []; // 使用者自行上傳的（僅本次瀏覽有效）

/* ---------- 全域狀態 ---------- */
const state = {
  orient:'portrait',
  bg:'#F4E7D3', accent:'#E4536B', text:'#2B2620',
  font:"'Noto Sans TC', sans-serif", weight:900,
  border:'none',
  templateId:'stack-70-30',
  blocks:[],           // 目前畫布上的色塊（含使用者輸入的內容）
  selectedBlockIndex:null,
  logos:[],            // 目前畫布上的 logo 實例
  selectedLogoId:null,
};
let logoIdSeq = 1;
let currentScale = 1;

/* ---------- DOM 參照 ---------- */
const sheet = document.getElementById('sheet');
const scaler = document.getElementById('scaler');
const stage = document.querySelector('.stage');
const blocksLayer = document.getElementById('blocks-layer');
const logoLayer = document.getElementById('logo-layer');
const blockInspector = document.getElementById('block-inspector-section');
const blockActions = document.getElementById('block-actions');
const blockImageUpload = document.getElementById('block-image-upload');

/* ============================================================
   版型套用
   ============================================================ */
function applyTemplate(tplId){
  const tpl = TEMPLATES.find(t=>t.id===tplId);
  if(!tpl) return;
  state.templateId = tplId;
  state.selectedBlockIndex = null;
  state.blocks = tpl.blocks.map((b, i)=>({
    x:b.x, y:b.y, w:b.w, h:b.h, clip:b.clip||null, tint:b.tint||'base',
    type: i===0 ? 'image' : 'text',
    text: i===0 ? '' : '點擊輸入文字',
    imgSrc: null,
  }));
  renderTemplateGrid();
  renderBlocks();
  blockInspector.hidden = true;
}

function renderTemplateGrid(){
  const grid = document.getElementById('template-grid');
  grid.innerHTML = '';
  TEMPLATES.forEach(tpl=>{
    const card = document.createElement('div');
    card.className = 'tpl-card' + (tpl.id===state.templateId ? ' active' : '');
    const thumb = document.createElement('div');
    thumb.className = 'tpl-thumb' + (state.orient==='landscape' ? ' landscape' : '');
    const palette = ['#e9c7cf','#f4d488','#b9d2a0','#9fc9d6'];
    tpl.blocks.forEach((b, i)=>{
      const seg = document.createElement('div');
      seg.className = 'tpl-thumb-block';
      seg.style.left = b.x+'%'; seg.style.top = b.y+'%';
      seg.style.width = b.w+'%'; seg.style.height = b.h+'%';
      seg.style.background = palette[i % palette.length];
      if(b.clip) seg.style.clipPath = b.clip;
      thumb.appendChild(seg);
    });
    card.appendChild(thumb);
    const name = document.createElement('p');
    name.className = 'tpl-name';
    name.textContent = tpl.name;
    card.appendChild(name);
    card.addEventListener('click', ()=>applyTemplate(tpl.id));
    grid.appendChild(card);
  });
}

/* ============================================================
   色塊渲染
   ============================================================ */
function renderBlocks(){
  blocksLayer.innerHTML = '';
  state.blocks.forEach((block, i)=>{
    const el = document.createElement('div');
    el.className = 'pop-block type-'+block.type + (state.selectedBlockIndex===i ? ' selected':'');
    el.style.left = block.x+'%'; el.style.top = block.y+'%';
    el.style.width = block.w+'%'; el.style.height = block.h+'%';
    if(block.clip) el.style.clipPath = block.clip;

    if(block.type === 'image'){
      if(block.imgSrc){
        const img = document.createElement('img');
        img.src = block.imgSrc;
        el.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.className = 'image-placeholder';
        ph.textContent = '點擊上傳照片';
        el.appendChild(ph);
      }
    } else {
      const bgColor = block.tint === 'accent' ? state.accent : state.bg;
      const fgColor = block.tint === 'accent' ? '#ffffff' : state.text;
      el.style.background = bgColor;
      const txt = document.createElement('div');
      txt.className = 'block-text';
      txt.contentEditable = 'true';
      txt.style.color = fgColor;
      txt.style.fontWeight = state.weight;
      txt.textContent = block.text;
      txt.addEventListener('input', ()=>{ state.blocks[i].text = txt.textContent; });
      txt.addEventListener('click', e=>e.stopPropagation());
      txt.addEventListener('focus', ()=>selectBlock(i));
      el.appendChild(txt);
    }

    el.addEventListener('click', ()=>selectBlock(i));
    blocksLayer.appendChild(el);
  });
}

function selectBlock(i){
  state.selectedBlockIndex = i;
  renderBlocks();
  showBlockInspector(i);
}

function showBlockInspector(i){
  const block = state.blocks[i];
  blockInspector.hidden = false;
  const seg = document.getElementById('seg-block-type');
  seg.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.v===block.type));

  blockActions.innerHTML = '';
  if(block.type === 'image'){
    const btnUpload = document.createElement('button');
    btnUpload.className = 'btn';
    btnUpload.textContent = block.imgSrc ? '更換照片' : '上傳照片';
    btnUpload.addEventListener('click', ()=>{
      blockImageUpload.dataset.blockIndex = i;
      blockImageUpload.click();
    });
    blockActions.appendChild(btnUpload);
    if(block.imgSrc){
      const btnRemove = document.createElement('button');
      btnRemove.className = 'btn';
      btnRemove.textContent = '移除照片';
      btnRemove.addEventListener('click', ()=>{
        state.blocks[i].imgSrc = null;
        renderBlocks(); showBlockInspector(i);
      });
      blockActions.appendChild(btnRemove);
    }
  } else {
    const btnClear = document.createElement('button');
    btnClear.className = 'btn';
    btnClear.textContent = '清空文字';
    btnClear.addEventListener('click', ()=>{
      state.blocks[i].text = '';
      renderBlocks(); showBlockInspector(i);
    });
    blockActions.appendChild(btnClear);
  }
}

document.getElementById('seg-block-type').addEventListener('click', e=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const i = state.selectedBlockIndex; if(i===null) return;
  state.blocks[i].type = btn.dataset.v;
  renderBlocks();
  showBlockInspector(i);
});

blockImageUpload.addEventListener('change', e=>{
  const file = e.target.files[0]; if(!file) return;
  const i = +blockImageUpload.dataset.blockIndex;
  const reader = new FileReader();
  reader.onload = ()=>{
    state.blocks[i].imgSrc = reader.result;
    renderBlocks();
    showBlockInspector(i);
  };
  reader.readAsDataURL(file);
  blockImageUpload.value = '';
});

/* click on empty stage area (not a block) clears selection */
sheet.addEventListener('click', e=>{
  if(e.target === sheet || e.target === blocksLayer || e.target === logoLayer){
    state.selectedBlockIndex = null;
    renderBlocks();
    blockInspector.hidden = true;
    deselectLogo();
  }
});

/* ============================================================
   LOGO 庫
   ============================================================ */
function renderLogoGrid(){
  const grid = document.getElementById('logo-grid');
  grid.innerHTML = '';
  [...PRESET_LOGOS, ...customLogos].forEach(logo=>{
    const thumb = document.createElement('div');
    thumb.className = 'logo-thumb';
    thumb.title = logo.name + '（點擊加入畫布）';
    const img = document.createElement('img');
    img.src = logo.src;
    thumb.appendChild(img);
    thumb.addEventListener('click', ()=>addLogoToCanvas(logo.src));
    grid.appendChild(thumb);
  });
}

document.getElementById('logo-upload').addEventListener('change', e=>{
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    customLogos.push({ name:file.name, src:reader.result });
    renderLogoGrid();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

function addLogoToCanvas(src){
  const img = new Image();
  img.onload = ()=>{
    const aspect = img.naturalWidth / img.naturalHeight;
    const widthMM = 50; // 預設寬度
    const heightMM = widthMM / aspect;
    const logo = {
      id: logoIdSeq++,
      src, aspect,
      xMM: 15, yMM: 15,
      wMM: widthMM, hMM: heightMM,
    };
    state.logos.push(logo);
    state.selectedLogoId = logo.id;
    renderLogos();
  };
  img.src = src;
}

function renderLogos(){
  logoLayer.innerHTML = '';
  state.logos.forEach(logo=>{
    const el = document.createElement('div');
    el.className = 'logo-el' + (state.selectedLogoId===logo.id ? ' selected':'');
    el.style.left = logo.xMM+'mm';
    el.style.top = logo.yMM+'mm';
    el.style.width = logo.wMM+'mm';
    el.style.height = logo.hMM+'mm';

    const img = document.createElement('img');
    img.src = logo.src;
    el.appendChild(img);

    const removeBtn = document.createElement('div');
    removeBtn.className = 'logo-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', ev=>{
      ev.stopPropagation();
      state.logos = state.logos.filter(l=>l.id!==logo.id);
      renderLogos();
    });
    el.appendChild(removeBtn);

    const handle = document.createElement('div');
    handle.className = 'logo-handle';
    el.appendChild(handle);

    el.addEventListener('pointerdown', ev=>{
      if(ev.target===handle || ev.target===removeBtn) return;
      startLogoDrag(ev, logo);
    });
    handle.addEventListener('pointerdown', ev=>startLogoResize(ev, logo));

    logoLayer.appendChild(el);
  });
}

function deselectLogo(){ state.selectedLogoId=null; renderLogos(); }

function startLogoDrag(ev, logo){
  ev.preventDefault();
  state.selectedLogoId = logo.id;
  renderLogos();
  const startX = ev.clientX, startY = ev.clientY;
  const startXMM = logo.xMM, startYMM = logo.yMM;

  function onMove(e){
    const dxMM = (e.clientX-startX)/currentScale/MM;
    const dyMM = (e.clientY-startY)/currentScale/MM;
    logo.xMM = startXMM + dxMM;
    logo.yMM = startYMM + dyMM;
    renderLogos();
  }
  function onUp(){
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
  }
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

function startLogoResize(ev, logo){
  ev.preventDefault();
  ev.stopPropagation();
  state.selectedLogoId = logo.id;
  const startX = ev.clientX;
  const startWMM = logo.wMM;

  function onMove(e){
    const dWMM = (e.clientX-startX)/currentScale/MM;
    const newW = Math.max(12, startWMM + dWMM);
    logo.wMM = newW;
    logo.hMM = newW / logo.aspect;
    renderLogos();
  }
  function onUp(){
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
  }
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

/* ============================================================
   全域樣式（顏色 / 字體 / 邊框 / 版面）
   ============================================================ */
function applyGlobalStyles(){
  sheet.style.setProperty('--sheet-bg', state.bg);
  sheet.style.setProperty('--sheet-accent', state.accent);
  sheet.style.setProperty('--sheet-text', state.text);
  sheet.style.setProperty('--sheet-font', state.font);

  sheet.classList.toggle('landscape', state.orient==='landscape');

  sheet.classList.remove('border-solid','border-double','border-tag');
  if(state.border!=='none') sheet.classList.add('border-'+state.border);

  updatePageStyle();
  renderBlocks();
  renderTemplateGrid();
  fitToStage();
}

let pageStyleTag = document.createElement('style');
document.head.appendChild(pageStyleTag);
function updatePageStyle(){
  pageStyleTag.textContent = `@page{ size: A4 ${state.orient}; margin:0; }`;
}

function fitToStage(){
  const widthPx = (state.orient==='portrait'?210:297)*MM;
  const heightPx = (state.orient==='portrait'?297:210)*MM;
  const available = stage.clientWidth - 48;
  currentScale = Math.min(1, available/widthPx);
  scaler.style.width = (widthPx*currentScale)+'px';
  scaler.style.height = (heightPx*currentScale)+'px';
  sheet.style.transform = `scale(${currentScale})`;
}

/* ---------- 控制項綁定 ---------- */
document.getElementById('seg-orient').addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  state.orient = b.dataset.v;
  document.querySelectorAll('#seg-orient button').forEach(x=>x.classList.toggle('active', x===b));
  applyGlobalStyles();
});
document.getElementById('col-bg').addEventListener('input', e=>{state.bg=e.target.value; applyGlobalStyles();});
document.getElementById('col-accent').addEventListener('input', e=>{state.accent=e.target.value; applyGlobalStyles();});
document.getElementById('col-text').addEventListener('input', e=>{state.text=e.target.value; applyGlobalStyles();});
document.getElementById('sel-font').addEventListener('change', e=>{
  state.font=e.target.value;
  state.weight = +e.target.selectedOptions[0].dataset.weight;
  applyGlobalStyles();
});
document.getElementById('border-picker').addEventListener('click', e=>{
  const b = e.target.closest('.border-opt'); if(!b) return;
  state.border = b.dataset.b;
  document.querySelectorAll('#border-picker .border-opt').forEach(x=>x.classList.toggle('active', x===b));
  applyGlobalStyles();
});
document.getElementById('btn-reset').addEventListener('click', ()=>{
  if(!confirm('確定要重設整張 POP 嗎？照片、文字與 LOGO 都會被清空。')) return;
  state.logos = [];
  applyTemplate(state.templateId);
});

/* ============================================================
   輸出：列印 / 下載 PNG
   ============================================================ */
document.getElementById('btn-print').addEventListener('click', ()=>{
  window.print();
});

document.getElementById('btn-png').addEventListener('click', ()=>{
  const run = ()=>{
    document.body.classList.add('exporting');
    const prevTransform = sheet.style.transform;
    const prevW = scaler.style.width, prevH = scaler.style.height;
    sheet.style.transform = 'none';
    scaler.style.width = sheet.offsetWidth+'px';
    scaler.style.height = sheet.offsetHeight+'px';
    html2canvas(sheet, {scale:2, useCORS:true}).then(canvas=>{
      sheet.style.transform = prevTransform;
      scaler.style.width = prevW; scaler.style.height = prevH;
      document.body.classList.remove('exporting');
      const link = document.createElement('a');
      link.download = 'pop-a4.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };
  if(window.html2canvas){ run(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  s.onload = run;
  document.body.appendChild(s);
});

/* ============================================================
   初始化
   ============================================================ */
window.addEventListener('resize', fitToStage);
renderLogoGrid();
applyTemplate(state.templateId);
applyGlobalStyles();
