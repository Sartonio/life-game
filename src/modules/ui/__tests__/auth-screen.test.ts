// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { createAuthScreen } from '../index.ts';

function query<T extends HTMLElement>(el: HTMLElement, testid: string): T {
  const found = el.querySelector<T>(`[data-testid="${testid}"]`);
  if (!found) throw new Error(`${testid} not found`);
  return found;
}

function makeScreen() {
  const onSignIn = vi.fn();
  const onSignUp = vi.fn();
  const screen = createAuthScreen({ onSignIn, onSignUp });
  return { screen, onSignIn, onSignUp };
}

describe('ui · auth screen', () => {
  it('renders email + password inputs and Sign in + Sign up buttons', () => {
    const { screen } = makeScreen();

    expect(screen.el.dataset['testid']).toBe('auth-screen');
    expect(query<HTMLInputElement>(screen.el, 'auth-email').tagName).toBe('INPUT');
    const password = query<HTMLInputElement>(screen.el, 'auth-password');
    expect(password.type).toBe('password');
    expect(query<HTMLButtonElement>(screen.el, 'auth-signin').tagName).toBe('BUTTON');
    expect(query<HTMLButtonElement>(screen.el, 'auth-signup').tagName).toBe('BUTTON');
  });

  it('submits entered credentials to onSignIn when Sign in is clicked', () => {
    const { screen, onSignIn, onSignUp } = makeScreen();

    query<HTMLInputElement>(screen.el, 'auth-email').value = 'ryan@example.com';
    query<HTMLInputElement>(screen.el, 'auth-password').value = 'hunter2';
    query<HTMLButtonElement>(screen.el, 'auth-signin').click();

    expect(onSignIn).toHaveBeenCalledWith('ryan@example.com', 'hunter2');
    expect(onSignUp).not.toHaveBeenCalled();
  });

  it('submits entered credentials to onSignUp when Sign up is clicked', () => {
    const { screen, onSignIn, onSignUp } = makeScreen();

    query<HTMLInputElement>(screen.el, 'auth-email').value = 'new@example.com';
    query<HTMLInputElement>(screen.el, 'auth-password').value = 'secret';
    query<HTMLButtonElement>(screen.el, 'auth-signup').click();

    expect(onSignUp).toHaveBeenCalledWith('new@example.com', 'secret');
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('showError displays the message on the error line', () => {
    const { screen } = makeScreen();
    const error = query<HTMLElement>(screen.el, 'auth-error');

    expect(error.textContent).toBe('');

    screen.showError('Invalid credentials');

    expect(error.textContent).toBe('Invalid credentials');
  });

  it('hide hides the screen', () => {
    const { screen } = makeScreen();

    expect(screen.el.style.display).not.toBe('none');

    screen.hide();

    expect(screen.el.style.display).toBe('none');
  });
});
