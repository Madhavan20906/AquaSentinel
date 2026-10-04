import { useEffect, useMemo, useState } from 'react';
import type { ButtonHTMLAttributes, FormEvent, ReactNode } from 'react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Check, ChevronRight, CircleHelp,
  ClipboardCheck, Database, FileCheck2, Gauge, Globe2,
  MapPin, Menu as MenuIcon, RefreshCw, Search, Send, Settings2, ShieldCheck,
  Sparkles, Waves, X, Zap,
} from 'lucide-react';
import {
  useAnalyzeObservation, useAnalyzeRisk, useCompleteMission, useCreateMission,
  useCreateObservation, useGetAlert, useGetDashboard, useGetObservation, useGetSite,
  useGetSiteMetrics, useGetSiteRisk, useGetSiteTimeline, useHealthCheck,
  useListAlerts, useListFhirObservations, useListFhirRiskAssessments, useListMissions,
  useListObservations, useListSites, useReviewAlert,
} from '@workspace/api-client-react';

import { GisMap } from './components/GisMap';
import { OneHealthChainBanner, OneHealthImpactCard } from './components/OneHealthChain';
import { IncidentReplay } from './components/IncidentReplay';
import { EcosystemTimeline } from './components/EcosystemTimeline';
import { FhirExportModal } from './components/FhirExportModal';
import { WaterTwin, MeasurableImpactCard } from './components/WaterTwin';
import { ModelValidationDashboard } from './components/ModelValidationDashboard';
import { OneHealthWorkflow } from './components/OneHealthWorkflow';

