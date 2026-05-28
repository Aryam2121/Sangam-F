import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/newlogo.svg";

const AuthLayout = ({
  title,
  subtitle,
  kicker = "Sangam",
  children,
  footer,
  image,
  imageAlt = "Illustration",
  reverse = false,
}) => (
  <div className="auth-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
    <div className="auth-glow auth-glow-1" aria-hidden="true" />
    <div className="auth-glow auth-glow-2" aria-hidden="true" />

    <div className="relative z-10 w-full max-w-6xl">
      <div className="mb-8 flex items-center justify-center gap-3">
        <img src={logo} alt="Sangam" className="h-10 w-auto" />
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-100">
          Infrastructure Platform
        </span>
      </div>

      <div
        className={`auth-card grid overflow-hidden md:grid-cols-2 ${
          reverse ? "md:[direction:rtl] md:*:[direction:ltr]" : ""
        }`}
      >
        {image && (
          <div className="auth-visual hidden items-center justify-center p-8 md:flex">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-4 rounded-[2rem] bg-cyan-400/10 blur-2xl" />
              <img
                src={image}
                alt={imageAlt}
                className="relative w-full rounded-3xl object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
          <div className="mb-8">
            <p className="auth-kicker">{kicker}</p>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
          </div>

          {children}

          {footer && <div className="mt-8 border-t border-white/10 pt-6">{footer}</div>}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Sangam · Civic infrastructure management
      </p>
    </div>
  </div>
);

export const AuthField = ({ label, id, children, hint }) => (
  <div className="auth-field">
    <label htmlFor={id} className="auth-label">
      {label}
    </label>
    {children}
    {hint && <p className="auth-hint">{hint}</p>}
  </div>
);

export const AuthLink = ({ to, children }) => (
  <Link to={to} className="font-semibold text-cyan-300 transition hover:text-cyan-200">
    {children}
  </Link>
);

export default AuthLayout;
