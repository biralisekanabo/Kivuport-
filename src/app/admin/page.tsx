"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Anchor,
  BarChart3,
  Building2,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Download,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Plus,
  Search,
  RefreshCw,
  Settings,
  Ship,
  SlidersHorizontal,
  UserRound,
  Users,
  X,
  Ticket,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

type Section = "overview" | "reservations" | "payments" | "fleet" | "pavilions" | "infrastructure" | "people" | "settings";
type ReservationStatus = "En attente" | "Confirmée" | "Payée" | "Annulée";
type AdminReservation = { id: number; reference: string; client: string; route: string; date: string; amount: string; status: ReservationStatus; type: string };

const navigation: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "reservations", label: "Réservations", icon: Anchor },
  { id: "payments", label: "Paiements", icon: CircleDollarSign },
  { id: "fleet", label: "Flotte & voyages", icon: Ship },
  { id: "pavilions", label: "Pavillons & tarifs", icon: Ticket },
  { id: "infrastructure", label: "Ports & quais", icon: Gauge },
  { id: "people", label: "Clients & équipe", icon: Users },
  { id: "settings", label: "Paramètres", icon: Settings },
];

type AdminRows = { payments: string[][]; fleet: string[][]; infrastructure: string[][]; people: string[][]; pavilions: string[][] };
type CreateType = "boat" | "port" | "client" | "pavilion" | "voyage";
type AdminMetrics = { todayReservations: number; revenue: string; activeClients: number; plannedVoyages: number; pendingPayments: number };

const emptyRows: AdminRows = { payments: [], fleet: [], infrastructure: [], people: [], pavilions: [] };
const emptyMetrics: AdminMetrics = { todayReservations: 0, revenue: "0 FC", activeClients: 0, plannedVoyages: 0, pendingPayments: 0 };

function asRows(data: unknown) {
  return Array.isArray(data) ? data as Record<string, unknown>[] : [];
}