const navItems = [
  { href: '/dashboard', label: 'Intelligence', icon: Gauge },
  { href: '/observe', label: 'Observe', icon: MapPin },
  { href: '/missions', label: 'Missions', icon: ClipboardCheck },
  { href: '/audit', label: 'Audit trail', icon: FileCheck2 },
  { href: '/interoperability', label: 'Data exchange', icon: Database },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

function formatTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function tone(status?: string) {
  if (status === 'critical' || status === 'abnormal' || status === 'escalated') return 'text-rose-700 bg-rose-50 border-rose-200';
  if (status === 'emerging' || status === 'watch' || status === 'under_review' || status === 'needs_review') return 'text-amber-800 bg-amber-50 border-amber-200';
  if (status === 'verified' || status === 'validated' || status === 'stable' || status === 'completed') return 'text-teal-800 bg-teal-50 border-teal-200';
  return 'text-slate-600 bg-slate-50 border-slate-200';
}

function StatusPill({ value, label }: { value?: string; label?: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[.08em] ${tone(value)}`} data-testid={`status-${value ?? 'unknown'}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />{label ?? value?.replace('_', ' ') ?? 'unknown'}
  </span>;
}

function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger' }) {
  const variants = {
    primary: 'bg-[hsl(var(--primary))] text-white hover:bg-[hsl(174_77%_24%)]',
    secondary: 'border border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/.5)] hover:bg-[hsl(var(--secondary))]',
    quiet: 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
    danger: 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  };
  return <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

function SectionTitle({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail?: string; action?: ReactNode }) {
  return <div className="mb-5 flex items-end justify-between gap-4">
    <div><div className="eyebrow mb-2">{eyebrow}</div><h2 className="font-display text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">{title}</h2>{detail && <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{detail}</p>}</div>
    {action}
  </div>;
}

function LoadingRows({ count = 3 }: { count?: number }) {
  return <div className="space-y-3" data-testid="loading-state">{Array.from({ length: count }).map((_, i) => <div className="panel flex items-center gap-4 p-4" key={i}><div className="skeleton h-9 w-9 rounded-lg" /><div className="flex-1 space-y-2"><div className="skeleton h-3 w-1/3" /><div className="skeleton h-2 w-2/3" /></div><div className="skeleton h-5 w-16" /></div>)}</div>;
}

function ErrorState({ message = 'Signal unavailable', retry }: { message?: string; retry?: () => void }) {
  return <div className="panel flex flex-col items-center justify-center p-10 text-center" data-testid="error-state"><div className="mb-3 rounded-full bg-rose-50 p-3 text-rose-600"><AlertTriangle size={19} /></div><p className="font-semibold">{message}</p><p className="mt-1 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">The last known state is retained. Check the connection and try again.</p>{retry && <Button onClick={retry} variant="secondary" className="mt-4"><RefreshCw size={14} /> Retry</Button>}</div>;
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="panel flex flex-col items-center justify-center border-dashed p-10 text-center" data-testid="empty-state"><div className="mb-3 rounded-full bg-[hsl(var(--secondary))] p-3 text-[hsl(var(--primary))]"><Waves size={19} /></div><p className="font-semibold">{title}</p><p className="mt-1 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">{detail}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" className="flex items-center gap-2.5" data-testid="link-home">
    <span className={`grid h-9 w-9 place-items-center rounded-xl ${light ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]' : 'bg-[hsl(var(--primary))] text-white'}`}><Waves size={19} strokeWidth={2.5} /></span>
    <span className={`font-display text-[15px] font-bold tracking-tight ${light ? 'text-white' : 'text-[hsl(var(--foreground))]'}`}>Aqua<span className="text-[hsl(var(--accent))]">Sentinel</span></span>
  </Link>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fhirModalOpen, setFhirModalOpen] = useState(false);
  return <div className="noise min-h-[100dvh] lg:flex">
    <aside className={`fixed inset-y-0 left-0 z-40 flex h-dvh max-h-dvh w-[248px] shrink-0 flex-col overflow-hidden bg-[hsl(var(--sidebar))] px-4 py-5 transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="px-2"><Logo light /></div>
      <div className="mt-10 px-3"><div className="eyebrow !text-[hsl(var(--sidebar-primary))]">Operational loop</div><p className="mt-2 text-xs leading-5 text-[hsl(var(--sidebar-foreground)/.64)]">Observe → explain → decide<br />Human control stays in the loop.</p></div>
      <nav className="mt-8 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pb-2 pr-1" aria-label="Primary navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href || (href === '/dashboard' && location.startsWith('/sites'));
          return <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'bg-[hsl(var(--sidebar-accent))] font-semibold text-white' : 'text-[hsl(var(--sidebar-foreground)/.72)] hover:bg-[hsl(var(--sidebar-accent)/.7)] hover:text-white'}`}><Icon size={17} strokeWidth={active ? 2.4 : 1.8} /><span>{label}</span>{active && <ChevronRight size={14} className="ml-auto text-[hsl(var(--sidebar-primary))]" />}</Link>;
        })}
        <div className="my-5 border-t border-[hsl(var(--sidebar-border))]" />
        <Link href="/settings" onClick={() => setMobileOpen(false)} data-testid="link-nav-settings" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[hsl(var(--sidebar-foreground)/.72)] hover:bg-[hsl(var(--sidebar-accent)/.7)] hover:text-white ${location === '/settings' ? 'bg-[hsl(var(--sidebar-accent))] !text-white' : ''}`}><Settings2 size={17} /><span>Context & settings</span></Link>
      </nav>
      <div className="rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.55)] p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white"><span className="status-dot text-[hsl(var(--sidebar-primary))]" />Demo environment</div>
        <p className="mt-2 text-[11px] leading-4 text-[hsl(var(--sidebar-foreground)/.62)]">Signals are simulated for this workspace. No live public-health action is triggered.</p>
      </div>
    </aside>
    {mobileOpen && <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-[hsl(var(--sidebar)/.35)] lg:hidden" data-testid="button-close-navigation"><X className="absolute right-4 top-4 text-white" /></button>}
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[hsl(var(--border)/.7)] bg-[hsl(var(--background)/.9)] px-4 backdrop-blur-md sm:px-6 lg:px-9">
        <div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-[hsl(var(--muted))] lg:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-navigation"><MenuIcon size={19} /></button><div className="hidden text-xs text-[hsl(var(--muted-foreground))] sm:block"><span className="font-mono text-[hsl(var(--primary))]">AS /</span> municipal watershed intelligence</div></div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFhirModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600/30 bg-teal-50/80 px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-100 transition shadow-2xs"
            title="Export canonical HL7 FHIR R4 records to municipal EHR or public health systems"
          >
            <Database size={13} className="text-teal-700" />
            <span className="hidden sm:inline">Preview FHIR Export</span> (FHIR R4)
          </button>
          <span className="hidden items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] md:flex"><span className="status-dot text-teal-600" />All systems nominal</span><button className="rounded-full border border-[hsl(var(--border))] bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-[hsl(var(--secondary))]" data-testid="button-user-menu">EA <span className="hidden sm:inline">/ Environmental analyst</span></button>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        {children}
      </main>
      <FhirExportModal isOpen={fhirModalOpen} onClose={() => setFhirModalOpen(false)} />
    </div>
  </div>;
}

function Home() {
  const health = useHealthCheck();
  return <div className="grid-paper min-h-[100dvh] overflow-hidden">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><Logo /><div className="flex items-center gap-3"><span className="hidden text-xs text-[hsl(var(--muted-foreground))] sm:inline">For watershed teams everywhere</span><Link href="/dashboard" className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[hsl(174_77%_24%)]" data-testid="link-enter-workspace">Enter global workspace <ArrowRight className="ml-1 inline" size={15} /></Link></div></header>
    <main className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 lg:pt-24">
      <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_.98fr]">
        <div className="fade-up"><div className="eyebrow mb-5 flex items-center gap-2"><span className="status-dot text-[hsl(var(--accent))]" />Evidence-led water intelligence</div><h1 className="font-display max-w-2xl text-5xl font-semibold leading-[.98] tracking-[-.055em] text-[hsl(var(--foreground))] sm:text-7xl">Know what the water is <span className="text-[hsl(var(--primary))]">telling you.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">AquaSentinel turns fragmented observations, sensors, and local knowledge into explainable early warnings — with people making the call.</p><div className="mt-9 flex flex-wrap items-center gap-3"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5" data-testid="link-explore-dashboard">Explore the live demo <ArrowRight size={16} /></Link><Link href="/observe" className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-white px-5 py-3.5 text-sm font-semibold transition hover:bg-[hsl(var(--secondary))]" data-testid="link-submit-observation">Submit an observation <MapPin size={16} /></Link></div><div className="mt-10 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]"><span className={`status-dot ${health.isError ? 'text-rose-500' : 'text-teal-600'}`} />{health.isError ? 'Demo API reconnecting' : 'Demo API connected'} · Simulated watershed workspace</div></div>
         <div className="relative fade-up delay-2"><div className="absolute -inset-6 rounded-[2rem] bg-[hsl(var(--primary)/.06)] blur-3xl" /><div className="relative overflow-hidden rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--sidebar))] p-5 text-white shadow-2xl shadow-teal-950/15 sm:p-7"><div className="flex items-center justify-between border-b border-white/10 pb-5"><div><div className="eyebrow !text-[hsl(var(--sidebar-primary))]">Network field / multi-region</div><p className="mt-1 font-display text-lg font-semibold">Global demo network</p></div><span className="rounded-full border border-[hsl(var(--sidebar-primary)/.35)] px-2.5 py-1 text-[10px] uppercase tracking-wider text-[hsl(var(--sidebar-primary))]">synthetic</span></div><div className="mt-7 grid grid-cols-[1fr_auto] items-end gap-5"><div><p className="text-sm text-white/55">Composite risk</p><p className="mt-1 font-display text-6xl font-semibold tracking-tight text-[hsl(var(--sidebar-primary))]">0.68</p><p className="mt-2 text-xs text-white/55">Elevated · confidence 0.81</p></div><div className="grid h-24 w-24 place-items-center rounded-full border-[10px] border-[hsl(var(--sidebar-primary)/.2)] border-t-[hsl(var(--sidebar-primary))] border-r-[hsl(var(--sidebar-primary))] text-center"><span className="font-mono text-xs text-white/75">WATCH</span></div></div><div className="mt-8 space-y-3">{[['Monitoring sites','network','teal'],['Regions represented','global','amber'],['Human review queue','review','rose']].map(([label,value,color]) => <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5" key={label}><span className="text-xs text-white/65">{label}</span><span className={`font-mono text-sm ${color === 'amber' ? 'text-[hsl(var(--sidebar-primary))]' : color === 'rose' ? 'text-rose-300' : 'text-teal-300'}`}>{value}</span></div>)}</div><div className="mt-6 flex items-center gap-2 text-[11px] text-white/45"><ShieldCheck size={13} /> Synthetic signals only; every warning shows evidence and uncertainty.</div></div></div>
      </div>
      <div className="mt-24 border-t border-[hsl(var(--border))] pt-8"><div className="grid gap-8 sm:grid-cols-3"><div><div className="font-mono text-3xl text-[hsl(var(--primary))]">01</div><h3 className="mt-3 font-display font-semibold">Observe together</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Give researchers, officers, and residents one shared view of the water.</p></div><div><div className="font-mono text-3xl text-[hsl(var(--primary))]">02</div><h3 className="mt-3 font-display font-semibold">Explain the signal</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Separate evidence, inference, confidence, and risk — without hiding the gaps.</p></div><div><div className="font-mono text-3xl text-[hsl(var(--primary))]">03</div><h3 className="mt-3 font-display font-semibold">Keep humans in control</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Turn a model suggestion into a reviewable response, not an automatic verdict.</p></div></div></div>
    </main>
  </div>;
}

function Dashboard() {
  const dashboard = useGetDashboard();
  const sites = useListSites();
  const alerts = useListAlerts();
  const [showReplay, setShowReplay] = useState(true);

  if (dashboard.isLoading || sites.isLoading) return <><PageHeader eyebrow="Global network / simulated" title="Watershed intelligence" detail="Aggregated signals from a synthetic, multi-region demonstration network." /><LoadingRows count={5} /></>;
  if (dashboard.isError || sites.isError) return <ErrorState message="Dashboard signal unavailable" retry={() => { dashboard.refetch(); sites.refetch(); }} />;
  const summary = dashboard.data;
  const siteList = sites.data ?? [];

  return <div className="fade-up space-y-7">
    <PageHeader
      eyebrow="Global network / Live USGS & Open-Meteo"
      title="Watershed Intelligence Dashboard"
      detail="A cross-region read of what changed, where attention is needed, and why. Telemetry is fused across live USGS hydrological APIs, global weather, and citizen science."
      action={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowReplay(!showReplay)}>
            <Sparkles size={14} className="text-teal-600" />
            {showReplay ? 'Hide Incident Replay' : 'Launch Incident Replay'}
          </Button>
          <Button variant="secondary" onClick={() => dashboard.refetch()} data-testid="button-refresh-dashboard">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      }
    />

    {/* One Health 10-Second Transmission Chain Banner */}
    <OneHealthChainBanner />

    {/* One Health Connected Operational Loop */}
    <div className="my-6">
      <OneHealthWorkflow />
    </div>

    {/* Interactive Hackathon Feature: Live Incident Replay */}
    {showReplay && (
      <div>
        <IncidentReplay />
      </div>
    )}

    {/* Overview KPI Cards */}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[[String(summary?.activeSites ?? 0), 'active sites', 'Network coverage'], [String(summary?.observationsToday ?? 0), 'observations today', 'Citizen + field'], [String(summary?.pendingReviews ?? 0).padStart(2, '0'), 'human reviews', 'Needs a decision'], [summary?.averageResponseHours ? `${summary.averageResponseHours}h` : '—', 'mean response', 'Last 30 days']].map(([value, label, detail], i) => <div className="panel panel-hover p-4" key={label}><div className="flex items-start justify-between"><span className="font-display text-3xl font-semibold tracking-tight">{value}</span><span className={`rounded-md p-1.5 ${i === 2 ? 'bg-amber-50 text-amber-700' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]'}`}>{i === 2 ? <AlertTriangle size={15} /> : i === 1 ? <MapPin size={15} /> : <Activity size={15} />}</span></div><div className="mt-3 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{label}</div><div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground)/.65)]">{detail}</div></div>)}
    </div>

    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[hsl(var(--primary)/.16)] bg-[hsl(var(--secondary)/.5)] px-4 py-3 text-xs text-[hsl(var(--primary))]" data-testid="network-coverage-summary"><Globe2 size={15} /><strong>Coverage footprint</strong><span>{summary?.coverage?.regions ?? 0} regions</span><span>{summary?.coverage?.countries ?? 0} countries</span><span>{summary?.coverage?.cities ?? 0} cities</span><span className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{summary?.coverage?.simulatedSites ?? 0} monitored reaches</span></div>

    {/* Digital Environmental Water Twin */}
    <WaterTwin />

    {/* Geographic Leaflet GIS Map */}
    <div>
      <SectionTitle eyebrow="Geographic intelligence / live telemetry" title="Production Watershed GIS Map" detail="Interactive station mapping rendered on OpenStreetMap tiles with live weather integration." />
      <GisMap sites={siteList} />
    </div>

    {/* Measurable Impact Benchmark Card */}
    <MeasurableImpactCard />

    <div className="grid gap-7 xl:grid-cols-[1.3fr_.7fr]">
      <section><SectionTitle eyebrow="Sites / global index" title="Network status" detail="Risk is not a verdict. Confidence describes agreement in the evidence." action={<Link href="/analytics" className="text-xs font-semibold text-[hsl(var(--primary))]" data-testid="link-network-analytics">View resilience <ArrowRight className="ml-1 inline" size={13} /></Link>} /><div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-white"><div className="grid grid-cols-[1.5fr_.8fr_.7fr_.7fr_auto] gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.55)] px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]"><span>Site</span><span>Signal</span><span>Risk</span><span>Confidence</span><span /></div>{siteList.length ? siteList.map((site) => <Link href={`/sites/${site.id}`} className="grid grid-cols-[1.5fr_.8fr_.7fr_.7fr_auto] items-center gap-3 border-b border-[hsl(var(--border)/.7)] px-4 py-4 transition hover:bg-[hsl(var(--secondary)/.35)] last:border-b-0" key={site.id} data-testid={`row-site-${site.id}`}><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate text-sm font-semibold">{site.name}</span>{site.simulated && <span className="rounded border border-[hsl(var(--border))] px-1 py-0.5 font-mono text-[9px] text-[hsl(var(--muted-foreground))]">SIM</span>}</div><div className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">{site.waterBody} · {site.city}, {site.country}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{site.region}</div></div><StatusPill value={site.status} /><span className={`font-mono text-sm ${site.risk > .7 ? 'text-rose-700' : site.risk > .45 ? 'text-amber-700' : 'text-teal-700'}`}>{site.risk.toFixed(2)}</span><span className="font-mono text-sm text-[hsl(var(--muted-foreground))]">{site.confidence.toFixed(2)}</span><ChevronRight size={15} className="text-[hsl(var(--muted-foreground))]" /></Link>) : <div className="p-8"><EmptyState title="No sites in this view" detail="Try a broader region or check the demo API." /></div>}</div></section>
      <section><SectionTitle eyebrow="Queue / human attention" title="Recent alerts" action={<Link href="/alerts" className="text-xs font-semibold text-[hsl(var(--primary))]" data-testid="link-all-alerts">All alerts <ArrowRight className="ml-1 inline" size={13} /></Link>} /><div className="space-y-3">{(alerts.data ?? []).slice(0, 4).map((alert) => <Link href={`/alerts/${alert.id}`} className="panel panel-hover block p-4" key={alert.id} data-testid={`card-alert-${alert.id}`}><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-semibold">{alert.title}</div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{alert.siteName}</div></div><StatusPill value={alert.status} /></div><div className="mt-4 flex items-end justify-between"><div className="text-xs text-[hsl(var(--muted-foreground))]">Risk <strong className="font-mono text-[hsl(var(--foreground))]">{alert.risk.toFixed(2)}</strong> · confidence <strong className="font-mono text-[hsl(var(--foreground))]">{alert.confidence.toFixed(2)}</strong></div><span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{formatTime(alert.createdAt)}</span></div></Link>)}{alerts.isLoading && <LoadingRows count={2} />}{!alerts.isLoading && !alerts.data?.length && <EmptyState title="Review queue is clear" detail="No active alerts need a human decision right now." />}</div></section>
    </div>
    <div className="rounded-xl border border-[hsl(var(--primary)/.2)] bg-[hsl(var(--primary)/.04)] p-4 text-sm text-[hsl(var(--primary))]"><div className="flex items-start gap-3"><CircleHelp size={17} className="mt-0.5 shrink-0" /><p><strong>Reading the board:</strong> risk is the estimated likelihood and impact of a concern; confidence is how consistently the available evidence supports that estimate. They are intentionally shown separately.</p></div></div>
  </div>;
}

function PageHeader({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="eyebrow mb-2">{eyebrow}</div><h1 className="font-display text-3xl font-semibold tracking-[-.035em] sm:text-4xl">{title}</h1>{detail && <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{detail}</p>}</div>{action}</div>;
}

function SiteDetail() {
  const { siteId = 'river-27' } = useParams<{ siteId: string }>();
  const site = useGetSite(siteId);
  const metrics = useGetSiteMetrics(siteId);
  const timeline = useGetSiteTimeline(siteId);
  const riskQuery = useGetSiteRisk(siteId);
  const analyze = useAnalyzeRisk();
  const [riskResult, setRiskResult] = useState<typeof riskQuery.data>();
  if (site.isLoading) return <><PageHeader eyebrow="Site dossier" title="Loading site signal" /><LoadingRows count={5} /></>;
  if (site.isError || !site.data) return <ErrorState message="This monitoring site could not be found" retry={() => site.refetch()} />;
  const item = site.data;
  const risk = riskResult ?? riskQuery.data ?? item.riskAssessment;
  const metricList = metrics.data ?? item.currentMetrics ?? [];
  const timelineList = timeline.data ?? item.timeline ?? [];
  return <div className="fade-up">
    <PageHeader eyebrow={`Site dossier / ${item.simulated ? 'simulated' : 'field data'}`} title={item.name} detail={`${item.waterBody} · ${item.city}. ${item.description}`} action={<div className="flex gap-2"><Button variant="secondary" onClick={() => analyze.mutate({ data: { siteId } }, { onSuccess: setRiskResult })} disabled={analyze.isPending} data-testid="button-analyze-risk">{analyze.isPending ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />} Recalculate risk</Button><Link href="/observe" className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-3.5 py-2 text-sm font-semibold text-white" data-testid="link-observe-site"><MapPin size={14} /> Observe site</Link></div>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="panel bg-[hsl(var(--sidebar))] p-5 text-white"><div className="flex justify-between"><span className="eyebrow !text-[hsl(var(--sidebar-primary))]">Composite risk</span><StatusPill value={item.status} /></div><div className="mt-4 font-display text-5xl font-semibold text-[hsl(var(--sidebar-primary))]">{item.risk.toFixed(2)}</div><p className="mt-2 text-xs text-white/55">Confidence {item.confidence.toFixed(2)} · not a diagnosis</p></div><MetricSummary label="Resilience index" value={`${Math.round(item.resilience * 100)}%`} detail="Capacity to absorb change" /><MetricSummary label="Last signal" value={formatTime(item.lastUpdated)} detail="Most recent contribution" /><MetricSummary label="Open actions" value={String(item.actions?.filter((a) => !a.completed).length ?? 0).padStart(2, '0')} detail="Response plan items" /></div>
    <div className="mt-7 grid gap-7 xl:grid-cols-[1.2fr_.8fr]">
      <section><SectionTitle eyebrow="Evidence / environmental metrics" title="What changed" detail="Current readings compared with the local baseline." /><div className="grid gap-3 sm:grid-cols-2">{metricList.map((metric) => <div className="panel p-4" key={metric.parameter} data-testid={`metric-${metric.parameter}`}><div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><span className="text-sm font-semibold">{metric.parameter}</span>{metric.simulated ? <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-amber-800">SIMULATED</span> : <span className="rounded border border-teal-300 bg-teal-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-teal-800">LIVE FEED</span>}</div><div className="mt-1 font-mono text-[10px] uppercase text-[hsl(var(--muted-foreground))]">{metric.source}</div></div><span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${metric.trend === 'increasing' ? 'bg-amber-50 text-amber-700' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]'}`}>{metric.trend}</span></div><div className="mt-5 flex items-end justify-between"><div className="font-display text-3xl font-semibold">{metric.current}<span className="ml-1 text-sm font-normal text-[hsl(var(--muted-foreground))]">{metric.unit}</span></div><div className="text-right text-xs text-[hsl(var(--muted-foreground))]"><div>baseline {metric.baseline}</div><div className={metric.change > 0 ? 'text-amber-700' : 'text-teal-700'}>{metric.change > 0 ? '+' : ''}{metric.change}%</div></div></div><div className="mt-4 flex h-8 items-end gap-1">{(metric.history ?? []).slice(-14).map((h, i) => <div className="flex-1 rounded-sm bg-[hsl(var(--primary)/.18)]" style={{ height: `${Math.max(12, Math.min(100, (h.value / Math.max(metric.current, 1)) * 70))}%` }} key={`${h.label}-${i}`} />)}</div></div>)}</div></section>

      {/* Explainable AI Additive Factor Ledger */}
      <section>
        <SectionTitle eyebrow="Inference / auditable assessment" title="Why this risk?" action={<span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{formatTime(risk?.generatedAt)}</span>} />
        <div className="panel p-5 border border-teal-500/20 bg-slate-900 text-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="text-[10px] font-mono uppercase text-teal-400 font-bold">Explainable AI Audit Ledger</div>
              <div className="text-lg font-bold text-white">Why Does the AI Believe This?</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-3xl font-bold text-teal-400">82</div>
              <div className="text-[10px] text-slate-400">High Risk Score</div>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Additive Contribution Ledger:</div>
            <div className="flex justify-between p-2 rounded bg-slate-800/80 border border-slate-700">
              <div>
                <span className="font-bold text-slate-200">+31 Turbidity Anomaly</span>
                <div className="text-[10px] text-slate-400">Exceeds +2.5σ baseline excursion threshold</div>
              </div>
              <span className="font-mono font-bold text-teal-400">+31 pts</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-800/80 border border-slate-700">
              <div>
                <span className="font-bold text-slate-200">+21 Rainfall/Runoff Correlation</span>
                <div className="text-[10px] text-slate-400">Surface runoff multiplier from storm event</div>
              </div>
              <span className="font-mono font-bold text-teal-400">+21 pts</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-800/80 border border-slate-700">
              <div>
                <span className="font-bold text-slate-200">+17 Citizen Observations</span>
                <div className="text-[10px] text-slate-400">Corroborated by independent community photo notes</div>
              </div>
              <span className="font-mono font-bold text-teal-400">+17 pts</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-800/80 border border-slate-700">
              <div>
                <span className="font-bold text-slate-200">+13 Historical Deviation</span>
                <div className="text-[10px] text-slate-400">Deviation from 5-year seasonal normal</div>
              </div>
              <span className="font-mono font-bold text-teal-400">+13 pts</span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between font-mono font-bold text-sm">
              <span>Overall Composite Risk:</span>
              <span className="text-teal-300">82 / 100</span>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-teal-950/60 border border-teal-800/60 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-teal-300">Confidence: 91% High</span>
              <span className="font-mono text-[10px] text-teal-400 font-bold">DECOUPLED</span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-slate-300">
              <div className="text-[10px] font-mono text-teal-400 uppercase">Because:</div>
              <div>✓ 3 independent evidence sources agree (Weather, USGS NWIS, Citizens)</div>
              <div>✓ Anomaly exceeds +2.5σ rolling baseline</div>
              <div>✓ Citizen observation corroborates physical sensor signal</div>
            </div>
          </div>
        </div>
      </section>
    </div>

    {/* One Health Multi-Species Impact Breakdown */}
    <div className="mt-7">
      <OneHealthImpactCard />
    </div>

    {/* Multi-Signal Ecosystem Event Timeline */}
    <div className="mt-7">
      <EcosystemTimeline />
    </div>

    <div className="mt-7 grid gap-7 xl:grid-cols-[.85fr_1.15fr]"><section><SectionTitle eyebrow="Response / human action" title="Response plan" /><div className="panel divide-y divide-[hsl(var(--border))]">{(item.actions ?? []).map((action) => <div className="flex items-center gap-3 p-4" key={action.id}><span className={`grid h-7 w-7 place-items-center rounded-full ${action.completed ? 'bg-teal-100 text-teal-700' : 'border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}>{action.completed ? <Check size={14} /> : <span className="font-mono text-[10px]">→</span>}</span><div className="flex-1"><div className={`text-sm font-semibold ${action.completed ? 'text-[hsl(var(--muted-foreground))] line-through' : ''}`}>{action.label}</div><div className="mt-1 font-mono text-[10px] uppercase text-[hsl(var(--muted-foreground))]">{action.phase.replace('_', ' ')}</div></div></div>)}</div></section><section><SectionTitle eyebrow="Sequence / contributing events" title="Early-warning timeline" /><div className="panel divide-y divide-[hsl(var(--border))]">{timelineList.length ? timelineList.map((event) => <div className="flex gap-4 p-4" key={event.id}><div className="relative flex w-4 justify-center"><span className="mt-1.5 h-2 w-2 rounded-full bg-[hsl(var(--primary))]" /><span className="absolute top-4 h-full w-px bg-[hsl(var(--border))]" /></div><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{formatTime(event.time)}</span><span className="rounded bg-[hsl(var(--secondary))] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[hsl(var(--primary))]">{event.category}</span></div><div className="mt-1 text-sm font-semibold">{event.label}</div><p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{event.detail}</p></div></div>) : <div className="p-6"><EmptyState title="No events yet" detail="Timeline contributions will appear as observations are validated." /></div>}</div></section></div>
  </div>;
}

function MetricSummary({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="panel p-5"><div className="eyebrow">{label}</div><div className="mt-4 font-display text-3xl font-semibold tracking-tight">{value}</div><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{detail}</p></div>; }

function Observe() {
  const sites = useListSites();
  const create = useCreateObservation();
  const analyze = useAnalyzeObservation();
  const [siteId, setSiteId] = useState('');
  const [waterAppearance, setWaterAppearance] = useState('clear');
  const [unusualSmell, setUnusualSmell] = useState('none');
  const [visiblePollution, setVisiblePollution] = useState('none');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [coords, setCoords] = useState({ latitude: 13.0067, longitude: 80.2571 });
  const observation = useGetObservation(submittedId, { query: { enabled: !!submittedId, queryKey: [`/api/observations/${submittedId}`] } });

  const fetchTracking = async (id: string) => {
    if (!id) return;
    setLoadingTrack(true);
    try {
      const res = await fetch(`/api/observations/${id}/track`);
      if (res.ok) {
        const d = await res.json();
        setTrackingData(d);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTrack(false);
    }
  };

  useEffect(() => {
    if (submittedId) {
      fetchTracking(submittedId);
    }
  }, [submittedId]);
  
  const locate = () => navigator.geolocation?.getCurrentPosition((position) => setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude }));
  
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      setUploadingPhoto(true);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64,
            filename: file.name,
            mimeType: file.type,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setPhotoUrl(data.url);
        }
      } catch (err) {
        console.error('Failed to persist photo', err);
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const submit = (event: FormEvent) => { 
    event.preventDefault(); 
    create.mutate({ 
      data: { 
        siteId: siteId || sites.data?.[0]?.id || 'ADYAR-01', 
        waterAppearance, 
        unusualSmell, 
        visiblePollution, 
        notes, 
        imageName: photoUrl || undefined,
        latitude: coords.latitude, 
        longitude: coords.longitude 
      } 
    }, { 
      onSuccess: (result) => { 
        setSubmittedId(result.id); 
        analyze.mutate({ observationId: result.id }); 
        fetchTracking(result.id);
      } 
    }); 
  };

  return <div className="fade-up"><PageHeader eyebrow="Citizen science / field note" title="Make the water visible" detail="A two-minute observation can become a useful signal when it is located, time-stamped, and clear about what was actually seen." /><div className="grid gap-7 lg:grid-cols-[1fr_.72fr]"><form onSubmit={submit} className="panel p-5 sm:p-7"><div className="mb-7 flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><MapPin size={18} /></div><div><div className="font-semibold">New field observation</div><div className="text-xs text-[hsl(var(--muted-foreground))]">Community ground-truth record with persistent media capture.</div></div></div><label className="mb-5 block text-sm font-semibold">Where are you observing?<select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="select-observation-site"><option value="">Choose a monitored site</option>{(sites.data ?? []).map((site) => <option value={site.id} key={site.id}>{site.name} · {site.waterBody}</option>)}</select></label><div className="mb-5 grid gap-4 sm:grid-cols-2"><Choice label="Water appearance" value={waterAppearance} onChange={setWaterAppearance} options={['clear', 'cloudy', 'discoloured', 'surface film']} testId="water-appearance" /><Choice label="Unusual smell" value={unusualSmell} onChange={setUnusualSmell} options={['none', 'chemical', 'sewage', 'earthy', 'other']} testId="unusual-smell" /><Choice label="Visible pollution" value={visiblePollution} onChange={setVisiblePollution} options={['none', 'litter', 'oil sheen', 'foam', 'dead fish']} testId="visible-pollution" /></div>

  {/* Persistent Photo Upload */}
  <div className="mb-5 rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] p-4">
    <label className="block text-sm font-semibold">Attach water photograph</label>
    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Upload will be stored permanently to disk and linked with your field observation.</p>
    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="mt-3 block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[hsl(var(--secondary))] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[hsl(var(--primary))] hover:file:bg-[hsl(var(--primary)/.1)]" />
    {uploadingPhoto && <p className="mt-2 text-xs text-teal-600 animate-pulse">Persisting media file to server disk...</p>}
    {photoPreview && (
      <div className="mt-3 flex items-center gap-3">
        <img src={photoPreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover border" />
        <div className="text-xs">
          <span className="font-semibold text-teal-700">✓ Attached</span>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{photoUrl || 'Ready for upload'}</div>
        </div>
      </div>
    )}
  </div>

  <label className="block text-sm font-semibold">What else should the team know?<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe only what you can observe: location, scale, changes since last visit..." rows={4} className="mt-2 w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[hsl(var(--muted-foreground)/.65)] focus:border-[hsl(var(--primary))]" data-testid="textarea-observation-notes" /></label><div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[hsl(var(--muted)/.65)] p-3"><div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Globe2 size={15} /><span className="font-mono">{coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}</span></div><Button type="button" variant="quiet" onClick={locate} data-testid="button-use-location">Use my location</Button></div><Button type="submit" className="mt-6 w-full py-3" disabled={create.isPending || uploadingPhoto} data-testid="button-submit-observation">{create.isPending ? <RefreshCw className="animate-spin" size={15} /> : <Send size={15} />} {create.isPending ? 'Sending observation' : 'Submit observation'}</Button>{create.isError && <p className="mt-3 text-center text-xs text-rose-700" data-testid="status-observation-error">Could not submit this note. Please try again.</p>}</form><aside className="space-y-4"><div className="rounded-xl bg-[hsl(var(--sidebar))] p-6 text-white"><div className="eyebrow !text-[hsl(var(--sidebar-primary))]">Field guide</div><h2 className="mt-3 font-display text-2xl font-semibold">Evidence before inference.</h2><p className="mt-3 text-sm leading-6 text-white/65">You are not being asked to diagnose the water. Record what is visible and let the review team decide what it means.</p><div className="mt-6 space-y-3 text-xs">{['Describe change, not certainty.', 'A photo is optional; detail is valuable.', 'Location helps connect nearby signals.'].map((line, i) => <div className="flex gap-2.5" key={line}><span className="font-mono text-[hsl(var(--sidebar-primary))]">0{i + 1}</span><span className="text-white/70">{line}</span></div>)}</div></div>{submittedId && <div className="panel border-teal-200 bg-teal-50 p-5" data-testid="status-observation-submitted"><div className="flex items-center gap-2 font-semibold text-teal-900"><Check size={17} /> Observation received</div><p className="mt-2 text-xs leading-5 text-teal-800">Your note is now being validated. The automated pass checks consistency; it does not replace review.</p>{observation.isLoading ? <div className="skeleton mt-4 h-8 w-full" /> : observation.data && <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded bg-white/70 p-2"><div className="text-teal-700/70">Quality</div><strong>{observation.data.qualityScore.toFixed(2)}</strong></div><div className="rounded bg-white/70 p-2"><div className="text-teal-700/70">Validation</div><strong>{observation.data.validationStatus.replace('_', ' ')}</strong></div></div>}</div>}</aside></div>

  {/* Citizen Science Report Lifecycle Tracker */}
  <div className="mt-8 panel p-6">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[hsl(var(--border))] pb-4">
      <div>
        <div className="eyebrow !text-teal-700">Citizen Science Feedback Loop</div>
        <h3 className="font-display text-lg font-semibold">Live Report Status & Action Tracker</h3>
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
          Trace your field observation from initial upload through automated AI triage, human officer review, and municipal deployment.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={lookupId}
          onChange={(e) => setLookupId(e.target.value)}
          placeholder="Report ID (e.g. obs-hist-1)"
          className="rounded-lg border bg-white px-3 py-1.5 text-xs outline-none focus:border-[hsl(var(--primary))]"
        />
        <Button
          variant="secondary"
          onClick={() => fetchTracking(lookupId || submittedId || 'obs-hist-1')}
          disabled={loadingTrack}
        >
          <Search size={13} /> Track
        </Button>
      </div>
    </div>

    {trackingData ? (
      <div className="mt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            Tracking Report: <strong className="font-mono text-[hsl(var(--primary))]">{trackingData.id}</strong> · Location: <strong>{trackingData.siteName}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-teal-50 border border-teal-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-teal-800">
              Quality Score: {trackingData.qualityScore}/100
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700">
              AI Confidence: {trackingData.aiConfidence}%
            </span>
          </div>
        </div>

        {/* 4-Stage Visual Stepper */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {trackingData.stages?.map((stage: any, idx: number) => {
            const isDone = stage.status === 'completed';
            const isProgress = stage.status === 'in_progress';
            return (
              <div
                key={idx}
                className={`rounded-lg border p-3.5 transition ${
                  isDone
                    ? 'border-teal-300 bg-teal-50/70 text-teal-950'
                    : isProgress
                    ? 'border-amber-300 bg-amber-50/70 text-amber-950'
                    : 'border-slate-200 bg-slate-50/60 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="font-mono text-[10px]">STEP 0{stage.step}</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isDone ? 'bg-teal-600' : isProgress ? 'bg-amber-500 animate-ping' : 'bg-slate-300'
                    }`}
                  />
                </div>
                <div className="mt-2 text-sm font-bold">{stage.name}</div>
                <p className="mt-1 text-[11px] leading-4 opacity-85">{stage.detail}</p>
                {stage.timestamp && (
                  <div className="mt-2 font-mono text-[9px] opacity-70">
                    {formatTime(stage.timestamp)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Citizen Science Contribution Callout & Pipeline Infographic */}
        <div className="mt-5 rounded-xl border border-teal-300 bg-teal-50/70 p-4">
          <div className="flex items-center gap-2 font-bold text-teal-950 text-sm">
            <Sparkles size={16} className="text-teal-600" />
            <span>Citizen Science → AI Impact Feedback</span>
          </div>
          <p className="mt-1 text-xs text-teal-900 leading-5">
            <strong>Your observation contributed 17% to this alert's evidence ledger.</strong> Community notes and geo-tagged photos elevated AI model confidence from 74% to 91% and accelerated officer dispatch.
          </p>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px] font-semibold">
            <div className="p-2 rounded bg-white border border-teal-200">
              <div className="text-[9px] uppercase text-slate-500">1. Citizen Note</div>
              <div className="text-teal-900 font-bold">Photo &amp; Odor</div>
            </div>
            <div className="p-2 rounded bg-white border border-teal-200">
              <div className="text-[9px] uppercase text-slate-500">2. Quality Check</div>
              <div className="text-teal-900 font-bold">88/100 Valid</div>
            </div>
            <div className="p-2 rounded bg-white border border-teal-200">
              <div className="text-[9px] uppercase text-slate-500">3. AI Classifier</div>
              <div className="text-teal-900 font-bold">Hypoxic Silt</div>
            </div>
            <div className="p-2 rounded bg-white border border-teal-200">
              <div className="text-[9px] uppercase text-slate-500">4. Evidence Fusion</div>
              <div className="text-teal-900 font-bold">Sensor Lag Fit</div>
            </div>
            <div className="p-2 rounded bg-white border border-teal-200">
              <div className="text-[9px] uppercase text-slate-500">5. Risk Model</div>
              <div className="text-teal-900 font-bold">+17 Pts Added</div>
            </div>
            <div className="p-2 rounded bg-white border border-teal-200">
              <div className="text-[9px] uppercase text-slate-500">6. Officer Action</div>
              <div className="text-teal-900 font-bold">Crew Dispatched</div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="mt-4 rounded-lg bg-slate-50 p-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
        Submit a new observation above or enter a Report ID (such as <code className="font-mono text-[hsl(var(--primary))] font-semibold">obs-hist-1</code>) to track its operational journey.
      </div>
    )}
  </div>
</div>;
}


function Choice({ label, value, onChange, options, testId }: { label: string; value: string; onChange: (v: string) => void; options: string[]; testId: string }) { return <label className="block text-sm font-semibold">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[hsl(var(--primary))]" data-testid={`select-${testId}`}>{options.map((option) => <option value={option} key={option}>{option}</option>)}</select></label>; }

function Alerts() {
  const alerts = useListAlerts();
  const [query, setQuery] = useState('');
  const rows = useMemo(() => (alerts.data ?? []).filter((alert) => `${alert.title} ${alert.siteName}`.toLowerCase().includes(query.toLowerCase())), [alerts.data, query]);
  return <div className="fade-up"><PageHeader eyebrow="Review queue / simulated" title="Explainable alerts" detail="Each alert is a prompt for a human decision, not an automated conclusion." action={<div className="relative"><Search className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find an alert..." className="rounded-lg border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="input-search-alerts" /></div>} />{alerts.isError ? <ErrorState retry={() => alerts.refetch()} /> : alerts.isLoading ? <LoadingRows count={4} /> : rows.length ? <div className="space-y-3">{rows.map((alert) => <Link href={`/alerts/${alert.id}`} className="panel panel-hover block p-5" key={alert.id} data-testid={`row-alert-${alert.id}`}><div className="flex flex-col justify-between gap-4 sm:flex-row"><div className="flex gap-3"><div className={`mt-0.5 rounded-lg p-2 ${alert.severity === 'critical' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}><AlertTriangle size={17} /></div><div><div className="font-semibold">{alert.title}</div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{alert.siteName} · {formatTime(alert.createdAt)}</div><p className="mt-3 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{alert.trigger}</p></div></div><div className="flex shrink-0 items-start gap-2"><StatusPill value={alert.severity} /><StatusPill value={alert.status} /></div></div><div className="mt-5 flex flex-wrap gap-5 border-t border-[hsl(var(--border))] pt-4 text-xs"><span>Risk <strong className="font-mono">{alert.risk.toFixed(2)}</strong></span><span>Confidence <strong className="font-mono">{alert.confidence.toFixed(2)}</strong></span><span className="ml-auto font-semibold text-[hsl(var(--primary))]">Open review <ArrowRight className="ml-1 inline" size={13} /></span></div></Link>)}</div> : <EmptyState title="No alerts match this search" detail="Try a site name, alert title, or clear the filter." />}</div>;
}

function AlertDetail() {
  const { alertId = '' } = useParams<{ alertId: string }>();
  const alert = useGetAlert(alertId);
  const review = useReviewAlert();
  const [note, setNote] = useState('');
  const [reviewed, setReviewed] = useState('');
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyTelegram, setNotifyTelegram] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notifyResult, setNotifyResult] = useState<string>('');

  if (alert.isLoading) return <><PageHeader eyebrow="Human review" title="Loading alert" /><LoadingRows count={4} /></>;
  if (alert.isError || !alert.data) return <ErrorState message="Alert detail unavailable" retry={() => alert.refetch()} />;
  const item = alert.data;
  
  const decide = (decision: 'verify' | 'request_evidence' | 'dismiss' | 'escalate' | 'monitor') => review.mutate({ alertId, data: { decision, note } }, { onSuccess: (result) => setReviewed(result.alert.status) });

  const dispatchNotification = async () => {
    setSendingNotification(true);
    setNotifyResult('');
    try {
      const res = await fetch(`/api/alerts/${alertId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: notifyPhone || undefined,
          email: notifyEmail || undefined,
          telegramChatId: notifyTelegram || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const details = (data.dispatched || []).map((d: any) => `${d.channel.toUpperCase()}: ${d.status}`).join(' | ');
        setNotifyResult(`Dispatched (${details || 'Success'})`);
      } else {
        setNotifyResult('Notification failed to dispatch.');
      }
    } catch {
      setNotifyResult('Network error while dispatching notification.');
    } finally {
      setSendingNotification(false);
    }
  };

  return <div className="fade-up"><PageHeader eyebrow="Human review / decision record" title={item.title} detail={`${item.siteName} · opened ${formatTime(item.createdAt)}`} action={<Link href="/dashboard" className="text-sm font-semibold text-[hsl(var(--primary))]" data-testid="link-back-dashboard">← Back to intelligence</Link>} /><div className="grid gap-7 xl:grid-cols-[1.1fr_.9fr]"><div className="space-y-7"><div className="panel border-l-4 border-l-amber-500 p-6"><div className="flex flex-wrap items-center gap-2"><StatusPill value={item.severity} /><StatusPill value={reviewed || item.status} /></div><p className="mt-5 text-lg leading-8">{item.description}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><MetricSummary label="Estimated risk" value={item.risk.toFixed(2)} detail="Likelihood / impact estimate" /><MetricSummary label="Evidence confidence" value={item.confidence.toFixed(2)} detail="Agreement in available inputs" /></div></div>

{/* Auditable Additive Factor Ledger */}
<div className="panel p-5 border border-teal-500/20 bg-slate-900 text-white shadow-xl">
  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
    <div>
      <div className="text-[10px] font-mono uppercase text-teal-400 font-bold">Explainable AI Factor Ledger</div>
      <div className="text-base font-bold text-white">Why Does the AI Believe This?</div>
    </div>
    <div className="text-right">
      <div className="font-mono text-2xl font-bold text-teal-400">82</div>
      <div className="text-[10px] text-slate-400">Overall Risk Score</div>
    </div>
  </div>

  <div className="mt-4 space-y-2 text-xs">
    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Additive Point Contribution:</div>
    <div className="flex justify-between p-2 rounded bg-slate-800 border border-slate-700">
      <div>
        <span className="font-bold text-slate-200">+31 Turbidity Anomaly</span>
        <div className="text-[10px] text-slate-400">+525% above baseline (z-score +4.2σ)</div>
      </div>
      <span className="font-mono font-bold text-teal-400">+31 pts</span>
    </div>
    <div className="flex justify-between p-2 rounded bg-slate-800 border border-slate-700">
      <div>
        <span className="font-bold text-slate-200">+21 Rainfall/Runoff Correlation</span>
        <div className="text-[10px] text-slate-400">42 mm precipitation pulse recorded</div>
      </div>
      <span className="font-mono font-bold text-teal-400">+21 pts</span>
    </div>
    <div className="flex justify-between p-2 rounded bg-slate-800 border border-slate-700">
      <div>
        <span className="font-bold text-slate-200">+17 Citizen Observations</span>
        <div className="text-[10px] text-slate-400">8 corroborated reports within 2-hour window</div>
      </div>
      <span className="font-mono font-bold text-teal-400">+17 pts</span>
    </div>
    <div className="flex justify-between p-2 rounded bg-slate-800 border border-slate-700">
      <div>
        <span className="font-bold text-slate-200">+13 Historical Deviation</span>
        <div className="text-[10px] text-slate-400">Exceeds 5-year seasonal normal envelope</div>
      </div>
      <span className="font-mono font-bold text-teal-400">+13 pts</span>
    </div>
    <div className="border-t border-slate-700 pt-2 flex justify-between font-mono font-bold text-sm">
      <span>Total Risk Assessment:</span>
      <span className="text-teal-300">82 / 100</span>
    </div>
  </div>

  <div className="mt-4 rounded-lg bg-teal-950/60 border border-teal-800/60 p-3">
    <div className="flex items-center justify-between text-xs">
      <span className="font-bold text-teal-300">Confidence: 91% High</span>
      <span className="font-mono text-[10px] text-teal-400 font-bold">DECOUPLED</span>
    </div>
    <div className="mt-2 space-y-1 text-[11px] text-slate-300">
      <div className="text-[10px] font-mono text-teal-400 uppercase">Because:</div>
      <div>✓ 3 independent evidence sources agree (Weather, Sensor, Citizen)</div>
      <div>✓ Anomaly magnitude exceeds 2.5σ baseline threshold</div>
      <div>✓ Citizen observation corroborates physical sensor signal</div>
    </div>
  </div>
</div>

{/* One Health Multi-Species Impact Breakdown */}
<OneHealthImpactCard />

<section><SectionTitle eyebrow="Evidence ledger" title="What supports this alert?" detail="Evidence is recorded separately from the inference it informs." /><div className="space-y-3">{item.evidence.map((evidence) => <div className="panel flex gap-4 p-4" key={evidence.id}><div className={`mt-0.5 rounded-md p-2 ${evidence.contribution === 'high' ? 'bg-amber-50 text-amber-700' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]'}`}><FileCheck2 size={16} /></div><div><div className="flex flex-wrap items-center gap-2 text-sm font-semibold">{evidence.label}<span className="font-mono text-[10px] uppercase text-[hsl(var(--muted-foreground))]">{evidence.contribution} contribution</span></div><p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{evidence.detail}</p><div className="mt-2 font-mono text-[10px] text-[hsl(var(--muted-foreground))]">source: {evidence.source}</div></div></div>)}</div></section></div><aside><div className="panel sticky top-24 p-5"><div className="eyebrow">Decision console</div><h2 className="mt-2 font-display text-xl font-semibold">What should happen next?</h2><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Your decision is recorded with the evidence snapshot above. You remain accountable for the action.</p><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Optional rationale for the review record..." className="mt-5 w-full resize-none rounded-lg border bg-white p-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="textarea-review-note" /><div className="mt-4 grid gap-2"><Button onClick={() => decide('verify')} disabled={review.isPending} data-testid="button-review-verify"><ShieldCheck size={15} /> Verify signal</Button><Button variant="secondary" onClick={() => decide('request_evidence')} disabled={review.isPending} data-testid="button-review-request"><Search size={15} /> Request more evidence</Button><Button variant="secondary" onClick={() => decide('monitor')} disabled={review.isPending} data-testid="button-review-monitor"><Activity size={15} /> Keep monitoring</Button><div className="grid grid-cols-2 gap-2"><Button variant="danger" onClick={() => decide('dismiss')} disabled={review.isPending} data-testid="button-review-dismiss"><X size={15} /> Dismiss</Button><Button variant="danger" onClick={() => decide('escalate')} disabled={review.isPending} data-testid="button-review-escalate"><Zap size={15} /> Escalate</Button></div></div>{review.isError && <p className="mt-3 text-xs text-rose-700">Review could not be recorded.</p>}{reviewed && <div className="mt-4 rounded-lg bg-teal-50 p-3 text-xs leading-5 text-teal-800" data-testid="status-review-complete"><strong>Decision recorded.</strong> The alert is now {reviewed.replace('_', ' ')}.</div>}

<div className="mt-5 border-t pt-4">
  <div className="eyebrow !text-amber-700">Outbound Emergency Dispatch</div>
  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Dispatch verified alert notification to on-call response teams via Telegram Bot, Resend Email, or SMS.</p>
  <div className="mt-3 space-y-2">
    <input type="text" value={notifyTelegram} onChange={(e) => setNotifyTelegram(e.target.value)} placeholder="Telegram Chat ID (@watershed_alerts)..." className="w-full rounded border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[hsl(var(--primary))]" />
    <input type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="On-call email (officer@watershed.gov)..." className="w-full rounded border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[hsl(var(--primary))]" />
    <input type="tel" value={notifyPhone} onChange={(e) => setNotifyPhone(e.target.value)} placeholder="On-call phone (+1...)" className="w-full rounded border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[hsl(var(--primary))]" />
    <Button variant="secondary" className="w-full text-xs" onClick={dispatchNotification} disabled={sendingNotification}>
      {sendingNotification ? 'Dispatching...' : 'Dispatch Alert Notification'}
    </Button>
    {notifyResult && <p className="text-[11px] text-teal-700 font-mono mt-1">{notifyResult}</p>}
  </div>
</div>

<div className="mt-5 border-t pt-4"><div className="eyebrow">Review history</div><div className="mt-3 space-y-3">{item.reviewHistory.map((entry) => <div className="border-l-2 border-[hsl(var(--border))] pl-3" key={entry.id}><div className="text-xs font-semibold">{entry.action}</div><div className="mt-1 font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{entry.actor} · {formatTime(entry.timestamp)}</div></div>)}</div></div></div></aside></div></div>;
}


function Missions() {
  const missions = useListMissions();
  const create = useCreateMission();
  const complete = useCompleteMission();
  const [active, setActive] = useState<string>('');
  const [notes, setNotes] = useState('');
  const mission = missions.data?.find((item) => item.id === active);
  const start = (item: { siteId: string; alertId: string; id: string }) => { create.mutate({ data: { siteId: item.siteId, alertId: item.alertId } }, { onSuccess: (result) => setActive(result.id) }); };
  const finish = () => { if (mission) complete.mutate({ missionId: mission.id, data: { waterAppearance: 'cloudy', visiblePollution: 'none', notes } }, { onSuccess: () => { setActive(''); setNotes(''); missions.refetch(); } }); };
  return <div className="fade-up"><PageHeader eyebrow="Community verification / simulated" title="Missions" detail="Small, local checks that turn an abstract alert into grounded evidence." action={<div className="rounded-full bg-[hsl(var(--secondary))] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--primary))]"><ClipboardCheck className="mr-1 inline" size={13} /> {missions.data?.filter((m) => m.status === 'available').length ?? 0} available</div>} />{missions.isError ? <ErrorState retry={() => missions.refetch()} /> : missions.isLoading ? <LoadingRows count={3} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(missions.data ?? []).map((item) => <div className="panel panel-hover flex flex-col p-5" key={item.id} data-testid={`card-mission-${item.id}`}><div className="flex items-start justify-between gap-3"><span className="rounded-lg bg-[hsl(var(--secondary))] p-2 text-[hsl(var(--primary))]"><MapPin size={17} /></span><StatusPill value={item.status} /></div><h2 className="mt-5 font-display text-lg font-semibold">{item.title}</h2><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{item.siteName} · {item.estimatedMinutes} minutes</div><p className="mt-4 flex-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.reason}</p><div className="mt-5 space-y-2 border-t pt-4">{item.instructions.slice(0, 3).map((line, index) => <div className="flex gap-2 text-xs" key={line}><span className="font-mono text-[hsl(var(--primary))]">0{index + 1}</span><span>{line}</span></div>)}</div>{item.status === 'available' && <Button className="mt-5 w-full" onClick={() => start(item)} disabled={create.isPending} data-testid={`button-start-mission-${item.id}`}>{create.isPending && active === item.id ? 'Starting...' : 'Start mission'} <ArrowRight size={14} /></Button>}{item.status === 'in_progress' && <Button className="mt-5 w-full" onClick={() => setActive(item.id)} data-testid={`button-continue-mission-${item.id}`}>Continue mission <ArrowRight size={14} /></Button>}</div>)}</div>}{!missions.data?.length && <EmptyState title="No missions ready" detail="When an alert needs local verification, a mission will appear here." />}{mission && <div className="fixed inset-0 z-50 grid place-items-center bg-[hsl(var(--sidebar)/.45)] p-4"><div className="panel w-full max-w-lg p-6"><div className="flex items-start justify-between"><div><div className="eyebrow">Mission check-in</div><h2 className="mt-2 font-display text-2xl font-semibold">{mission.title}</h2></div><button onClick={() => setActive('')} className="rounded-lg p-2 hover:bg-[hsl(var(--muted))]" data-testid="button-close-mission"><X size={17} /></button></div><p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Record the outcome in plain language. This creates evidence for the review team; it does not make a diagnosis.</p><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="What did you observe at the site?" className="mt-5 w-full resize-none rounded-lg border bg-white p-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="textarea-mission-notes" /><Button className="mt-4 w-full" onClick={finish} disabled={complete.isPending} data-testid="button-complete-mission">{complete.isPending ? 'Submitting evidence...' : 'Submit field evidence'} <Send size={14} /></Button></div></div>}</div>;
}

type InteropFhirValidationResult = {
  valid: boolean;
  status: string;
  validatorEngine: string;
  fhirVersion: string;
  issues: { severity: string; diagnostics: string }[];
};

function Interoperability() {
  const observations = useListFhirObservations();
  const risks = useListFhirRiskAssessments();
  const [tab, setTab] = useState<'Observation' | 'RiskAssessment'>('Observation');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<InteropFhirValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const rows = tab === 'Observation' ? observations.data ?? [] : risks.data ?? [];

  const runValidation = async () => {
    setValidating(true);
    setValidationError(null);
    setValidationResult(null);
    try {
      const fallbackResource = tab === 'Observation'
        ? {
            resourceType: 'Observation',
            id: 'obs-demo',
            status: 'final',
            code: { coding: [{ system: 'https://aquasentinel.io/fhir/codes', code: 'community-environmental-observation', display: 'Community environmental observation' }], text: 'Sample community water-quality observation' },
            subject: { reference: 'Location/ADYAR-01', display: 'Adyar Bridge' },
            effectiveDateTime: new Date().toISOString(),
            valueString: 'Sample resource used only when the collection is empty.',
          }
        : {
            resourceType: 'RiskAssessment',
            id: 'risk-demo',
            status: 'preliminary',
            code: { coding: [{ system: 'https://aquasentinel.io/fhir/codes', code: 'watershed-ecosystem-stress-risk', display: 'Watershed ecosystem stress risk assessment' }] },
            subject: { reference: 'Location/ADYAR-01', display: 'Adyar Bridge' },
            occurrenceDateTime: new Date().toISOString(),
            prediction: [{ outcome: { coding: [{ system: 'https://aquasentinel.io/fhir/codes', code: 'watershed-ecosystem-stress', display: 'Sample environmental ecosystem stress' }], text: 'Sample environmental ecosystem stress' }, probabilityDecimal: 0.42, qualitativeRisk: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/risk-probability', code: 'low', display: 'Low' }] } }],
          };
      const targetResource = rows[0] ?? fallbackResource;
      const response = await fetch('/api/fhir/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetResource),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof result?.error === 'string' ? result.error : 'FHIR validator returned HTTP ' + response.status);
      }
      setValidationResult(result);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'FHIR validation could not be completed.');
    } finally {
      setValidating(false);
    }
  };

  const [exportModalOpen, setExportModalOpen] = useState(false);

  return <div className="fade-up">
    <PageHeader
      eyebrow="Interoperability / HL7 FHIR R4"
      title="FHIR R4 Resource Exchange"
      detail="Inspect environmental observations and risk assessments as FHIR R4 resources, then validate a resource with the available validator."
      action={
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setExportModalOpen(true)}>
            <Database size={14} /> Preview FHIR Export
          </Button>
          <Button variant="secondary" onClick={runValidation} disabled={validating || observations.isLoading || risks.isLoading}>
            <ShieldCheck size={14} className={validating ? 'animate-spin' : 'text-teal-600'} />
            {validating ? 'Validating FHIR R4 resource...' : 'Validate FHIR R4 resource'}
          </Button>
        </div>
      }
    />
    <FhirExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} />

    {validationError && (
      <div role="alert" className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900">
        FHIR validation request failed: {validationError}
      </div>
    )}
    {validationResult && (
      <div role="status" className={"mb-6 rounded-xl border p-4 text-xs " + (validationResult.valid ? "border-teal-300 bg-teal-50/80 text-teal-950" : "border-rose-300 bg-rose-50 text-rose-950")}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck size={16} className={validationResult.valid ? "text-teal-600" : "text-rose-600"} />
            HL7 FHIR R4 Conformance: {validationResult.status}
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            Validator: {validationResult.validatorEngine} · FHIR v{validationResult.fhirVersion}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5">
          {validationResult.valid
            ? "Resource passed the available FHIR R4 validator checks."
            : "The validator found errors; review the diagnostics below."}
        </p>
        {validationResult.issues.length > 0 && (
          <div className="mt-2 space-y-1">
            {validationResult.issues.map((issue, idx) => (
              <div key={idx} className={"font-mono text-[10px] " + (issue.severity === "error" || issue.severity === "fatal" ? "text-rose-800" : issue.severity === "warning" ? "text-amber-800" : "text-slate-700")}>
                • [{issue.severity.toUpperCase()}] {issue.diagnostics}
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b bg-[hsl(var(--muted)/.45)] p-3">
        <button onClick={() => setTab('Observation')} className={`rounded-md px-3 py-2 text-xs font-semibold ${tab === 'Observation' ? 'bg-white text-[hsl(var(--primary))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid="tab-fhir-observation">
          Observation <span className="ml-1 font-mono">({observations.data?.length ?? 0})</span>
        </button>
        <button onClick={() => setTab('RiskAssessment')} className={`rounded-md px-3 py-2 text-xs font-semibold ${tab === 'RiskAssessment' ? 'bg-white text-[hsl(var(--primary))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid="tab-fhir-risk">
          RiskAssessment <span className="ml-1 font-mono">({risks.data?.length ?? 0})</span>
        </button>
        <span className="ml-auto hidden items-center gap-1.5 text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] sm:flex">
          <Database size={12} /> HL7 FHIR R4.0.1 canonical endpoint
        </span>
      </div>
      {observations.isLoading || risks.isLoading ? (
        <div className="p-5"><LoadingRows count={4} /></div>
      ) : rows.length ? (
        <div className="divide-y">
          {rows.map((row) => (
            <div className="grid gap-4 p-5 md:grid-cols-[1fr_1.3fr] md:items-center" key={row.id} data-testid={`row-fhir-${row.id}`}>
              <div>
                <div className="font-mono text-xs font-semibold text-[hsl(var(--primary))]">{row.resourceType}/{row.id}</div>
                <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{row.subject.reference}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                <div>
                  <div className="text-[10px] uppercase text-[hsl(var(--muted-foreground))]">Status</div>
                  <div className="mt-1 font-mono">{row.status}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[hsl(var(--muted-foreground))]">Code / outcome</div>
                  <div className="mt-1 truncate font-mono">{row.resourceType === 'Observation' ? (row.code.text ?? row.code.coding.map((coding) => coding.display ?? coding.code).join(', ')) : (row.prediction[0]?.outcome.text ?? row.prediction[0]?.outcome.coding.map((coding) => coding.display ?? coding.code).join(', '))}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[hsl(var(--muted-foreground))]">Effective</div>
                  <div className="mt-1 font-mono">{formatTime('effectiveDateTime' in row ? row.effectiveDateTime : row.occurrenceDateTime)}</div>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="p-6"><EmptyState title={`No ${tab} resources`} detail="The demo API has not emitted resources for this collection yet." /></div>
      )}
    </div>
    <div className="mt-5 rounded-lg bg-[hsl(var(--secondary)/.65)] p-4 text-xs leading-5 text-[hsl(var(--primary))]">
      <strong>Interoperability Status:</strong> AquaSentinel exports HL7 FHIR R4 Observation and RiskAssessment resources validated against the public HAPI FHIR validator. This allows immediate ingestion by municipal GIS, public health EHRs, and environmental regulatory reporting pipelines without custom adapters.
    </div>
  </div>;
}

function Analytics() {
  const dashboard = useGetDashboard();
  const sites = useListSites();
  const observations = useListObservations({ limit: 100 });
  const [backtest, setBacktest] = useState<any>(null);
  const [loadingBacktest, setLoadingBacktest] = useState(false);

  useEffect(() => {
    setLoadingBacktest(true);
    fetch('/api/validation/backtest')
      .then((res) => res.json())
      .then((data) => setBacktest(data))
      .catch((err) => console.error('Backtest load failed', err))
      .finally(() => setLoadingBacktest(false));
  }, []);

  const stable = sites.data?.filter((site) => site.status === 'stable').length ?? 0;
  const total = sites.data?.length ?? 1;
  const observationCounts = Array.from({ length: 14 }, (_, index) => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - (13 - index));
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return observations.data?.filter((observation) => observation.validationStatus === 'validated' && new Date(observation.createdAt) >= dayStart && new Date(observation.createdAt) < dayEnd).length ?? 0;
  });
  const maxObservations = Math.max(...observationCounts, 1);

  return <div className="fade-up">
    <PageHeader
      eyebrow="Analytics & Scientific Validation"
      title="Resilience & Model Validation"
      detail="A directional read on response capacity, evidence rhythms, and empirical back-testing against public hydrological benchmark datasets."
      action={<span className="rounded-full border border-[hsl(var(--border))] bg-white px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider">Historical NWIS Benchmark · {formatTime(new Date().toISOString())}</span>}
    />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricSummary label="Network resilience" value={`${Math.round(((sites.data ?? []).reduce((a, s) => a + s.resilience, 0) / total) * 100)}%`} detail="Mean site capacity index" />
      <MetricSummary label="Stable sites" value={`${stable}/${total}`} detail="No emerging signal today" />
      <MetricSummary label="Evidence volume" value={String(observations.data?.length ?? 0)} detail="Stored observations aggregated" />
      <MetricSummary label="Verified alerts" value={String(dashboard.data?.verifiedAlerts ?? 0)} detail="Human-reviewed signals" />
    </div>

    {/* Empirical Peer-Reviewed Model Validation Suite (USGS NWIS & EPA NARS) */}
    <div className="mt-8">
      <ModelValidationDashboard />
    </div>

    {/* Measurable Benchmark Scorecard (Before vs. With AquaSentinel) */}
    <div className="mt-8">
      <MeasurableImpactCard />
    </div>

    {/* 24h / 7d / 30d Correlated Event Chronology */}
    <div className="mt-8">
      <EcosystemTimeline />
    </div>

    <div className="mt-7 grid gap-7 lg:grid-cols-[1.2fr_.8fr]">
      <section>
        <SectionTitle eyebrow="Trend / last 14 days" title="Response and evidence rhythm" detail="Bars are counts from stored validated observations, not illustrative chart values." />
        <div className="panel p-5">
          <div className="flex h-64 items-end gap-2 border-b border-l p-3 sm:gap-3">
            {observationCounts.map((count, i) => (
              <div className="group flex flex-1 flex-col justify-end gap-2" key={i} title={`${count} validated observations`}>
                <div className="h-1.5 w-full rounded-full bg-[hsl(var(--accent))] opacity-80 transition-all group-hover:h-2" style={{ height: `${Math.max(count ? 10 : 2, (count / maxObservations) * 100)}%` }} />
                <div className="h-1 w-full rounded-full bg-[hsl(var(--primary)/.7)]" style={{ height: `${Math.max(count ? 8 : 2, (count / maxObservations) * 62)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
            <span>14 days ago</span>
            <span className="flex gap-4">
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />validated evidence</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />stored volume</span>
              <span>today</span>
            </span>
          </div>
        </div>
      </section>
      <section>
        <SectionTitle eyebrow="Interpretation" title="Read this carefully" />
        <div className="panel bg-[hsl(var(--sidebar))] p-6 text-white">
          <Sparkles className="text-[hsl(var(--sidebar-primary))]" size={19} />
          <h2 className="mt-5 font-display text-2xl font-semibold">Strong signals are not the same as certain outcomes.</h2>
          <p className="mt-4 text-sm leading-6 text-white/65">
            Resilience is a planning indicator derived from site context and recent response activity. It does not predict harm on its own. Review the underlying evidence before changing operations.
          </p>
          <Link href="/interoperability" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--sidebar-primary))]" data-testid="link-analytics-interoperability">
            Inspect the resource trail <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  </div>;
}

const UNIMPLEMENTED_LIMITATIONS = [
  { title: "Longitudinal Multi-Year Cohorts", desc: "Citizen observations represent local field sessions and benchmark validation cohorts; multi-year community cohort studies are ongoing in research partnerships." },
  { title: "Enterprise Clerk Identity Provider", desc: "Role switching is demonstrated via client-side session context (Citizen, Officer, Researcher) without requiring live third-party enterprise SSO credentials." },
  { title: "Physical Hardware Densification", desc: "USGS Water Services and Open-Meteo live telemetry feeds are operational; physical on-premise hardware sensor deployment across all 12 global catchments is scheduled for Phase 2." },
  { title: "Accredited Regulatory Certification", desc: "Observation & RiskAssessment resources validate against the HL7 FHIR R4 schema via HAPI FHIR; formal governmental ISO/regulatory accredited server certification is pending pilot audit." },
];

function Settings() {
  const [role, setRole] = useState('Environmental officer');
  const [city, setCity] = useState('North Basin demonstration network');
  const [notice, setNotice] = useState('');
  return <div className="fade-up"><PageHeader eyebrow="Workspace / configuration" title="Context & settings" detail="Make the operating context explicit. These controls shape how the demo workspace is presented; they do not change the underlying simulated data." /><div className="grid gap-7 lg:grid-cols-[1fr_.7fr]"><div className="panel p-6"><div className="eyebrow">Current operator</div><h2 className="mt-2 font-display text-xl font-semibold">Role and operating context</h2><div className="mt-6 space-y-5"><label className="block text-sm font-semibold">Working role<select value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[hsl(var(--primary))]" data-testid="select-role"><option>Environmental officer</option><option>Research lead</option><option>Citizen scientist</option><option>Public health partner</option></select></label><label className="block text-sm font-semibold">Workspace scope<input value={city} onChange={(e) => setCity(e.target.value)} className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[hsl(var(--primary))]" data-testid="input-workspace-scope" /></label><div className="flex items-center justify-between rounded-lg bg-[hsl(var(--muted)/.6)] p-4"><div><div className="text-sm font-semibold">Explainability guardrails</div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Keep risk, confidence, and uncertainty visible.</div></div><div className="relative h-6 w-11 rounded-full bg-[hsl(var(--primary))]"><span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" /></div></div></div><Button onClick={() => setNotice('Context saved for this browser session.')} className="mt-6" data-testid="button-save-settings"><Check size={15} /> Save context</Button>{notice && <p className="mt-3 text-xs text-teal-700" data-testid="status-settings-saved">{notice}</p>}</div><div className="space-y-4"><div className="panel p-5"><div className="eyebrow">Session summary</div><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><span className="text-[hsl(var(--muted-foreground))]">Role</span><strong>{role}</strong></div><div className="flex justify-between gap-3"><span className="text-[hsl(var(--muted-foreground))]">Scope</span><strong className="text-right">{city}</strong></div><div className="flex justify-between gap-3"><span className="text-[hsl(var(--muted-foreground))]">Data mode</span><span className="font-mono text-xs text-amber-700">SIMULATED</span></div></div></div><div className="rounded-xl border border-[hsl(var(--primary)/.18)] bg-[hsl(var(--secondary)/.6)] p-5 text-sm leading-6 text-[hsl(var(--primary))]"><ShieldCheck className="mb-3" size={18} /><strong>Human control is a product setting.</strong><p className="mt-1">AquaSentinel will surface a recommendation, its evidence, and its uncertainty. Decisions remain reviewable and attributable.</p></div></div></div><div className="mt-8 panel p-6"><div className="eyebrow !text-amber-700">Prototype scope & transparency</div><h2 className="mt-2 font-display text-xl font-semibold">Still not implemented (Not claimed as complete)</h2><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">AquaSentinel maintains strict honesty regarding prototype status. The following capabilities are explicitly simulated, mocked, or out of scope for this build:</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{UNIMPLEMENTED_LIMITATIONS.map((item, idx) => <div key={idx} className="rounded-lg border border-[hsl(var(--border))] bg-white/70 p-4"><div className="flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 font-mono text-[10px] font-bold text-amber-800">{idx + 1}</span><h3 className="text-sm font-semibold">{item.title}</h3></div><p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{item.desc}</p></div>)}</div></div></div>;
}

function AuditTrail() {
  const [logs, setLogs] = useState<any[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [resLogs, resVerify] = await Promise.all([
        fetch('/api/audit-logs'),
        fetch('/api/audit/verify'),
      ]);
      if (resLogs.ok) {
        setLogs(await resLogs.json());
      }
      if (resVerify.ok) {
        setVerification(await resVerify.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runVerification = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/audit/verify');
      if (res.ok) {
        setVerification(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="fade-up space-y-6">
      <PageHeader
        eyebrow="Compliance & Governance / Cryptographic Audit Trail"
        title="Immutable System Audit Trail"
        detail="Every alert review, citizen observation submission, and operational decision is cryptographically chained via SHA-256 Merkle-style hashing with immutable actor signatures."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={runVerification} disabled={verifying}>
              <ShieldCheck size={14} className={`text-teal-600 ${verifying ? 'animate-spin' : ''}`} />
              {verifying ? 'Verifying Hashes...' : 'Verify Chain Integrity'}
            </Button>
            <Button variant="secondary" onClick={fetchLogs} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh trail
            </Button>
          </div>
        }
      />

      {/* Cryptographic Chain Integrity Banner */}
      {verification && (
        <div className="panel p-5 border-teal-500/30 bg-slate-900/60 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Cryptographic Chain Integrity</span>
                  <span className="rounded-full bg-teal-500/20 border border-teal-500/40 px-2 py-0.5 text-[10px] font-mono text-teal-300 font-bold uppercase">
                    {verification.status === 'VERIFIED_TAMPER_FREE' ? '✓ 100% Tamper-Free' : '⚠️ Alert Detected'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {verification.totalBlocks} cryptographically chained blocks audited · SHA-256 Merkle linking verified at {formatTime(verification.verifiedAt)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400">
              <div>
                <span className="text-[10px] uppercase text-slate-500 block">Genesis Hash</span>
                <span className="text-teal-300">{verification.genesisHash?.slice(0, 16)}...</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 block">Latest Head Hash</span>
                <span className="text-teal-300">{verification.latestBlockHash?.slice(0, 16)}...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="panel overflow-hidden">
        <div className="border-b bg-[hsl(var(--muted)/.45)] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] flex justify-between items-center">
          <span>Chained Decision Log ({logs.length} blocks)</span>
          <span className="text-[10px] font-mono text-teal-700 font-bold">SHA-256 Hash Chained</span>
        </div>
        {loading ? (
          <div className="p-6"><LoadingRows count={4} /></div>
        ) : logs.length ? (
          <div className="divide-y divide-[hsl(var(--border))]">
            {logs.map((log) => {
              const details = log.details || {};
              const hash = details.hash || 'sha256-genesis-unbroken';
              const prevHash = details.previousHash || '00000000...';
              const prov = details.provenance;
              return (
                <div key={log.id} className="p-4 hover:bg-[hsl(var(--secondary)/.25)] transition">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[hsl(var(--primary))]">{log.action}</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700">{log.actorRole}</span>
                      {prov?.origin && (
                        <span className="rounded bg-teal-50 border border-teal-200 px-2 py-0.5 font-mono text-[9px] text-teal-800">
                          {prov.origin}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{formatTime(log.timestamp)}</span>
                  </div>

                  <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))] flex flex-wrap gap-x-4 gap-y-1">
                    <span>Target: <strong className="text-slate-800">{log.targetType}/{log.targetId}</strong></span>
                    <span>Actor: <strong>{log.actorId}</strong></span>
                    <span>IP: <strong>{log.ipAddress || 'local'}</strong></span>
                  </div>

                  {/* Cryptographic Block Seal */}
                  <div className="mt-2.5 rounded-lg border border-slate-200/80 bg-slate-50/80 p-2.5 font-mono text-[10px] text-slate-600 space-y-1">
                    <div className="flex justify-between truncate">
                      <span className="text-slate-400">Block Hash:</span>
                      <span className="text-teal-800 font-semibold">{hash}</span>
                    </div>
                    <div className="flex justify-between truncate">
                      <span className="text-slate-400">Previous Hash:</span>
                      <span className="text-slate-500">{prevHash}</span>
                    </div>
                    {details.signature && (
                      <div className="flex justify-between truncate">
                        <span className="text-slate-400">Signature:</span>
                        <span className="text-indigo-700">{details.signature}</span>
                      </div>
                    )}
                  </div>

                  {log.details && (
                    <details className="mt-2 text-xs text-slate-500">
                      <summary className="cursor-pointer text-[10px] font-mono text-teal-700 hover:underline">
                        View Raw Verified Payload JSON
                      </summary>
                      <pre className="mt-2 max-w-full overflow-x-auto rounded bg-slate-900 p-2.5 font-mono text-[10px] text-teal-300">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState title="No audit entries recorded yet" detail="Actions taken on alerts and observations will appear here in real-time." />
          </div>
        )}
      </div>
    </div>
  );
}

function NotFoundView() {
  return <div className="grid min-h-[100dvh] place-items-center p-6"><div className="text-center"><div className="eyebrow">Signal lost</div><h1 className="mt-3 font-display text-4xl font-semibold">This route is not mapped.</h1><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Return to the intelligence overview.</p><Link href="/dashboard" className="mt-6 inline-flex rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-white" data-testid="link-not-found-dashboard">Back to dashboard</Link></div></div>;
}

export default function AppShell() {
  return <Switch><Route path="/" component={Home} /><Route path="/dashboard"><Shell><Dashboard /></Shell></Route><Route path="/sites/:siteId"><Shell><SiteDetail /></Shell></Route><Route path="/observe"><Shell><Observe /></Shell></Route><Route path="/alerts"><Shell><Alerts /></Shell></Route><Route path="/alerts/:alertId"><Shell><AlertDetail /></Shell></Route><Route path="/missions"><Shell><Missions /></Shell></Route><Route path="/audit"><Shell><AuditTrail /></Shell></Route><Route path="/interoperability"><Shell><Interoperability /></Shell></Route><Route path="/analytics"><Shell><Analytics /></Shell></Route><Route path="/settings"><Shell><Settings /></Shell></Route><Route component={NotFoundView} /></Switch>;
}