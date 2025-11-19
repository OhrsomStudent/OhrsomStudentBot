const chatEl = document.getElementById('chat');
const formEl = document.getElementById('chatForm');
const inputEl = document.getElementById('message');
const sendBtn = document.getElementById('sendBtn');
const themeToggle = document.getElementById('themeToggle');
const quickPrompts = document.getElementById('quickPrompts');

let dark = true;

function addMessage(text, role='bot') {
  const tpl = document.getElementById('message-template');
  const node = tpl.content.firstElementChild.cloneNode(true);
  if(role === 'user') node.classList.add('user');
  node.querySelector('.bubble').textContent = text;
  chatEl.appendChild(node);
  chatEl.scrollTop = chatEl.scrollHeight;
  return node;
}

function addLoading() {
  const tpl = document.getElementById('message-template');
  const node = tpl.content.firstElementChild.cloneNode(true);
  const bubble = node.querySelector('.bubble');
  bubble.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';
  chatEl.appendChild(node);
  chatEl.scrollTop = chatEl.scrollHeight;
  return node;
}

async function askBot(question) {
  const loadingNode = addLoading();
  try {
    const res = await fetch('/.netlify/functions/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    if(!res.ok) throw new Error('Network error: ' + res.status);
    const data = await res.json();
    loadingNode.querySelector('.bubble').textContent = data.answer || '[No answer returned]';
  } catch (err) {
    loadingNode.querySelector('.bubble').textContent = 'Error: ' + err.message;
    loadingNode.querySelector('.bubble').classList.add('error');
  }
}

formEl.addEventListener('submit', e => {
  e.preventDefault();
  const q = inputEl.value.trim();
  if(!q) return;
  addMessage(q, 'user');
  inputEl.value='';
  inputEl.style.height='auto';
  askBot(q);
});

inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 180) + 'px';
});

themeToggle.addEventListener('click', () => {
  dark = !dark;
  document.documentElement.classList.toggle('dark', !dark);
  themeToggle.textContent = dark ? '🌙' : '☀️';
});

quickPrompts.addEventListener('click', e => {
  if(e.target.matches('button[data-q]')) {
    const q = e.target.getAttribute('data-q');
    addMessage(q, 'user');
    askBot(q);
  }
});

// Initial greeting
addMessage('Hi! Ask me anything about the Ohrsom Gap Year Programme (dates, visas, rooming, packing, grants, sim cards, etc.).');
