const loginBtn = document.getElementById('loginBtn');
const msg = document.getElementById('msg');

async function login(){
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  msg.textContent = 'جاري تسجيل الدخول...';
  loginBtn.disabled = true;

  try {
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ username, password })
    });
    const data = await r.json().catch(() => ({}));

    if (r.ok && data.ok) {
      location.href = 'locations.html';
      return;
    }

    if (data.error === 'SERVER_NOT_CONFIGURED') {
      msg.textContent = 'يجب إعداد متغيرات الدخول في Vercel أولاً';
    } else {
      msg.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
    }
  } catch (e) {
    msg.textContent = 'تعذر الاتصال بالخادم';
  } finally {
    loginBtn.disabled = false;
  }
}

loginBtn.addEventListener('click', login);
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});
