const state = {
  mainImages: [],
  charAImage: '',
  charBImage: '',
  profileFields: {
    A: [
      { label: '직업', value: '예시 직업' },
      { label: '생일', value: '1월 1일' },
      { label: '소속', value: '예시 소속' }
    ],
    B: [
      { label: '직업', value: '예시 직업' },
      { label: '생일', value: '12월 31일' },
      { label: '소속', value: '예시 소속' }
    ]
  },
  blocks: []
};

const MIN_BLOCKS = 3;
const MAX_BLOCKS = 15;

const $ = (id) => document.getElementById(id);

const inputs = [
  'pairName', 'pairSubtitle', 'pairColor', 'bgColor',
  'charAColor', 'charBColor', 'charAName', 'charAKeywords', 'charABio',
  'charBName', 'charBKeywords', 'charBBio', 'charAStory', 'charBStory'
];

function init() {
  for (let i = 0; i < MIN_BLOCKS; i++) addBlock(false);

  inputs.forEach(id => $(id).addEventListener('input', render));
  $('mainImageInput').addEventListener('change', handleMainImages);
  $('charAImageInput').addEventListener('change', event => handleCharacterImage(event, 'A'));
  $('charBImageInput').addEventListener('change', event => handleCharacterImage(event, 'B'));
  $('addAFieldBtn').addEventListener('click', () => addProfileField('A'));
  $('addBFieldBtn').addEventListener('click', () => addProfileField('B'));
  $('addBlockBtn').addEventListener('click', () => addBlock(true));
  $('removeBlockBtn').addEventListener('click', removeBlock);
  $('savePngBtn').addEventListener('click', savePng);

  buildProfileFieldForms('A');
  buildProfileFieldForms('B');
  render();
}

function makeBlockData(index) {
  return {
    title: `${index + 1}. 장면 제목`,
    story: '이 장면에서 두 사람에게 일어난 일을 적어주세요.',
    quoteA: '',
    quoteB: '',
    image: ''
  };
}

function addBlock(shouldRender = true) {
  if (state.blocks.length >= MAX_BLOCKS) {
    alert('타임라인 블럭은 최대 15개까지 가능해.');
    return;
  }
  state.blocks.push(makeBlockData(state.blocks.length));
  buildForms();
  if (shouldRender) render();
}

function removeBlock() {
  if (state.blocks.length <= MIN_BLOCKS) {
    alert('타임라인 블럭은 최소 3개가 필요해.');
    return;
  }
  state.blocks.pop();
  buildForms();
  render();
}

function addProfileField(character) {
  state.profileFields[character].push({ label: '새 항목', value: '' });
  buildProfileFieldForms(character);
  render();
}

function removeProfileField(character, index) {
  state.profileFields[character].splice(index, 1);
  buildProfileFieldForms(character);
  render();
}

