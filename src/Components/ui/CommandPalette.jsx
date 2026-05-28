import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeRole } from "../../utils/authRedirect";

const baseItems = [
  { path: "/", label: "Dashboard", roles: ["Main Admin", "Officer", "Worker"] },
  { path: "/taskManager", label: "Task Manager", roles: ["Main Admin", "Officer", "Worker"] },
  { path: "/projects", label: "Projects", roles: ["Main Admin", "Officer"] },
  { path: "/resources", label: "Resources", roles: ["Main Admin", "Officer"] },
  { path: "/training", label: "Training", roles: ["Main Admin", "Officer", "Worker"] },
  { path: "/discussion", label: "Discussion", roles: ["Main Admin", "Officer", "Worker"] },
  { path: "/BidSystem", label: "Bid System", roles: ["Main Admin", "Officer"] },
  { path: "/profile", label: "Profile", roles: ["Main Admin", "Officer", "Worker"] },
];

const CommandPalette = ({ open, onClose }) => {
  const navigate = useNavigate();
  const role = normalizeRole(localStorage.getItem("userRole"));
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const commands = useMemo(
    () =>
      baseItems
        .filter((item) => item.roles.includes(role))
        .filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase())),
    [query, role]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/75 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto mt-20 w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a page name..."
          className="w-full"
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter" && commands[0]) {
              navigate(commands[0].path);
              onClose();
            }
          }}
        />
        <div className="mt-3 max-h-80 overflow-y-auto custom-scrollbar">
          {commands.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-white/10"
            >
              <span>{item.label}</span>
              <span className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{item.path}</span>
            </button>
          ))}
          {commands.length === 0 && <p className="px-3 py-3 text-sm text-slate-400">No matching command</p>}
        </div>
        <p className="mt-2 px-2 text-[11px] text-slate-500">Enter to open first result · Esc to close</p>
      </div>
    </div>
  );
};

export default CommandPalette;
