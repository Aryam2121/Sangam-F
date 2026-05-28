import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Link } from "react-router-dom";
import { BiHome, BiTask, BiBookAlt, BiSearchAlt2 } from "react-icons/bi";
import { useSidebar } from "../context/SidebarContext";

const AppShell = ({ children }) => {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen overflow-x-hidden pb-20 pt-[calc(4rem+1.5rem)] md:pb-0">
      <Navbar />

      <div className="flex w-full items-start gap-6 px-6 pb-6 pt-6">
        <Sidebar />
        <main className={`min-w-0 flex-1 overflow-x-hidden md:pr-6 ${collapsed ? "md:ml-[8rem]" : "md:ml-[19.5rem]"}`}>
          <div className="page p-6">{children}</div>
        </main>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 shadow-2xl backdrop-blur md:hidden">
        <Link to="/" className="mobile-dock-btn">
          <BiHome className="text-lg" /> Home
        </Link>
        <Link to="/taskManager" className="mobile-dock-btn">
          <BiTask className="text-lg" /> Tasks
        </Link>
        <button
          type="button"
          className="mobile-dock-btn"
          onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
        >
          <BiSearchAlt2 className="text-lg" /> Search
        </button>
        <Link to="/projects" className="mobile-dock-btn">
          <BiBookAlt className="text-lg" /> Projects
        </Link>
      </div>
    </div>
  );
};

export default AppShell;