function displayDate(value: unknown) {
  return typeof value === "string" ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

function formatExport(rows: AdminReservation[]) {
  const csv = ["Référence,Client,Trajet,Date,Montant,Statut,Type", ...rows.map((row) => [row.id, row.client, row.route, row.date, row.amount, row.status, row.type].map((value) => `"${value}"`).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "kivuport-reservations.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [isReady, setIsReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [adminRows, setAdminRows] = useState<AdminRows>(emptyRows);
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [createType, setCreateType] = useState<CreateType | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [metrics, setMetrics] = useState<AdminMetrics>(emptyMetrics);
  const [boats, setBoats] = useState<{ id: number; nom: string }[]>([]);
  const [pavilionChoices, setPavilionChoices] = useState({ names: [] as string[], classes: [] as string[], units: [] as string[], capacities: [] as string[], prices: [] as string[], currencies: ["FC", "USD"] });

  useEffect(() => {
    async function verifyAdmin() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return router.replace("/");
      const response = await fetch("/api/admin/status", { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } });
      if (!response.ok || !(await response.json()).isAdmin) return router.replace("/dashboard");
      const { data, error } = await supabase
        .from("reservations")
        .select("id, date_reservation, type_reservation, statut, prix_total, voyage:voyages(code_voyage), client:client(nom, prenom, email)")
        .order("date_reservation", { ascending: false });
      if (error) {
        setNotice(`Impossible de charger les réservations Supabase : ${error.message}`);
      } else {
        setReservations((data ?? []).map((row) => {
          const reservation = row as { id: number; date_reservation: string; type_reservation: string; statut: string; prix_total: number; voyage?: { code_voyage?: string } | null; client?: { nom?: string; prenom?: string; email?: string } | null };
          return {
            id: reservation.id,
            reference: `KP-${String(reservation.id).padStart(4, "0")}`,
            client: [reservation.client?.prenom, reservation.client?.nom].filter(Boolean).join(" ") || "Client non renseigné",
            route: reservation.voyage?.code_voyage || "Voyage non renseigné",
            date: new Date(reservation.date_reservation).toLocaleDateString("fr-FR"),
            amount: `${Number(reservation.prix_total || 0).toLocaleString("fr-FR")} FC`,
            status: reservation.statut === "confirme" ? "Confirmée" : reservation.statut === "arrive" ? "Payée" : reservation.statut === "annule" ? "Annulée" : "En attente",
            type: reservation.type_reservation,
          };
        }));
      }
      const [paymentsResult, boatsResult, portsResult, docksResult, clientsResult, voyagesResult, pavilionsResult] = await Promise.all([
        supabase.from("paiements").select("id, montant, devise, mode_paiement, date_paiement, statut"),
        supabase.from("bateaux").select("id, nom, immatriculation, type, capacite_totale, statut"),
        supabase.from("ports").select("nom, localisation, ville, statut"),
        supabase.from("quais").select("nom, numero, type_quai, statut, capacite"),
        supabase.from("client").select("nom, prenom, email, telephone, statut, date_inscription"),
        supabase.from("voyages").select("id, statut, date_depart"),
        supabase.from("pavillons").select("id, nom, classe, capacite_max, unite, prix_unitaire, prix_tonne, devise, bateau:bateaux(nom)"),
      ]);
      setBoats((boatsResult.data || []) as { id: number; nom: string }[]);
      const pavilionRows = asRows(pavilionsResult.data);
      setPavilionChoices({
        names: [...new Set(["Standard", "VIP", "Cargo", ...pavilionRows.map((row) => String(row.nom || ""))].filter(Boolean))],
        classes: [...new Set(["Standard", "VIP", "Cargo", ...pavilionRows.map((row) => String(row.classe || ""))].filter(Boolean))],
        units: [...new Set(["passager", "tonne", "unite", ...pavilionRows.map((row) => String(row.unite || ""))].filter(Boolean))],
        capacities: [...new Set(["1", "10", "20", "50", "100", ...pavilionRows.map((row) => String(row.capacite_max || ""))].filter(Boolean))],
        prices: [...new Set(["0", "5000", "10000", "25000", "50000", ...pavilionRows.flatMap((row) => [String(row.prix_unitaire || ""), String(row.prix_tonne || "")])].filter(Boolean))],
        currencies: ["FC", "USD"],
      });
      const paymentRecords = asRows(paymentsResult.data);
      const clientRecords = asRows(clientsResult.data);
      const voyageRecords = asRows(voyagesResult.data);
      const paidAmount = paymentRecords.filter((row) => row.statut === "paye").reduce((total, row) => total + Number(row.montant || 0), 0);
      const today = new Date().toDateString();
      setMetrics({
        todayReservations: (data ?? []).filter((row) => new Date((row as { date_reservation: string }).date_reservation).toDateString() === today).length,
        revenue: `${paidAmount.toLocaleString("fr-FR")} FC`,
        activeClients: clientRecords.filter((row) => row.statut === "actif").length,
        plannedVoyages: voyageRecords.filter((row) => row.statut === "prevu").length,
        pendingPayments: paymentRecords.filter((row) => row.statut === "en_attente").length,
      });
      setAdminRows({
        payments: asRows(paymentsResult.data).map((row) => [`PAY-${row.id}`, String(row.mode_paiement || "-") , displayDate(row.date_paiement), `${Number(row.montant || 0).toLocaleString("fr-FR")} ${row.devise || ""}`, String(row.statut || "-")]),
        fleet: asRows(boatsResult.data).map((row) => [String(row.nom || "-"), String(row.immatriculation || "-"), String(row.type || "-"), String(row.capacite_totale || "-"), String(row.statut || "-")]),
        infrastructure: [...asRows(portsResult.data).map((row) => ["Port", String(row.nom || "-"), `${row.ville || row.localisation || "-"}`, String(row.statut || "-")]), ...asRows(docksResult.data).map((row) => ["Quai", String(row.nom || `N°${row.numero || "-"}`), `Capacité ${row.capacite || "-"}`, String(row.statut || "-")])],
        people: asRows(clientsResult.data).map((row) => [`${row.prenom || ""} ${row.nom || ""}`.trim() || "-", String(row.email || "-"), String(row.telephone || "-"), displayDate(row.date_inscription), String(row.statut || "-")]),
        pavilions: asRows(pavilionsResult.data).map((row) => [String(row.nom || "-"), String((row.bateau as { nom?: string } | null)?.nom || "-"), String(row.classe || "-"), `${row.capacite_max || 0} ${row.unite || ""}`, `${row.prix_unitaire || 0} ${row.devise || "FC"}`]),
      });
      const dataErrors = [paymentsResult.error, boatsResult.error, portsResult.error, docksResult.error, clientsResult.error, voyagesResult.error, pavilionsResult.error].filter(Boolean);
      if (dataErrors.length > 0) setNotice(`Certaines données Supabase ne sont pas accessibles : ${dataErrors[0]?.message}`);
      setIsReady(true);
    }
    verifyAdmin();
  }, [router, reloadKey]);

  const filteredReservations = useMemo(() => reservations.filter((row) => `${row.id} ${row.client} ${row.route}`.toLowerCase().includes(query.toLowerCase())), [query, reservations]);
  const pendingReservations = reservations.filter((row) => row.status === "En attente").length;

  async function confirmReservation(id: number) {
    const { error } = await supabase.rpc("transition_kivuport_reservation", { p_reservation_id: id, p_to_status: "confirme", p_reason: "admin_confirmation" });
    if (error) return setNotice(`La confirmation a échoué : ${error.message}`);
    setReservations((current) => current.map((row) => row.id === id ? { ...row, status: "Confirmée" } : row));
    const { data: sessionData } = await supabase.auth.getSession();
    const emailResponse = sessionData.session ? await fetch(`/api/admin/reservations/${id}/confirmation`, { method: "POST", headers: { Authorization: `Bearer ${sessionData.session.access_token}` } }) : null;
    if (emailResponse && !emailResponse.ok) {
      const details = await emailResponse.json().catch(() => null);
      return setNotice(`Réservation confirmée, mais l'email Brevo n'a pas été envoyé : ${details?.error || "erreur inconnue"}`);
    }
    setNotice(`Réservation KP-${String(id).padStart(4, "0")} confirmée et email Brevo envoyé.`);
  }

  async function cancelReservation(id: number) {
    const { error } = await supabase.rpc("transition_kivuport_reservation", { p_reservation_id: id, p_to_status: "annule", p_reason: "admin_cancellation" });
    if (error) return setNotice(`L'annulation a échoué : ${error.message}`);
    setReservations((current) => current.map((row) => row.id === id ? { ...row, status: "Annulée" } : row));
    setNotice(`La réservation KP-${String(id).padStart(4, "0")} a été annulée.`);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  function openCreate(type: CreateType) {
    setCreateType(type);
    setForm({});
    setNotice("");
  }

  async function saveCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createType) return;
    setIsSaving(true);
    const payload: Record<string, string | number | null> = createType === "boat"
      ? { nom: form.nom, immatriculation: form.immatriculation, type: form.type || "mixte", capacite_totale: Number(form.capacite_totale), capacite_passager: Number(form.capacite_passager || 0), capacite_cargaison: Number(form.capacite_cargaison || 0) }
      : createType === "port"
        ? { nom: form.nom, localisation: form.localisation, ville: form.ville }
        : createType === "client"
          ? { nom: form.nom, prenom: form.prenom, email: form.email, telephone: form.telephone, date_inscription: new Date().toISOString() }
          : createType === "pavilion"
            ? { nom: form.nom, classe: form.classe, capacite_max: Number(form.capacite_max), unite: form.unite, prix_unitaire: Number(form.prix_unitaire), prix_tonne: Number(form.prix_tonne || 0), devise: form.devise || "FC", idbateau: Number(form.idbateau) }
            : { code_voyage: form.code_voyage, description: form.description || null, date_depart: new Date(form.date_depart).toISOString(), idbateau: Number(form.idbateau), statut: "prevu" };
    if (createType === "pavilion" && (Number(form.capacite_max) < 1 || Number(form.prix_unitaire) < 0 || Number(form.prix_tonne || 0) < 0 || !["FC", "USD"].includes(form.devise || "FC"))) { setIsSaving(false); return setNotice("Capacité, prix ou devise du pavillon invalide."); }
    if (createType === "pavilion" && Number(form.prix_unitaire) > 0) {
      const [boatResult, pavilionResult] = await Promise.all([
        supabase.from("bateaux").select("capacite_passager").eq("id", Number(form.idbateau)).single(),
        supabase.from("pavillons").select("capacite_max, prix_unitaire").eq("idbateau", Number(form.idbateau)),
      ]);
      const existingCapacity = (pavilionResult.data || []).filter((pavilion) => Number(pavilion.prix_unitaire) > 0).reduce((total, pavilion) => total + Number(pavilion.capacite_max || 0), 0);
      if (boatResult.error || pavilionResult.error || !boatResult.data) { setIsSaving(false); return setNotice("Le bateau sélectionné est introuvable ou inaccessible."); }
      if (existingCapacity + Number(form.capacite_max) > Number(boatResult.data.capacite_passager)) { setIsSaving(false); return setNotice("La capacité passager totale des pavillons dépasse celle du bateau."); }
    }
    const table: string = createType === "boat" ? "bateaux" : createType === "port" ? "ports" : createType === "client" ? "client" : createType === "pavilion" ? "pavillons" : "voyages";
    if (createType === "voyage" || createType === "pavilion") {
      const boatId = Number(form.idbateau);
      if (!Number.isInteger(boatId) || boatId < 1) { setIsSaving(false); return setNotice("Sélectionnez un bateau valide dans la liste."); }
      const { data: boat, error: boatError } = await supabase.from("bateaux").select("id").eq("id", boatId).maybeSingle();
      if (boatError || !boat) { setIsSaving(false); return setNotice("Le bateau sélectionné n'existe pas. Choisissez un ID de bateau valide."); }
    }
    const { error } = await supabase.from(table).insert(payload);
    setIsSaving(false);
    if (error) {
      setNotice(`La création a échoué : ${error.message}`);
      return;
    }
    setCreateType(null);
    setNotice("Enregistrement créé dans Supabase.");
    setReloadKey((key) => key + 1);
  }

  if (!isReady) return <main className="admin-loading"><Ship className="animate-pulse" size={28} /><p>Vérification des droits administrateur...</p></main>;

  const activeNavigation = navigation.find((item) => item.id === section);

  return (
    <main className="admin-shell">
      <aside className={`admin-sidebar${isSidebarOpen ? " is-open" : ""}`}>
        <div className="admin-brand"><span><Ship size={19} /></span><strong>KivuPort</strong><small>ADMIN</small></div>
        <div className="admin-sidebar-heading">Pilotage</div>
        <nav className="admin-nav" aria-label="Navigation administration">
          {navigation.map((item) => { const Icon = item.icon; return <button key={item.id} className={section === item.id ? "is-active" : ""} type="button" onClick={() => { setSection(item.id); setIsSidebarOpen(false); }}><Icon size={17} />{item.label}{item.id === "reservations" && pendingReservations > 0 && <b>{pendingReservations}</b>}</button>; })}
        </nav>
        <div className="admin-sidebar-bottom"><div className="admin-support"><LifeBuoy size={17} /><div><strong>Besoin d&apos;aide ?</strong><small>Contacter le support</small></div></div><button className="admin-logout" type="button" onClick={logout}><LogOut size={16} /> Déconnexion</button></div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar"><button className="admin-menu" type="button" aria-label="Ouvrir le menu" onClick={() => setIsSidebarOpen((open) => !open)}>{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</button><div className="admin-breadcrumb"><span>Administration</span><ChevronRight size={14} /><strong>{activeNavigation?.label}</strong></div><div className="admin-top-actions"><button type="button" aria-label="Actualiser les données" title="Actualiser" onClick={() => setReloadKey((key) => key + 1)}><RefreshCw size={17} /></button><button type="button" aria-label="Notifications" title="Notifications"><Bell size={18} /><i /></button><Link href="/dashboard" className="admin-profile"><span>AM</span><strong>Administrateur</strong></Link></div></header>
        <div className="admin-content">
          {section === "overview" && <Overview metrics={metrics} pendingReservations={pendingReservations} onNavigate={setSection} />}
          {section === "reservations" && <><AdminHeading eyebrow="Opérations · Supabase" title="Réservations" description="Données chargées directement depuis la table reservations." action={<button className="admin-primary" type="button" onClick={() => formatExport(filteredReservations)}><Download size={16} /> Exporter CSV</button>} /><div className="admin-toolbar"><div className="admin-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une réservation..." /></div><button className="admin-filter" type="button"><SlidersHorizontal size={16} /> Filtres</button></div><ReservationTable rows={filteredReservations} onConfirm={confirmReservation} onCancel={cancelReservation} notice={notice} /></>}
          {section === "payments" && <><AdminHeading eyebrow="Finance · Supabase" title="Paiements" description="Paiements chargés directement depuis la table paiements." action={<button className="admin-secondary" type="button"><Download size={16} /> Rapport financier</button>} /><div className="admin-stat-grid compact"><Stat label="Paiements reçus" value={`${adminRows.payments.length - metrics.pendingPayments}`} trend="Depuis la base" icon={Check} /><Stat label="En attente" value={String(metrics.pendingPayments)} trend="À traiter" icon={Activity} /><Stat label="Montant encaissé" value={metrics.revenue} trend="Paiements payés" icon={CircleDollarSign} /></div><DataTable headers={["Référence", "Mode", "Date", "Montant", "Statut"]} rows={adminRows.payments} /></>}
          {section === "fleet" && <><AdminHeading eyebrow="Opérations · Supabase" title="Flotte & voyages" description="Bateaux et départs publiés depuis Supabase." action={<div className="admin-heading-actions"><button className="admin-secondary" type="button" onClick={() => openCreate("voyage")}><Plus size={16} /> Publier un voyage</button><button className="admin-primary" type="button" onClick={() => openCreate("boat")}><Plus size={16} /> Ajouter un bateau</button></div>} /><DataTable headers={["Bateau", "Immatriculation", "Type", "Capacité", "Statut"]} rows={adminRows.fleet} /></>}
          {section === "pavilions" && <><AdminHeading eyebrow="Tarifs · Supabase" title="Pavillons" description="Capacités et tarifs rattachés aux bateaux." action={<button className="admin-primary" type="button" onClick={() => openCreate("pavilion")}><Plus size={16} /> Ajouter un pavillon</button>} /><DataTable headers={["Nom", "Bateau", "Classe", "Capacité", "Prix"]} rows={adminRows.pavilions} /></>}
          {section === "infrastructure" && <><AdminHeading eyebrow="Référentiel · Supabase" title="Ports & quais" description="Ports et quais chargés directement depuis Supabase." action={<button className="admin-primary" type="button" onClick={() => openCreate("port")}><Plus size={16} /> Ajouter un port</button>} /><DataTable headers={["Type", "Nom", "Détail", "Statut"]} rows={adminRows.infrastructure} /></>}
          {section === "people" && <><AdminHeading eyebrow="Utilisateurs · Supabase" title="Clients & équipe" description="Clients chargés directement depuis la table client." action={<button className="admin-primary" type="button" onClick={() => openCreate("client")}><Plus size={16} /> Ajouter un client</button>} /><DataTable headers={["Nom", "Email", "Téléphone", "Inscription", "Statut"]} rows={adminRows.people} /></>}
          {section === "settings" && <><AdminHeading eyebrow="Configuration" title="Paramètres" description="Configurez les règles opérationnelles de KivuPort." /><div className="settings-grid"><SettingsCard icon={Settings} title="Général" text="Nom du service, coordonnées et devise par défaut." /><SettingsCard icon={Bell} title="Notifications" text="Emails de réservation, paiement et alertes opérationnelles." /><SettingsCard icon={SlidersHorizontal} title="Sécurité" text="Sessions, vérification email et permissions d'équipe." /><SettingsCard icon={BarChart3} title="Apparence" text="Thème, marque et préférences de l'interface." /></div></>}
        </div>
      </section>
      {createType && <CreateModal type={createType} boats={boats} pavilionChoices={pavilionChoices} form={form} isSaving={isSaving} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onClose={() => setCreateType(null)} onSubmit={saveCreate} />}
    </main>
  );
}

function AdminHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <div className="admin-heading"><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{action}</div>; }
function Stat({ label, value, trend, icon: Icon }: { label: string; value: string; trend: string; icon: typeof Activity }) { return <div className="admin-card admin-stat"><span className="admin-icon"><Icon size={18} /></span><div><small>{label}</small><strong>{value}</strong><em>{trend}</em></div></div>; }
function Overview({ metrics, pendingReservations, onNavigate }: { metrics: AdminMetrics; pendingReservations: number; onNavigate: (section: Section) => void }) { return <><AdminHeading eyebrow={new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })} title="Bonjour, administrateur." description="Voici les données actuelles de votre base Supabase." action={<button className="admin-primary" type="button" onClick={() => onNavigate("reservations")}><Anchor size={16} /> Voir les opérations</button>} /><div className="admin-stat-grid"><Stat label="Réservations du jour" value={String(metrics.todayReservations)} trend="Base Supabase" icon={Anchor} /><Stat label="Chiffre d&apos;affaires" value={metrics.revenue} trend="Paiements confirmés" icon={CircleDollarSign} /><Stat label="Clients actifs" value={String(metrics.activeClients)} trend="Table client" icon={Users} /><Stat label="Voyages planifiés" value={String(metrics.plannedVoyages)} trend="Table voyages" icon={Ship} /></div><div className="admin-overview-grid"><div className="admin-card chart-card"><div className="card-heading"><div><small>Données réelles</small><h2>Activité enregistrée</h2></div><span className="admin-data-source">Supabase</span></div><div className="admin-live-summary"><strong>{reservationsSummary(metrics.todayReservations, pendingReservations)}</strong><span>réservations nécessitent une action ou ont été enregistrées aujourd&apos;hui.</span></div></div><div className="admin-card activity-card"><div className="card-heading"><div><small>À surveiller</small><h2>Actions rapides</h2></div><Activity size={18} /></div><button onClick={() => onNavigate("reservations")} type="button"><span className="quick-icon warning"><Anchor size={16} /></span><div><strong>{pendingReservations} réservation(s) en attente</strong><small>À traiter maintenant</small></div><ChevronRight size={16} /></button><button onClick={() => onNavigate("payments")} type="button"><span className="quick-icon"><CircleDollarSign size={16} /></span><div><strong>{metrics.pendingPayments} paiement(s) en attente</strong><small>Vérifier les encaissements</small></div><ChevronRight size={16} /></button><button onClick={() => onNavigate("fleet")} type="button"><span className="quick-icon"><Ship size={16} /></span><div><strong>{metrics.plannedVoyages} voyage(s) planifié(s)</strong><small>Voir les départs</small></div><ChevronRight size={16} /></button></div></div></>;
}
function reservationsSummary(today: number, pending: number) { return today + pending; }
function ReservationTable({ rows, onConfirm, onCancel, notice }: { rows: AdminReservation[]; onConfirm: (id: number) => void; onCancel: (id: number) => void; notice: string }) { return <div className="admin-card table-card">{notice && <p className="admin-notice"><Check size={15} /> {notice}</p>}<div className="table-scroll"><table><thead><tr><th>Référence</th><th>Client</th><th>Trajet</th><th>Date</th><th>Montant</th><th>Statut</th><th /></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.reference}</strong><small>{row.type}</small></td><td>{row.client}</td><td>{row.route}</td><td>{row.date}</td><td><strong>{row.amount}</strong></td><td><span className={`status status-${row.status.toLowerCase().replace("é", "e").replace(" ", "-")}`}>{row.status}</span></td><td>{row.status === "En attente" && <div className="table-actions"><button className="table-action" type="button" onClick={() => onConfirm(row.id)}>Confirmer</button><button className="table-action danger" type="button" onClick={() => onCancel(row.id)}>Annuler</button></div>}</td></tr>)}</tbody></table></div></div>; }
function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) { return <div className="admin-card table-card"><div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cellIndex === 0 ? <strong>{cell}</strong> : cellIndex === row.length - 1 ? <span className={`status status-${cell.toLowerCase().replace("é", "e")}`}>{cell}</span> : cell}</td>)}</tr>)}</tbody></table>{rows.length === 0 && <p className="admin-empty">Aucune donnée enregistrée dans cette table Supabase.</p>}</div></div>; }
function SettingsCard({ icon: Icon, title, text }: { icon: typeof Settings; title: string; text: string }) { return <button className="admin-card settings-card" type="button"><span className="admin-icon"><Icon size={18} /></span><div><strong>{title}</strong><p>{text}</p></div><ChevronRight size={17} /></button>; }
function CreateModal({ type, boats, pavilionChoices, form, isSaving, onChange, onClose, onSubmit }: { type: CreateType; boats: { id: number; nom: string }[]; pavilionChoices: { names: string[]; classes: string[]; units: string[]; capacities: string[]; prices: string[]; currencies: string[] }; form: Record<string, string>; isSaving: boolean; onChange: (key: string, value: string) => void; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const title = type === "boat" ? "Ajouter un bateau" : type === "port" ? "Ajouter un port" : type === "client" ? "Ajouter un client" : type === "pavilion" ? "Ajouter un pavillon" : "Publier un voyage";
  const subtitle = type === "boat" ? "Configurez une nouvelle unité de la flotte." : type === "port" ? "Ajoutez une escale au réseau KivuPort." : type === "client" ? "Enregistrez un nouveau profil client." : type === "pavilion" ? "Définissez une capacité et un tarif précis." : "Rendez un départ disponible pour vos clients.";
  const Icon = type === "boat" ? Ship : type === "port" ? Building2 : type === "client" ? UserRound : type === "pavilion" ? Ticket : CalendarDays;
  const fields = type === "boat" ? [["nom", "Nom du bateau", "text"], ["immatriculation", "Immatriculation", "text"], ["type", "Type (cargo, mixte, passager)", "text"], ["capacite_totale", "Capacité totale", "number"], ["capacite_passager", "Capacité passagers", "number"], ["capacite_cargaison", "Capacité cargaison", "number"]] : type === "port" ? [["nom", "Nom du port", "text"], ["localisation", "Localisation", "text"], ["ville", "Ville", "text"]] : type === "client" ? [["nom", "Nom", "text"], ["prenom", "Prénom", "text"], ["email", "Email", "email"], ["telephone", "Téléphone", "tel"]] : type === "pavilion" ? [["nom", "Nom", "select"], ["classe", "Classe", "select"], ["capacite_max", "Capacité maximale", "select"], ["unite", "Unité", "select"], ["prix_unitaire", "Prix unitaire", "select"], ["prix_tonne", "Prix par tonne", "select"], ["devise", "Devise (FC ou USD)", "select"], ["idbateau", "Bateau", "select"]] : [["code_voyage", "Code du voyage", "text"], ["description", "Description", "text"], ["date_depart", "Date et heure de départ", "datetime-local"], ["idbateau", "ID du bateau", "number"]];
  const optionsFor = (key: string) => key === "nom" ? pavilionChoices.names : key === "classe" ? pavilionChoices.classes : key === "unite" ? pavilionChoices.units : key === "capacite_max" ? pavilionChoices.capacities : key === "prix_unitaire" || key === "prix_tonne" ? pavilionChoices.prices : key === "devise" ? pavilionChoices.currencies : boats.map((boat) => String(boat.id));
  return <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="admin-modal admin-create-modal" role="dialog" aria-modal="true" aria-labelledby="create-modal-title"><aside className="admin-modal-hero"><div className="admin-modal-orbit orbit-a" /><div className="admin-modal-orbit orbit-b" /><span className="admin-modal-icon"><Icon size={30} /></span><p>Nouvelle entrée</p><strong>KivuPort<br />Operations</strong><small>Les données seront enregistrées dans Supabase.</small></aside><div className="admin-modal-body"><button className="modal-close" type="button" onClick={onClose} aria-label="Fermer"><X size={18} /></button><p className="modal-kicker">Administration · Supabase</p><h2 id="create-modal-title">{title}</h2><p className="admin-modal-subtitle">{subtitle}</p><form className="admin-create-form" onSubmit={onSubmit}>{fields.map(([key, label, inputType], index) => <label className={`modal-field-${index}`} key={key}><span>{label}</span>{type === "pavilion" && inputType === "select" ? <select value={form[key] || ""} onChange={(event) => onChange(key, event.target.value)} required><option value="">Choisir {label.toLowerCase()}</option>{optionsFor(key).map((option) => <option value={option} key={option}>{key === "idbateau" ? boats.find((boat) => String(boat.id) === option)?.nom || `Bateau ${option}` : option}</option>)}</select> : <input type={inputType} value={form[key] || ""} onChange={(event) => onChange(key, event.target.value)} required />}</label>)}<button className="admin-primary admin-modal-submit" type="submit" disabled={isSaving}><Icon size={16} />{isSaving ? "Enregistrement..." : "Créer l'enregistrement"}</button></form></div></section></div>;
}