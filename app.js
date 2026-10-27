const SUPABASE_URL = 'https://vprdwfqzlugbotcfsqvj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tp9J9_6026fgqlqfe7YTnA_JNtuQfx2';
const USERS = {
  youssef: { id:'youssef', name:'Youssef', icon:'🧑‍💼', password:'youssef' },
  love:    { id:'love',    name:'Habiba',  icon:'👩‍🦰', password:'love' }
};

let supabase = null;
let realtimeChannel = null;
let currentUser = null;
let otherUser = null;
let pendingImage = null;

const $ = id => document.getElementById(id);
const welcomePage = $('welcomePage'), startBtn = $('startBtn');
const loginPage = $('loginPage'), chatPage = $('chatPage'), loginBtn = $('loginBtn');
const passwordInput = $('passwordInput'), togglePwBtn = $('togglePassword'), errorMessage = $('errorMessage');
const backArrow = $('backArrow'), userAvatar = $('userAvatar'), headerName = $('headerName');
const messagesContainer = $('messagesContainer'), messageInput = $('messageInput'), sendBtn = $('sendBtn');
const fileInput = $('fileInput'), emojiBtn = $('emojiBtn'), imageBtn = $('imageBtn'), emojiPicker = $('emojiPicker');

// شاشة الترحيب
startBtn.addEventListener('click', () => {
  welcomePage.style.display = 'none';
  loginPage.style.display = 'flex';
});

async function doLogin(user) {
  currentUser = user;
  otherUser = user.id === 'youssef' ? USERS.love : USERS.youssef;
  if (!supabase) supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  
  localStorage.setItem('savedUser', user.id);
  
  welcomePage.style.display = 'none';
  loginPage.style.display = 'none';
  chatPage.style.display = 'flex';
  
  userAvatar.textContent = otherUser.icon;
  headerName.textContent = otherUser.name;
  
  await loadMessages();
  subscribeToMessages();
}

loginBtn.addEventListener('click', async () => {
  const pw = passwordInput.value.trim();
  const found = Object.values(USERS).find(u => u.password === pw);
  if (!found) {
    errorMessage.textContent = "Wrong password. Try 'love' or 'youssef'";
    errorMessage.classList.add('show');
    return;
  }
  errorMessage.classList.remove('show');
  loginBtn.disabled = true;
  try { await doLogin(found); } catch (e) { alert(e.message); } finally { loginBtn.disabled = false; }
});

window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('savedUser');
  if (saved && USERS[saved]) {
    doLogin(USERS[saved]).catch(console.error);
  }
});

passwordInput.addEventListener('keypress', e => { if (e.key === 'Enter') loginBtn.click(); });
togglePwBtn.addEventListener('click', () => {
  passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
  togglePwBtn.textContent = passwordInput.type === 'password' ? 'Show' : 'Hide';
});

backArrow.addEventListener('click', () => {
  localStorage.removeItem('savedUser');
  if (realtimeChannel && supabase) supabase.removeChannel(realtimeChannel);
  currentUser = null; otherUser = null;
  chatPage.style.display = 'none';
  welcomePage.style.display = 'flex'; 
  messagesContainer.innerHTML = ''; passwordInput.value = '';
});

async function loadMessages() {
  messagesContainer.innerHTML = '<div class="loading-text">Loading...</div>';
  const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(500);
  messagesContainer.innerHTML = '';
  if (error) return messagesContainer.innerHTML = '<div class="loading-text" style="color:red">Error loading.</div>';
  if (data) data.forEach(displayMessage);
  scrollToBottom();
}

function displayMessage(msg) {
  const isSent = msg.sender_id === currentUser.id;
  const group = document.createElement('div');
  group.className = 'message-group ' + (isSent ? 'sent' : 'received');
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  if (msg.content) {
    const div = document.createElement('div');
    div.textContent = msg.content;
    div.style.wordBreak = 'break-word';
    bubble.appendChild(div);
  }
  if (msg.image_url) {
    const img = document.createElement('img');
    img.src = msg.image_url;
    img.className = 'message-image';
    img.onclick = () => window.open(msg.image_url, '_blank');
    bubble.appendChild(img);
  }
  
  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  const date = msg.created_at ? new Date(msg.created_at) : new Date();
  timeDiv.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  bubble.appendChild(timeDiv);

  group.appendChild(bubble);
  messagesContainer.appendChild(group);
}

async function sendMessage() {
  const content = messageInput.value.trim();
  if (!content && !pendingImage) return;
  sendBtn.disabled = true;
  let imageUrl = null;
  if (pendingImage) { imageUrl = await uploadImage(pendingImage); pendingImage = null; }
  
  const { error } = await supabase.from('messages').insert([{
    sender_id: currentUser.id, sender_name: currentUser.name, content: content || null, image_url: imageUrl
  }]);
  
  sendBtn.disabled = false;
  if (error) return alert('Failed: ' + error.message);

  displayMessage({ sender_id: currentUser.id, content: content, image_url: imageUrl, created_at: new Date().toISOString() });
  scrollToBottom();
  messageInput.value = '';
  messageInput.focus();
  updateSendBtn();
}

async function uploadImage(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const fileName = `${currentUser.id}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('chat-images').upload(fileName, file);
  if (error) return null;
  const { data } = await supabase.storage.from('chat-images').getPublicUrl(fileName);
  return data.publicUrl;
}

function subscribeToMessages() {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  realtimeChannel = supabase.channel('messages-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
      if (payload.new.sender_id !== currentUser.id) {
        displayMessage(payload.new);
        scrollToBottom();
      }
    }).subscribe();
}

function scrollToBottom() {
  setTimeout(() => { messagesContainer.scrollTop = messagesContainer.scrollHeight; }, 50);
}

const EMOJIS = ['❤️','😊','😂','🥰','🔥','👍','😍','🎉','✨','😘','💕','🌹','😎','🤔','😅','🙌','💪','😢','😡','🤗','😱','👏','🎊'];
EMOJIS.forEach(e => {
  const el = document.createElement('div');
  el.className = 'emoji-item';
  el.textContent = e;
  el.onclick = () => { messageInput.value += e; messageInput.focus(); emojiPicker.classList.remove('show'); updateSendBtn(); };
  emojiPicker.appendChild(el);
});

function updateSendBtn() { sendBtn.disabled = !(messageInput.value.trim() || pendingImage); }

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('input', updateSendBtn);
messageInput.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });
emojiBtn.addEventListener('click', () => emojiPicker.classList.toggle('show'));
imageBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  pendingImage = f;
  updateSendBtn();
  sendMessage();
  e.target.value = '';
});
