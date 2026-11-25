"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

const input =
  "mt-1.5 block w-full rounded-[3px] border border-line bg-white px-3 py-2.5 text-[0.95rem] focus:border-night focus:outline-none focus:ring-1 focus:ring-night";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p role="alert" className="border-l-2 border-red-700 bg-red-50 px-3 py-2 text-[0.9rem] text-red-800">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="text-[0.85rem] font-medium">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" defaultValue={state.email} required className={input} />
      </div>
      <div>
        <label htmlFor="password" className="text-[0.85rem] font-medium">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[3px] bg-night py-2.5 font-medium text-canvas hover:bg-night-600 disabled:opacity-60"
      >
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
