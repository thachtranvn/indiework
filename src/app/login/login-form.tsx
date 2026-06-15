'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/app/_actions/auth';
import { BrandMark, Wordmark } from '@/components/ui/brand';
import { Ic } from '@/components/ui/icons';

const initial: LoginState = { error: null };

interface LoginFormProps {
  next: string;
  /** When set, this is the public demo: show + prefill the throwaway password. */
  demoHint?: string;
}

export function LoginForm({ next, demoHint }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <main className="login-wrap">
      <div className="login-card">
        <div className="login-logo" aria-hidden style={{ background: 'transparent', boxShadow: 'none' }}>
          <BrandMark size={56} />
        </div>
        <h1 style={{ marginBottom: 8 }}>
          <Wordmark />
        </h1>
        <p>
          {demoHint
            ? 'Live demo with sample data. Play freely — it resets on a schedule.'
            : 'Just you. Enter your password to open the workspace.'}
        </p>

        {demoHint && (
          <div className="login-demo">
            <Ic.lock size={13} /> Demo password: <b>{demoHint}</b> (already filled in)
          </div>
        )}

        <form action={formAction}>
          <input type="hidden" name="next" value={next} />
          <div className="login-field">
            <input
              type="password"
              name="password"
              placeholder="Password"
              defaultValue={demoHint}
              autoFocus
              autoComplete="current-password"
              aria-label="Password"
            />
            <button className="login-go" type="submit" disabled={pending} aria-label="Unlock">
              <Ic.arrowRight size={20} />
            </button>
          </div>
          {state.error && <p className="login-err">{state.error}</p>}
        </form>

        <p className="login-hint">No sign-up · no recovery · no accounts. Just a lock.</p>
      </div>
    </main>
  );
}
