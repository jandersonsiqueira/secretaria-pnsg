import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { jsPDF } from "jspdf";
import type { Session } from "@supabase/supabase-js";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DoorOpen,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings2,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { Day, Week } from "./components/CalendarViews";
import { Dashboard, LoginScreen, Summary } from "./components/Dashboard";
import {
  Detail,
  ReservationForm,
  SpaceForm,
} from "./components/ReservationDialogs";
import { SpacesView } from "./components/SpacesView";
import type { Booking, Data, Space } from "./types";
import "./styles.css";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = new Date();
today.setHours(0, 0, 0, 0);
const add = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const weekStart = (d: Date) => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  x.setHours(12, 0, 0, 0);
  return x;
};
const daysOf = (d: Date) =>
  Array.from({ length: 7 }, (_, i) => add(weekStart(d), i));
const label = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(d)
    .replace(".", "");
const brasiliaNow = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value || "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
};
const emptyData: Data = { spaces: [], reservations: [] };

const spaceFromDb = (r: any): Space => ({
  id: r.id,
  name: r.name,
  capacity: r.capacity ?? 0,
  color: r.color ?? "#4b8b84",
  active: r.active ?? true,
  availableFrom: String(r.available_from ?? "07:00").slice(0, 5),
  availableTo: String(r.available_to ?? "22:00").slice(0, 5),
  location: r.location ?? "",
});
const bookingFromDb = (r: any): Booking => ({
  id: r.id,
  seriesId: r.series_id ?? undefined,
  date: r.date,
  spaceId: r.space_id,
  startTime: String(r.start_time).slice(0, 5),
  endTime: String(r.end_time).slice(0, 5),
  title: r.title,
  responsible: r.responsible ?? "",
  phone: r.phone ?? "",
  pmsc: r.pmsc ?? "",
  status: r.status,
  recurrence: r.recurrence ?? "none",
  recurrenceEnd: r.recurrence_end ?? undefined,
  monthlyMode: r.monthly_mode ?? undefined,
  monthlyDay: r.monthly_day ?? undefined,
  monthlyWeek: r.monthly_week ?? undefined,
  monthlyWeekday: r.monthly_weekday ?? undefined,
});
const spaceToDb = (s: Space) => ({
  id: s.id,
  name: s.name,
  capacity: s.capacity,
  color: s.color,
  active: s.active,
  available_from: s.availableFrom,
  available_to: s.availableTo,
  location: s.location,
});
const bookingToDb = (b: Booking) => ({
  date: b.date,
  space_id: b.spaceId,
  start_time: b.startTime,
  end_time: b.endTime,
  title: b.title,
  responsible: b.responsible,
  phone: b.phone,
  pmsc: b.pmsc,
  status: b.status,
  series_id: b.seriesId ?? null,
  recurrence: b.recurrence ?? "none",
  recurrence_end: b.recurrenceEnd || null,
  monthly_mode: b.monthlyMode || null,
  monthly_day: b.monthlyDay || null,
  monthly_week: b.monthlyWeek || null,
  monthly_weekday: b.monthlyWeekday ?? null,
});
const overlaps = (a: Booking, b: Booking) =>
  a.spaceId === b.spaceId &&
  a.date === b.date &&
  a.startTime < b.endTime &&
  a.endTime > b.startTime;
