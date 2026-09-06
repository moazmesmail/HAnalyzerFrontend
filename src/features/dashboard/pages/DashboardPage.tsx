import {
  AccessTimeRounded,
  AddShoppingCartRounded,
  CloseRounded,
  CalendarMonthRounded,
  EmojiEventsRounded,
  EventAvailableRounded,
  FitnessCenterRounded,
  LocalCafeRounded,
  PetsRounded,
  PlayArrowRounded,
  StarRounded,
  TrendingUpRounded,
  VideoLibraryRounded,
} from "@mui/icons-material";
import { Avatar, Button, Dialog, DialogContent, IconButton, LinearProgress, Snackbar } from "@mui/material";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSession } from "../../auth/session";
import { getSummaryVideo, listVideoAnalyses, summaryVideoUrl } from "../../analysis/api";
import { listVideos, originalUrl } from "../../videos/api";
import "./dashboard.css";

const products = [
  { name: "Americano", detail: "Classic roast", price: 14, emoji: "☕" },
  { name: "Protein Smoothie", detail: "Berry blast", price: 24, emoji: "🥤" },
  { name: "Water", detail: "500ml", price: 6, emoji: "💧" },
  { name: "Chicken Wrap", detail: "Grilled", price: 28, emoji: "🌯" },
];
const bookings = [
  { day: "24", month: "MAY", title: "Flatwork Fundamentals", meta: "Today, 05:00 PM · Main Arena" },
  { day: "28", month: "MAY", title: "Jumping Basics", meta: "Tue, 04:30 PM · Indoor Arena" },
  { day: "02", month: "JUN", title: "Horsemanship Clinic", meta: "Sun, 04:00 PM · Kids Arena" },
];

function StatCard({ icon, eyebrow, title, detail }: { icon: React.ReactNode; eyebrow: string; title: string; detail: string }) {
  return <article className="hp-stat"><span className="hp-stat-icon">{icon}</span><div><small>{eyebrow}</small><strong>{title}</strong><p>{detail}</p></div></article>;
}

