import { ArrowForwardRounded, AutoAwesomeRounded } from "@mui/icons-material";
import { Outlet, useLocation } from "react-router-dom";
import "../../features/auth/pages/auth.css";

export function PublicLayout() {
  const location = useLocation();
  const isRegister = location.pathname === "/register";

  return (
    <main className="hp-auth-shell">
      <section className="hp-auth-story" aria-label="Equestrian Centre introduction">
        <div className="hp-auth-brand"><img src="/logo.jpeg" alt="Equestrian Centre logo" /><div><b>EQUESTRIAN CENTRE</b><span>AL AMMARIYAH</span></div></div>
        <div className="hp-auth-story-copy">
          <span className="hp-auth-kicker"><AutoAwesomeRounded /> Equestrian performance, elevated</span>
          <h1>Ride with purpose.<br /><em>Progress with insight.</em></h1>
          <p>Your private digital stable for lessons, performance analysis, and every milestone along the way.</p>
          <div className="hp-auth-feature"><span>01</span><div><b>Analyze every ride</b><small>Turn training footage into clear, actionable feedback.</small></div></div>
          <div className="hp-auth-feature"><span>02</span><div><b>Track your progress</b><small>Keep your horse, coaching, and performance in one place.</small></div></div>
        </div>
        <p className="hp-auth-location">Al Ammariyah · Riyadh</p>
      </section>
      <section className="hp-auth-panel">
        <div className="hp-auth-mobile-brand"><img src="/logo.jpeg" alt="Equestrian Centre logo" /><b>EQUESTRIAN CENTRE</b></div>
        <div className="hp-auth-card">
          <div className="hp-auth-heading">
            <span>{isRegister ? "JOIN THE PARK" : location.pathname === "/login" ? "WELCOME BACK" : "ACCOUNT STATUS"}</span>
            <h2>{isRegister ? "Create your account" : location.pathname === "/login" ? "Sign in to Equestrian Centre" : "Registration received"}</h2>
            <p>{isRegister ? "Begin your journey with the Equestrian Centre community." : location.pathname === "/login" ? "Continue to your rider dashboard." : "Your place at Equestrian Centre is almost ready."}</p>
          </div>
          <Outlet />
          <div className="hp-auth-assurance"><ArrowForwardRounded /><span>Private access for Equestrian Centre riders and coaches</span></div>
        </div>
      </section>
    </main>
  );
}
