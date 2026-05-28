import React from "react";

const PageHeader = ({ kicker, title, subtitle, actions, children }) => (
  <div className="glass-panel mb-6 flex flex-wrap items-center justify-between gap-4 p-6">
    <div className="min-w-0 flex-1">
      {kicker && <p className="page-kicker">{kicker}</p>}
      {title && <h1 className="page-title mt-2">{title}</h1>}
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
      {children}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
