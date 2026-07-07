// Internal implementation. Deep imports from other modules are blocked by lint.
import type { ChatSession } from './chat-panel.ts';
import { createChatPanel } from './chat-panel.ts';
import { ensureStyles } from './styles.ts';

export interface ReflectionModalDeps {
  /** Fresh reflection conversation per open; absent = no API key configured. */
  createSession?: () => ChatSession;
}

export interface ReflectionModal {
  el: HTMLElement;
  open(): void;
  close(): void;
  isOpen(): boolean;
}

/**
 * The reflection chat, opened by the Reflect button. Each open starts a fresh
 * conversation; without a session factory the chat panel shows its offline
 * notice. DOM is built once at creation — open only resets it.
 */
export function createReflectionModal(deps: ReflectionModalDeps): ReflectionModal {
  ensureStyles();
  const el = document.createElement('div');
  el.className = 'reflection-modal lg-modal';
  el.dataset['testid'] = 'reflection-modal';
  el.style.display = 'none';

  const title = document.createElement('div');
  title.textContent = 'Reflect';
  title.style.marginBottom = 'var(--lg-space-2)';
  el.appendChild(title);

  const chat = createChatPanel();
  el.appendChild(chat.el);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'reflection-close lg-btn lg-btn--ghost';
  closeButton.dataset['testid'] = 'reflection-close';
  closeButton.textContent = 'Close';
  closeButton.style.marginTop = 'var(--lg-space-2)';
  el.appendChild(closeButton);

  let openState = false;

  function open(): void {
    openState = true;
    chat.start(deps.createSession?.());
    el.style.display = 'block';
  }

  function close(): void {
    openState = false;
    el.style.display = 'none';
  }

  closeButton.addEventListener('click', close);

  return { el, open, close, isOpen: () => openState };
}
