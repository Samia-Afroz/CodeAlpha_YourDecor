// ===== auth.js: login + register forms =====
// After login, go back to ?redirect=... (only same-site paths) or home
const redirectParam = getParam('redirect');
const redirectTo = redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/index.html';

// Keep the redirect when switching between login and register
const switchLink = document.getElementById('switchLink');
if (switchLink && redirectParam) switchLink.href += '?redirect=' + encodeURIComponent(redirectTo);

// Already logged in? skip the form
if (Auth.token()) location.href = redirectTo;

function showError(msg) {
  const a = document.getElementById('alert');
  a.className = 'alert error';
  a.textContent = msg;
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginForm.email.value.trim(), password: loginForm.password.value }),
      });
      Auth.save(data.token, data.user);
      location.href = redirectTo;
    } catch (err) {
      showError(err.message);
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = registerForm;
    if (f.password.value !== f.confirm.value) return showError('Passwords do not match');
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: f.name.value.trim(),
          email: f.email.value.trim(),
          phone: f.phone.value.trim(),
          password: f.password.value,
        }),
      });
      Auth.save(data.token, data.user);
      location.href = redirectTo;
    } catch (err) {
      showError(err.message);
    }
  });
}