export function DashboardPage() {
  const session = useSession();
  const [cart, setCart] = useState(0);
  const [period, setPeriod] = useState("This month");
  const [notice, setNotice] = useState("");
  const [videoMode, setVideoMode] = useState<"before" | "after" | null>(null);
  const act = (message: string) => setNotice(message);
  const videos = useQuery({ queryKey: ["dashboard", session.user?.id, "videos"], queryFn: listVideos });
  const uploadedVideos = videos.data?.items ?? [];
  const analysisQueries = useQueries({
    queries: uploadedVideos.map(video => ({
      queryKey: ["dashboard", session.user?.id, video.id, "analyses"],
      queryFn: () => listVideoAnalyses(video.id),
    })),
  });
  const completedAnalyses = analysisQueries.flatMap((query, videoIndex) =>
    (query.data ?? [])
      .filter(item => item.status === "completed" || item.status === "partial")
      .map(analysis => ({ analysis, video: uploadedVideos[videoIndex] }))
  );
  const summaryQueries = useQueries({
    queries: completedAnalyses.map(({ analysis }) => ({
      queryKey: ["dashboard", session.user?.id, analysis.id, "summary"],
      queryFn: () => getSummaryVideo(analysis.id),
      retry: false,
    })),
  });
  const summarizedIndex = summaryQueries.findIndex(query =>
    query.data?.status === "completed" && Boolean(query.data.asset_id)
  );
  const summarizedPair = summarizedIndex >= 0 ? completedAnalyses[summarizedIndex] : undefined;
  const sourceVideo = summarizedPair?.video ?? uploadedVideos[0];
  const summary = summarizedIndex >= 0 ? summaryQueries[summarizedIndex].data : undefined;
  const beforeSrc = sourceVideo ? originalUrl(sourceVideo) : null;
  const afterSrc = summary?.asset_id ? summaryVideoUrl(summary.asset_id) : beforeSrc;
  const isOriginalFallback = Boolean(beforeSrc) && !summary?.asset_id;
  const activeVideo = videoMode === "after" ? afterSrc : beforeSrc;

  return (
    <>
        <section className="hp-content">
          <div className="hp-topline"><div><h2>Your riding overview</h2><p>Everything you need for a great day at the park.</p></div><Button variant="contained" startIcon={<CalendarMonthRounded />} onClick={() => act("Choose a time for your lesson")}>Book lesson</Button></div>
          <div className="hp-stats"><StatCard icon={<CalendarMonthRounded />} eyebrow="NEXT LESSON" title="Today, 05:00 PM" detail="Flatwork Fundamentals" /><StatCard icon={<PetsRounded />} eyebrow="MY HORSE" title="Zidane" detail="9 yrs · Warmblood" /><StatCard icon={<AccessTimeRounded />} eyebrow="SESSION STARTS IN" title="02 : 15 : 36" detail="Main Arena" /><StatCard icon={<StarRounded />} eyebrow="PACKAGE BALANCE" title="8 lessons" detail="Valid until Jun 30" /></div>

          <div className="hp-grid">
            <article className="hp-card hp-cafe"><div className="hp-card-title"><div><h3><LocalCafeRounded /> Order from café</h3><p>Fuel your ride. We’ll have it ready for pickup.</p></div><button onClick={() => act("Full menu opened")}>View full menu</button></div><div className="hp-products">{products.map(product => <div className="hp-product" key={product.name}><div className="hp-product-art">{product.emoji}</div><b>{product.name}</b><small>{product.detail}</small><span>SAR <strong>{product.price}</strong></span><button onClick={() => { setCart(cart + 1); act(`${product.name} added to cart`); }}><AddShoppingCartRounded /> Add to cart</button></div>)}</div><div className="hp-cart">🛒 {cart} {cart === 1 ? "item" : "items"} in cart <button onClick={() => act(cart ? "Cart opened" : "Your cart is empty")}>View cart →</button></div></article>

            <article className="hp-card hp-progress"><div className="hp-card-title"><h3>Progress overview</h3><select value={period} onChange={event => setPeriod(event.target.value)}><option>This month</option><option>Last month</option><option>This year</option></select></div><div className="hp-ring"><div><strong>{period === "This year" ? "84" : "78"}%</strong><span>Overall progress</span></div></div><div className="hp-legend"><span><i className="green" />Flatwork <b>82%</b></span><span><i className="blue" />Jumping <b>74%</b></span><span><i className="purple" />Horsemanship <b>71%</b></span><span><i className="gold" />Fitness <b>85%</b></span></div></article>

            <article className="hp-card"><div className="hp-card-title"><h3>Performance scores</h3><TrendingUpRounded /></div>{[["Flatwork",78],["Jumping",73],["Horsemanship",75],["Position & balance",79]].map(([label, score]) => <div className="hp-score" key={label}><span>{label}</span><b>{Number(score)/10}<small>/10</small></b><LinearProgress variant="determinate" value={Number(score)} /></div>)}</article>

            <article className="hp-card"><div className="hp-card-title"><h3>Upcoming bookings</h3><button onClick={() => act("All bookings opened")}>View all</button></div>{bookings.map(item => <button className="hp-booking" key={item.day + item.month} onClick={() => act(item.title)}><time><b>{item.day}</b>{item.month}</time><span><b>{item.title}</b><small>{item.meta}</small></span></button>)}</article>
          </div>

          <div className="hp-bottom-grid">
            <article className="hp-card"><div className="hp-card-title"><h3>Analyzed video · Before & after</h3><NavLink to="/app/videos">View all</NavLink></div><div className="hp-videos"><button disabled={!beforeSrc} onClick={() => setVideoMode("before")}><span>{beforeSrc ? <video src={beforeSrc} muted playsInline preload="metadata" /> : "🎬"}<PlayArrowRounded /></span><b>Before analysis</b><small>{sourceVideo?.original_filename ?? "No uploaded video available"}</small></button><button disabled={!afterSrc} onClick={() => setVideoMode("after")}><span>{afterSrc ? <video src={afterSrc} muted playsInline preload="metadata" /> : "✨"}<PlayArrowRounded /></span><b>After analysis</b><small>{isOriginalFallback ? "Original fallback · no summary available" : afterSrc ? "Analyzed highlight stream" : "No uploaded video available"}</small></button></div></article>
            <article className="hp-card hp-note"><div className="hp-card-title"><h3>Coach notes</h3><em>NEW</em></div><div><Avatar>R</Avatar><span><b>Coach Rashad</b><small>Today, 10:30 AM</small></span></div><p>Great improvement in your balance and rhythm today. Focus on keeping your hands steady on turns.</p><button onClick={() => act("Reply composer opened")}>Reply to coach</button></article>
            <article className="hp-card"><div className="hp-card-title"><h3>Recommended for you</h3><button onClick={() => act("All recommendations opened")}>View all</button></div><button className="hp-recommend" onClick={() => act("Pole Work for Rhythm selected")}><span>🏇</span><div><b>Pole Work for Rhythm</b><small>Improve your tempo and balance</small></div></button><button className="hp-recommend" onClick={() => act("Gymnastic Jumping Clinic selected")}><span>🏆</span><div><b>Gymnastic Jumping Clinic</b><small>Build confidence over combinations</small></div></button></article>
            <article className="hp-card hp-event"><div className="hp-card-title"><h3>Event invitation</h3><button onClick={() => act("All events opened")}>View all</button></div><div><time><b>15</b>JUN</time><span><b>Horse Park Challenge</b><small>Show jumping event · Kids & adults</small><button onClick={() => act("You are registered!")}>Register now</button></span><EmojiEventsRounded /></div></article>
          </div>

          <div className="hp-quick"><button onClick={() => act("Lesson booking opened")}><CalendarMonthRounded /><span><b>Book lesson</b><small>Reserve your next session</small></span></button><button onClick={() => act("Café menu opened")}><LocalCafeRounded /><span><b>Order from café</b><small>Order food & drinks</small></span></button><NavLink to="/app/videos"><VideoLibraryRounded /><span><b>View video</b><small>Watch & analyze rides</small></span></NavLink><button onClick={() => act("Horse profile opened")}><PetsRounded /><span><b>My horse</b><small>View horse profile & care</small></span></button><button onClick={() => act("Progress details opened")}><FitnessCenterRounded /><span><b>Performance</b><small>Track your progress</small></span></button><button onClick={() => act("Coach chat opened")}><EventAvailableRounded /><span><b>Contact coach</b><small>Message your coach</small></span></button></div>
        </section>
      <Dialog open={videoMode !== null} onClose={() => setVideoMode(null)} maxWidth="md" fullWidth slotProps={{ paper: { className: "hp-video-dialog" } }}>
        <div className="hp-video-dialog-head"><div><b>{videoMode === "after" ? "After analysis" : "Before analysis"}</b><small>{sourceVideo?.original_filename}</small></div><IconButton aria-label="Close video" onClick={() => setVideoMode(null)}><CloseRounded /></IconButton></div>
        <DialogContent>{activeVideo && <video key={activeVideo} src={activeVideo} crossOrigin="use-credentials" controls autoPlay playsInline preload="metadata" />}</DialogContent>
        <div className="hp-video-switch"><button className={videoMode === "before" ? "active" : ""} disabled={!beforeSrc} onClick={() => setVideoMode("before")}>Before</button><button className={videoMode === "after" ? "active" : ""} disabled={!afterSrc} onClick={() => setVideoMode("after")}>After</button></div>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={2200} onClose={() => setNotice("")} message={notice} />
    </>
  );
}
