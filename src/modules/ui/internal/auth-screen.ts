export interface AuthScreenDeps {
  onSignIn: (email: string, password: string) => void;
  onSignUp: (email: string, password: string) => void;
}

export interface AuthScreen {
  el: HTMLElement;
  showError: (msg: string) => void;
  hide: () => void;
}

/**
 * Full-screen sign-in form: email + password inputs, Sign in + Sign up
 * buttons, an error line. Pure intent-out DOM — it only reports the entered
 * credentials via the callbacks; S13 wires it to the AuthGateway.
 */
export function createAuthScreen(deps: AuthScreenDeps): AuthScreen {
  const el = document.createElement('section');
  el.className = 'auth-screen';
  el.dataset['testid'] = 'auth-screen';
  el.style.position = 'fixed';
  el.style.inset = '0';
  el.style.background = '#0b0f14';
  el.style.color = '#e8e6df';
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.gap = '0.75rem';
  el.style.fontFamily = 'sans-serif';

  const title = document.createElement('h1');
  title.textContent = 'Life Game';
  title.style.marginBottom = '1rem';
  el.appendChild(title);

  const email = document.createElement('input');
  email.type = 'email';
  email.placeholder = 'Email';
  email.autocomplete = 'email';
  email.className = 'auth-email';
  email.dataset['testid'] = 'auth-email';
  el.appendChild(email);

  const password = document.createElement('input');
  password.type = 'password';
  password.placeholder = 'Password';
  password.autocomplete = 'current-password';
  password.className = 'auth-password';
  password.dataset['testid'] = 'auth-password';
  el.appendChild(password);

  const buttons = document.createElement('div');
  buttons.style.display = 'flex';
  buttons.style.gap = '0.5rem';
  el.appendChild(buttons);

  const signIn = document.createElement('button');
  signIn.type = 'button';
  signIn.textContent = 'Sign in';
  signIn.className = 'auth-signin';
  signIn.dataset['testid'] = 'auth-signin';
  buttons.appendChild(signIn);

  const signUp = document.createElement('button');
  signUp.type = 'button';
  signUp.textContent = 'Sign up';
  signUp.className = 'auth-signup';
  signUp.dataset['testid'] = 'auth-signup';
  buttons.appendChild(signUp);

  const error = document.createElement('p');
  error.className = 'auth-error';
  error.dataset['testid'] = 'auth-error';
  error.style.color = '#e07a7a';
  error.style.minHeight = '1.25rem';
  error.textContent = '';
  el.appendChild(error);

  signIn.addEventListener('click', () => {
    deps.onSignIn(email.value, password.value);
  });
  signUp.addEventListener('click', () => {
    deps.onSignUp(email.value, password.value);
  });

  return {
    el,
    showError(msg) {
      error.textContent = msg;
    },
    hide() {
      el.style.display = 'none';
    },
  };
}
