import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl font-semibold tracking-[0.06em] text-night">HARBORFRONT</p>
          <p className="mt-1 text-[0.7rem] tracking-[0.28em] text-muted">ADMIN</p>
        </div>
        <div className="border border-line bg-white p-7 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          <h1 className="font-sans text-lg font-semibold text-night">Log in</h1>
          <p className="mt-1 text-[0.9rem] text-muted">Manage quote requests and work orders.</p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
