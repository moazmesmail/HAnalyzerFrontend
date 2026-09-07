import { AdminPanelSettingsRounded, ArchiveRounded, AssessmentRounded, DashboardRounded, FolderCopyRounded, LogoutRounded, MenuRounded, NotificationsNoneRounded, UploadRounded, VideoLibraryRounded } from "@mui/icons-material";
import { Avatar, Badge, IconButton } from "@mui/material";
import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../../features/auth/session";
import "../../features/dashboard/pages/dashboard.css";

const riderLinks = [
  { label: "Dashboard", to: "/app/dashboard", icon: <DashboardRounded /> },
  { label: "Analysis dashboard", to: "/app/analysis-dashboard", icon: <AssessmentRounded /> },
  { label: "Videos & highlights", to: "/app/videos", icon: <VideoLibraryRounded /> },
  { label: "Workspaces", to: "/app/workspaces", icon: <FolderCopyRounded /> },
  { label: "Archive", to: "/app/archive", icon: <ArchiveRounded /> },
  { label: "Upload video", to: "/app/videos/new", icon: <UploadRounded /> },
];
const demoLinks = ["My lessons", "My horse", "Coaches", "Progress & performance", "Upcoming bookings", "Events & clinics"];

export function WorkspaceLayout() {
  const session = useSession();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = useMemo(() => session.user?.identity.split(/[.@_-]/)[0] || "Rider", [session.user]);
  const role = session.user?.role === "user" ? "Rider" : session.user?.role || "Rider";

  return (
    <div className="hp-dashboard">
      {menuOpen && <button className="hp-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className={menuOpen ? "hp-sidebar open" : "hp-sidebar"}>
        <NavLink className="hp-brand" to="/app/dashboard" onClick={() => setMenuOpen(false)}><img src="/logo.jpeg" alt="Equestrian Centre logo" /><div><b>EQUESTRIAN CENTRE</b><span>AL AMMARIYAH</span></div></NavLink>
        <small className="hp-label">MAIN</small>
        <nav>
          {riderLinks.map(item => <NavLink key={item.to} to={item.to} end className={() => isLinkActive(item.to, location.pathname) ? "active" : undefined} onClick={() => setMenuOpen(false)}>{item.icon}<span>{item.label}</span></NavLink>)}
          {session.user?.role === "admin" && <NavLink to="/app/admin/registrations" className={({ isActive }) => isActive ? "active" : undefined} onClick={() => setMenuOpen(false)}><AdminPanelSettingsRounded /><span>Approvals</span></NavLink>}
        </nav>
        <small className="hp-label">EQUESTRIAN CENTRE</small>
        <nav className="hp-demo-nav">{demoLinks.map(item => <button key={item}><span>◇</span>{item}</button>)}</nav>
        <div className="hp-sidebar-bottom">
          <button className="hp-logout" onClick={() => void session.logout()}><LogoutRounded /><span>Logout</span></button>
        </div>
      </aside>
      <main className="hp-main">
        <header className="hp-header">
          <IconButton className="hp-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation"><MenuRounded /></IconButton>
          <div><h1>{location.pathname === "/app/dashboard" ? `Welcome, ${firstName}` : pageTitle(location.pathname)} <span>{role}</span></h1><p>Equestrian Centre Rider Dashboard</p></div>
          <div className="hp-header-actions"><span>☀️ 32°C <small>Al Ammariyah</small></span><Badge badgeContent={3} color="error"><NotificationsNoneRounded /></Badge><Avatar>{firstName[0]?.toUpperCase()}</Avatar><div><b>{firstName}</b><small>{role}</small></div></div>
        </header>
        <div className="hp-route-content"><Outlet /></div>
      </main>
    </div>
  );
}

function pageTitle(pathname: string) {
  if (pathname === "/app/analysis-dashboard") return "Analysis dashboard";
  if (pathname === "/app/videos/new") return "Upload video";
  if (pathname.startsWith("/app/videos/")) return "Video analysis";
  if (pathname.startsWith("/app/videos")) return "Videos & highlights";
  if (pathname.startsWith("/app/workspaces")) return "Workspaces";
  if (pathname.startsWith("/app/archive")) return "Archive";
  if (pathname.startsWith("/app/admin")) return "Registration approvals";
  if (pathname.startsWith("/app/analyses")) return "Performance analysis";
  return "Equestrian Centre";
}

function isLinkActive(target: string, pathname: string) {
  if (target === "/app/videos") return pathname === target || (pathname.startsWith("/app/videos/") && pathname !== "/app/videos/new");
  if (target === "/app/workspaces") return pathname === target || pathname.startsWith("/app/workspaces/");
  if (target === "/app/archive") return pathname === target;
  return pathname === target;
}