function buildProfileFieldForms(character) {
  const wrap = character === 'A' ? $('charAFields') : $('charBFields');
  wrap.innerHTML = '';

  state.profileFields[character].forEach((field, index) => {
    const row = document.createElement('div');
    row.className = 'profile-field-row';
    row.innerHTML = `
      <label>항목명
        <input type="text" data-role="label" data-character="${character}" data-index="${index}" value="${escapeAttr(field.label)}" placeholder="직업" />
      </label>
      <label>내용
        <input type="text" data-role="value" data-character="${character}" data-index="${index}" value="${escapeAttr(field.value)}" placeholder="내용" />
      </label>
      <button type="button" class="remove-field-btn" data-character="${character}" data-index="${index}">삭제</button>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', event => {
      const target = event.target;
      const character = target.dataset.character;
      const index = Number(target.dataset.index);
      const role = target.dataset.role;
      state.profileFields[character][index][role] = target.value;
      render();
    });
  });

  wrap.querySelectorAll('.remove-field-btn').forEach(button => {
    button.addEventListener('click', event => {
      const character = event.target.dataset.character;
      const index = Number(event.target.dataset.index);
      removeProfileField(character, index);
    });
  });
}

function buildForms() {
  const wrap = $('timelineForms');
  wrap.innerHTML = '';

  state.blocks.forEach((block, index) => {
    const card = document.createElement('article');
    card.className = 'timeline-form-card';
    card.innerHTML = `
      <h4>타임라인 ${index + 1}</h4>
      <label>제목
        <input type="text" data-field="title" data-index="${index}" value="${escapeAttr(block.title)}" />
      </label>
      <label>서사
        <textarea rows="4" data-field="story" data-index="${index}">${escapeText(block.story)}</textarea>
      </label>
      <label>캐릭터 A 대사 / 비워도 됨
        <textarea rows="2" data-field="quoteA" data-index="${index}" placeholder="캐릭터 A의 대사">${escapeText(block.quoteA)}</textarea>
      </label>
      <label>캐릭터 B 대사 / 비워도 됨
        <textarea rows="2" data-field="quoteB" data-index="${index}" placeholder="캐릭터 B의 대사">${escapeText(block.quoteB)}</textarea>
      </label>
      <label>일러스트 / 비워도 됨
        <input type="file" accept="image/*" data-field="image" data-index="${index}" />
      </label>
    `;
    wrap.appendChild(card);
  });

  wrap.querySelectorAll('input[type="text"], textarea').forEach(el => {
    el.addEventListener('input', event => {
      const index = Number(event.target.dataset.index);
      const field = event.target.dataset.field;
      state.blocks[index][field] = event.target.value;
      render();
    });
  });

  wrap.querySelectorAll('input[type="file"]').forEach(el => {
    el.addEventListener('change', event => {
      const file = event.target.files[0];
      const index = Number(event.target.dataset.index);
      if (!file) {
        state.blocks[index].image = '';
        render();
        return;
      }
      readFileAsDataUrl(file).then(url => {
        state.blocks[index].image = url;
        render();
      });
    });
  });
}

function handleMainImages(event) {
  const files = Array.from(event.target.files || []);
  Promise.all(files.map(readFileAsDataUrl)).then(urls => {
    state.mainImages = urls;
    render();
  });
}

function handleCharacterImage(event, character) {
  const file = event.target.files[0];
  if (!file) {
    state[`char${character}Image`] = '';
    render();
    return;
  }
  readFileAsDataUrl(file).then(url => {
    state[`char${character}Image`] = url;
    render();
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function render() {
  const pairColor = $('pairColor').value;
  const bgColor = $('bgColor').value;
  const charAColor = $('charAColor').value;
  const charBColor = $('charBColor').value;

  document.documentElement.style.setProperty('--pair-color', pairColor);
  document.documentElement.style.setProperty('--pair-color-light', hexToRgba(pairColor, 0.16));
  document.documentElement.style.setProperty('--bg-color', bgColor);
  document.documentElement.style.setProperty('--char-a-color', charAColor);
  document.documentElement.style.setProperty('--char-b-color', charBColor);

  $('previewPairName').textContent = $('pairName').value || '페어명';
  $('previewSubtitle').textContent = $('pairSubtitle').value || '부제';
  $('previewAName').textContent = $('charAName').value || '캐릭터 A';
  $('previewABio').textContent = $('charABio').value || '';
  $('previewBName').textContent = $('charBName').value || '캐릭터 B';
  $('previewBBio').textContent = $('charBBio').value || '';

  renderMainImages();
  renderCharacterImage('A');
  renderCharacterImage('B');
  renderKeywords('A');
  renderKeywords('B');
  renderProfileTable('A');
  renderProfileTable('B');
  renderSoloStories();
  renderTimeline();
}

function renderMainImages() {
  const gallery = $('mainImageGallery');
  gallery.innerHTML = '';
  gallery.classList.toggle('empty', state.mainImages.length === 0);

  if (state.mainImages.length === 0) {
    gallery.innerHTML = '<span>메인 일러스트</span>';
    return;
  }

  state.mainImages.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '메인 일러스트';
    gallery.appendChild(img);
  });
}

function renderCharacterImage(character) {
  const box = character === 'A' ? $('previewAImage') : $('previewBImage');
  const src = state[`char${character}Image`];
  box.innerHTML = '';
  box.classList.toggle('empty', !src);

  if (!src) {
    box.innerHTML = `<span>캐릭터 ${character} 일러스트</span>`;
    return;
  }

  const img = document.createElement('img');
  img.src = src;
  img.alt = `캐릭터 ${character} 일러스트`;
  box.appendChild(img);
}

function renderKeywords(character) {
  const inputId = character === 'A' ? 'charAKeywords' : 'charBKeywords';
  const wrap = character === 'A' ? $('previewAKeywords') : $('previewBKeywords');
  const keywords = parseKeywords($(inputId).value);
  wrap.innerHTML = '';

  keywords.forEach(keyword => {
    const chip = document.createElement('span');
    chip.className = 'keyword-chip';
    chip.textContent = keyword;
    wrap.appendChild(chip);
  });
}

function renderProfileTable(character) {
  const table = character === 'A' ? $('previewAFields') : $('previewBFields');
  table.innerHTML = '';

  state.profileFields[character]
    .filter(field => field.label.trim() || field.value.trim())
    .forEach(field => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <th>${escapeText(field.label.trim() || '항목')}</th>
        <td>${escapeText(field.value.trim())}</td>
      `;
      table.appendChild(row);
    });
}