function nthDate(year: number, month: number, week: number, weekday: number) {
  const first = new Date(year, month, 1);
  const day = 1 + ((weekday - first.getDay() + 7) % 7) + (week - 1) * 7;
  return day <= new Date(year, month + 1, 0).getDate()
    ? new Date(year, month, day)
    : null;
}
function occurrenceDates(f: Booking) {
  const first = new Date(`${f.date}T12:00:00`),
    limit = new Date(`${f.recurrenceEnd || f.date}T12:00:00`),
    out: Date[] = [];
  const baseDay = first.getDate(),
    baseWeekday = first.getDay();
  let d = new Date(first);
  while (d <= limit) {
    if (!f.recurrence || f.recurrence === "none") {
      out.push(first);
      break;
    }
    if (f.recurrence === "weekly") {
      out.push(new Date(d));
      d = add(d, 7);
    } else {
      const month =
        d.getTime() === first.getTime()
          ? first
          : f.monthlyMode === "nth"
            ? nthDate(
                d.getFullYear(),
                d.getMonth(),
                f.monthlyWeek || 1,
                f.monthlyWeekday ?? baseWeekday,
              )
            : new Date(
                d.getFullYear(),
                d.getMonth(),
                Math.min(
                  f.monthlyDay || baseDay,
                  new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
                ),
              );
      if (month && month >= first && month <= limit) out.push(month);
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  }
  return out;
}

function exportReport(bookings: Booking[], data: Data, period: string) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const widths = [22, 25, 37, 58, 40, 47, 31],
    total = widths.reduce((a, b) => a + b, 0),
    x0 = 14;
  pdf.setFillColor(13, 63, 57);
  pdf.rect(0, 0, 297, 28, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(17);
  pdf.text("Agenda de Espaços — PNSG", 14, 12);
  pdf.setFontSize(9);
  pdf.text(`Relatório ${period} · Secretaria Paroquial`, 14, 20);
  pdf.setTextColor(35, 60, 57);
  pdf.setFontSize(11);
  pdf.text(
    `${bookings.length} reserva${bookings.length === 1 ? "" : "s"}`,
    14,
    39,
  );
  const headers = [
    "Data",
    "Horário",
    "Espaço",
    "Evento",
    "Responsável",
    "Telefone / WhatsApp",
    "PMSC",
  ];
  let y = 48;
  const drawHeader = () => {
    pdf.setFillColor(231, 240, 237);
    pdf.rect(x0, y - 6, total, 9, "F");
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    let x = x0;
    headers.forEach((h, i) => {
      pdf.text(h, x + 2, y);
      x += widths[i];
    });
    pdf.setFont("helvetica", "normal");
    y += 10;
  };
  drawHeader();
  bookings
    .slice()
    .sort((a, b) =>
      `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
    )
    .forEach((b) => {
      const values = [
        new Date(`${b.date}T12:00:00`).toLocaleDateString("pt-BR"),
        `${b.startTime}–${b.endTime}`,
        data.spaces.find((s) => s.id === b.spaceId)?.name || "",
        b.title,
        b.responsible || "—",
        b.phone || "—",
        b.pmsc || "—",
      ];
      const wrapped: string[][] = values.map(
        (v, i) => pdf.splitTextToSize(String(v), widths[i] - 4) as string[],
      );
      const lineHeight = 4.2;
      const remaining = wrapped.map((lines) => [...lines]);

      while (remaining.some((lines) => lines.length > 0)) {
        const availableLines = Math.max(
          1,
          Math.floor((190 - y - 4) / lineHeight),
        );
        const chunk = remaining.map((lines) => lines.slice(0, availableLines));
        const rowHeight = Math.max(
          9,
          Math.max(...chunk.map((lines) => lines.length)) * lineHeight + 4,
        );

        if (y + rowHeight > 190) {
          pdf.addPage("a4", "landscape");
          y = 18;
          drawHeader();
          continue;
        }

        if (Math.round(y / 10) % 2 === 0) {
          pdf.setFillColor(248, 251, 250);
          pdf.rect(x0, y - 6, total, rowHeight, "F");
        }
        let x = x0;
        chunk.forEach((lines, i) => {
          lines.forEach((line, lineIndex) => {
            pdf.text(line, x + 2, y + lineIndex * lineHeight);
          });
          remaining[i].splice(0, lines.length);
          x += widths[i];
        });
        y += rowHeight;
      }
    });
  pdf.setTextColor(110, 125, 120);
  pdf.setFontSize(8);
  pdf.text("Gerado localmente pela Agenda PNSG", 14, 204);
  pdf.save(`agenda-pnsg-${period.toLowerCase().replace(/ /g, "-")}.pdf`);
}

function App() {
  const [data, setData] = useState<Data>(emptyData),
    [session, setSession] = useState<Session | null>(null),
    [authLoading, setAuthLoading] = useState(true),
    [authError, setAuthError] = useState(""),
    [view, setView] = useState<"week" | "list" | "spaces">("week"),
    [mode, setMode] = useState<"day" | "week">("week"),
    [date, setDate] = useState(today),
    [room, setRoom] = useState("all"),
    [search, setSearch] = useState(""),
    [formOpen, setFormOpen] = useState(false),
    [formSpaceId, setFormSpaceId] = useState<number | null>(null),
    [spaceOpen, setSpaceOpen] = useState(false),
    [editingSpace, setEditingSpace] = useState<Space | null>(null),
    [formBooking, setFormBooking] = useState<Booking | null>(null),
    [selected, setSelected] = useState<Booking | null>(null),
    [mobile, setMobile] = useState(false);
  const loadData = async () => {
    const [spacesResult, reservationsResult] = await Promise.all([
      supabase.from("spaces").select("*").order("name"),
      supabase
        .from("reservations")
        .select("*")
        .order("date")
        .order("start_time"),
    ]);
    if (spacesResult.error || reservationsResult.error)
      setAuthError(
        spacesResult.error?.message ||
          reservationsResult.error?.message ||
          "Não foi possível carregar os dados.",
      );
    else
      setData({
        spaces: (spacesResult.data || []).map(spaceFromDb),
        reservations: (reservationsResult.data || []).map(bookingFromDb),
      });
  };
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) void loadData();
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        setSession(next);
        if (next) void loadData();
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);
  const days = daysOf(date),
    start = iso(days[0]),
    end = iso(days[6]);
  const bookings = useMemo(
    () =>
      data.reservations.filter(
        (b) =>
          b.status !== "cancelled" &&
          b.date >= start &&
          b.date <= end &&
          (room === "all" || b.spaceId === +room) &&
          `${b.title} ${b.responsible} ${b.pmsc}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [data, start, end, room, search],
  );
  const pending = data.reservations.filter(
    (b) => b.status !== "cancelled" && (!b.responsible || !b.phone),
  ).length;
  const now = brasiliaNow();
  const spacesInUseNow = new Set(
    data.reservations
      .filter(
        (b) =>
          b.status !== "cancelled" &&
          b.date === now.date &&
          b.startTime <= now.time &&
          b.endTime > now.time,
      )
      .map((b) => b.spaceId),
  ).size;
  const saveSpace = async (s: Space) => {
    const result = await supabase.from("spaces").upsert(spaceToDb(s));
    if (result.error) {
      setAuthError(result.error.message);
      return;
    }
    await loadData();
    setSpaceOpen(false);
    setEditingSpace(null);
  };
  const save = async (f: Booking) => {
    if (!f.spaceId) return "Selecione um espaço.";
    if (!f.title) return "Informe o nome do evento.";
    if (!f.responsible) return "Informe o responsável.";
    if (!f.startTime || !f.endTime)
      return "Informe os horários inicial e final.";
    if (f.date < iso(today))
      return "A data inicial não pode ser anterior a hoje.";
    const editing = data.reservations.some((x) => x.id === f.id),
      seriesId =
        f.seriesId ||
        (f.recurrence && f.recurrence !== "none"
          ? crypto.randomUUID()
          : undefined),
      excluded = editing
        ? data.reservations.filter(
            (x) => x.seriesId === seriesId || x.id === f.id,
          )
        : data.reservations,
      dates = occurrenceDates(f),
      generated = dates.map((d, i) => ({
        ...f,
        id: editing && i === 0 ? f.id : Date.now() + i,
        seriesId: dates.length > 1 ? seriesId : undefined,
        date: iso(d),
      }));
    const conflict = generated.find((x) =>
      excluded.some(
        (old) =>
          old.status !== "cancelled" && old.id !== x.id && overlaps(x, old),
      ),
    );
    if (conflict)
      return `Conflito de agenda em ${new Date(`${conflict.date}T12:00:00`).toLocaleDateString("pt-BR")}.`;
    if (editing) {
      const removed = f.seriesId
        ? await supabase
            .from("reservations")
            .delete()
            .eq("series_id", f.seriesId)
        : await supabase.from("reservations").delete().eq("id", f.id);
      if (removed.error) return removed.error.message;
    }
    const inserted = await supabase
      .from("reservations")
      .insert(generated.map(bookingToDb));
    if (inserted.error) return inserted.error.message;
    await loadData();
    setFormOpen(false);
    setFormBooking(null);
    return "";
  };
  const cancel = async () => {
    if (!selected || !confirm("Cancelar esta reserva?")) return;
    const result = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", selected.id);
    if (result.error) setAuthError(result.error.message);
    else {
      await loadData();
      setSelected(null);
    }
  };
  if (authLoading)
    return <div className="auth-loading">Carregando acesso…</div>;
  if (!session) return <LoginScreen error={authError} />;
  return (
    <div className="app-shell">
      <aside className={mobile ? "mobile-open" : ""}>
        <div className="brand">
          <div className="brand-mark">P</div>
          <div>
            <strong>Agenda PNSG</strong>
            <span>Secretaria Paroquial</span>
          </div>
          <button className="close-nav" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>
        <nav>
          <button
            className={view === "week" ? "active" : ""}
            onClick={() => {
              setView("week");
              setMobile(false);
            }}
          >
            <CalendarDays /> Agenda
          </button>
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => {
              setView("list");
              setMobile(false);
            }}
          >
            <LayoutDashboard /> Visão geral
          </button>
          <button
            className={view === "spaces" ? "active" : ""}
            onClick={() => {
              setView("spaces");
              setMobile(false);
            }}
          >
            <DoorOpen /> Espaços
          </button>
        </nav>
        <div className="sidebar-note">
          <Clock3 />
          <div>
            <b>Atendimento</b>
            <span>Seg a sáb · 07h às 22h</span>
          </div>
        </div>
        <div className="profile">
          <div className="avatar">SP</div>
          <div>
            <b>Secretaria PNSG</b>
            <span>Modo local</span>
          </div>
          <button
            className="signout-button"
            onClick={() => supabase.auth.signOut()}
            title="Sair"
          >
            <Settings2 />
          </button>
        </div>
      </aside>
      <main>
        <header>
          <button className="menu-btn" onClick={() => setMobile(true)}>
            <Menu />
          </button>
          <div>
            <h1>
              {view === "spaces"
                ? "Espaços"
                : view === "list"
                  ? "Visão geral"
                  : "Agenda de espaços"}
            </h1>
            <p>
              {view === "week"
                ? "Reservas e disponibilidade da paróquia"
                : "Gestão interna da Secretaria PNSG"}
            </p>
          </div>
          <button
            className="new-button"
            onClick={() => {
              setFormBooking(null);
              setFormSpaceId(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Nova reserva
          </button>
        </header>
        {authError && (
          <div className="error-banner">
            <TriangleAlert />
            {authError}
            <button className="icon-button" onClick={() => setAuthError("")}>
              <X />
            </button>
          </div>
        )}
        {view === "week" && (
          <>
            <section className="toolbar">
              <div className="date-nav">
                <button
                  className="outline"
                  onClick={() =>
                    setDate((d) => add(d, mode === "week" ? -7 : -1))
                  }
                >
                  <ChevronLeft />
                </button>
                <button className="period" onClick={() => setDate(today)}>
                  <CalendarDays />
                  {mode === "week"
                    ? `${label(days[0])} — ${label(days[6])}`
                    : label(date)}
                </button>
                <button
                  className="outline"
                  onClick={() =>
                    setDate((d) => add(d, mode === "week" ? 7 : 1))
                  }
                >
                  <ChevronRight />
                </button>
                <div className="view-switch">
                  <button
                    className={mode === "day" ? "active" : ""}
                    onClick={() => setMode("day")}
                  >
                    Dia
                  </button>
                  <button
                    className={mode === "week" ? "active" : ""}
                    onClick={() => setMode("week")}
                  >
                    Semana
                  </button>
                </div>
              </div>
              <div className="filters">
                <div className="search">
                  <Search />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar evento ou responsável"
                  />
                </div>
                <select value={room} onChange={(e) => setRoom(e.target.value)}>
                  <option value="all">Todos os espaços</option>
                  {data.spaces.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  className="report-button"
                  onClick={() =>
                    exportReport(
                      mode === "day"
                        ? bookings.filter((b) => b.date === iso(date))
                        : bookings,
                      data,
                      mode === "week" ? "da semana" : "do dia",
                    )
                  }
                >
                  Gerar PDF
                </button>
              </div>
            </section>
            <section className="week-summary">
              <Summary
                icon={<CalendarDays />}
                tone="blue"
                value={
                  mode === "day"
                    ? bookings.filter((b) => b.date === iso(date)).length
                    : bookings.length
                }
                label={
                  mode === "day" ? "reservas no dia" : "reservas na semana"
                }
              />
              <Summary
                icon={<DoorOpen />}
                tone="green"
                value={spacesInUseNow}
                label="espaços em uso agora"
              />
              <Summary
                icon={<TriangleAlert />}
                tone="amber"
                value={pending}
                label="cadastros pendentes"
              />
            </section>
            {mode === "week" ? (
              <Week
                days={days}
                data={data}
                room={room}
                bookings={bookings}
                select={setSelected}
                open={(d, spaceId) => {
                  setDate(d);
                  setFormBooking(null);
                  setFormSpaceId(spaceId);
                  setFormOpen(true);
                }}
              />
            ) : (
              <Day
                date={date}
                data={data}
                room={room}
                search={search}
                select={setSelected}
                open={(spaceId) => {
                  setFormBooking(null);
                  setFormSpaceId(spaceId);
                  setFormOpen(true);
                }}
              />
            )}
          </>
        )}
        {view === "list" && (
          <Dashboard data={data} pending={pending} select={setSelected} />
        )}
        {view === "spaces" && (
          <SpacesView
            data={data}
            newSpace={() => {
              setEditingSpace(null);
              setSpaceOpen(true);
            }}
            onEdit={(space) => {
              setEditingSpace(space);
              setSpaceOpen(true);
            }}
            onDelete={async (space) => {
              if (!confirm(`Excluir ${space.name}?`)) return;
              const result = await supabase
                .from("spaces")
                .delete()
                .eq("id", space.id);
              if (result.error)
                setAuthError(
                  "Não foi possível excluir. Verifique se existem reservas vinculadas a este espaço.",
                );
              else await loadData();
            }}
          />
        )}
      </main>
      {selected && (
        <Detail
          booking={selected}
          space={data.spaces.find((s) => s.id === selected.spaceId)}
          close={() => setSelected(null)}
          edit={() => {
            setFormBooking(selected);
            setSelected(null);
            setFormOpen(true);
          }}
          cancel={cancel}
        />
      )}
      {formOpen && (
        <ReservationForm
          data={data}
          date={iso(date)}
          booking={formBooking}
          spaceId={formSpaceId}
          close={() => {
            setFormOpen(false);
            setFormBooking(null);
          }}
          save={save}
        />
      )}
      {spaceOpen && (
        <SpaceForm
          space={editingSpace}
          close={() => {
            setSpaceOpen(false);
            setEditingSpace(null);
          }}
          save={saveSpace}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