function renderSoloStories() {
  const wrap = $('soloStorySection');
  const aStory = $('charAStory').value.trim();
  const bStory = $('charBStory').value.trim();
  wrap.innerHTML = '';

  if (!aStory && !bStory) return;

  if (aStory) {
    wrap.appendChild(makeSoloCard('solo-a', `${$('charAName').value || '캐릭터 A'}의 서사`, aStory));
  }
  if (bStory) {
    wrap.appendChild(makeSoloCard('solo-b', `${$('charBName').value || '캐릭터 B'}의 서사`, bStory));
  }
}

function makeSoloCard(className, title, text) {
  const card = document.createElement('article');
  card.className = `solo-card ${className}`;
  card.innerHTML = `<h3>${escapeText(title)}</h3><p>${escapeText(text)}</p>`;
  return card;
}

function renderTimeline() {
  const wrap = $('timelinePreview');
  wrap.innerHTML = '';

  state.blocks.forEach((block, index) => {
    const card = document.createElement('article');
    card.className = 'timeline-card';
    card.dataset.step = String(index + 1).padStart(2, '0');

    const parts = [];
    if (block.image) parts.push(`<img src="${block.image}" alt="타임라인 ${index + 1} 일러스트" />`);
    parts.push(`<h3>${escapeText(block.title || `타임라인 ${index + 1}`)}</h3>`);
    if (block.story.trim()) parts.push(`<p class="story">${escapeText(block.story)}</p>`);
    if (block.quoteA.trim()) parts.push(`<div class="quote-box quote-a"><strong>${escapeText($('charAName').value || '캐릭터 A')}</strong>${escapeText(block.quoteA)}</div>`);
    if (block.quoteB.trim()) parts.push(`<div class="quote-box quote-b"><strong>${escapeText($('charBName').value || '캐릭터 B')}</strong>${escapeText(block.quoteB)}</div>`);

    card.innerHTML = parts.join('');
    wrap.appendChild(card);
  });
}

async function savePng() {
  const target = $('captureArea');
  await document.fonts.ready;

  const canvas = await html2canvas(target, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    allowTaint: true,
    windowWidth: target.scrollWidth,
    windowHeight: target.scrollHeight
  });

  const link = document.createElement('a');
  const filename = ($('pairName').value || 'pair-timeline').replace(/[\\/:*?"<>|]/g, '_');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function parseKeywords(value) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function hexToRgba(hex, alpha) {
  const raw = hex.replace('#', '');
  const bigint = parseInt(raw, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function escapeText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeAttr(value) {
  return escapeText(value).replaceAll('"', '&quot;');
}

init();
