import { useState } from "react";
import { CalendarDays, DoorOpen, TriangleAlert, Users } from "lucide-react";
import type { Booking, Data } from "../types";
import { supabase } from "../lib/supabaseClient";
export function Summary({
  icon,
  tone,
  value,
  label,
}: {
  icon: React.ReactNode;
  tone: string;
  value: number;
  label: string;
}) {
  return (
    <div>
      <span className={`summary-icon ${tone}`}>{icon}</span>
      <div>
        <b>{value}</b>
        <span>{label}</span>
      </div>
    </div>
  );
}
export function LoginScreen({ error }: { error: string }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(error),
    [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setMessage("E-mail ou senha inválidos.");
    setLoading(false);
  };
  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark">P</div>
        <span className="detail-kicker">SECRETARIA PAROQUIAL</span>
        <h1>Agenda de Espaços</h1>
        <p>Entre para acessar as reservas da PNSG.</p>
        <label>
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {message && <div className="form-error">{message}</div>}
        <button className="new-button" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
export function Dashboard({
  data,
  pending,
  select,
}: {
  data: Data;
  pending: number;
  select: (b: Booking) => void;
}) {
  const list = data.reservations
    .filter((b) => b.status !== "cancelled")
    .sort((a, b) =>
      `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
    );
  return (
    <div className="dashboard">
      <section className="metric-grid">
        <Metric
          icon={<CalendarDays />}
          label="Total de reservas"
          value={list.length}
        />
        <Metric
          icon={<DoorOpen />}
          label="Espaços cadastrados"
          value={data.spaces.length}
        />
        <Metric
          icon={<TriangleAlert />}
          label="Com pendências"
          value={pending}
        />
        <Metric
          icon={<Users />}
          label="Reservas recorrentes"
          value={list.filter((b) => b.seriesId).length}
        />
      </section>
      <section className="panel">
        <div className="panel-title">
          <h2>Próximas reservas</h2>
          <p>Programação cadastrada na secretaria</p>
        </div>
        {list.slice(0, 8).map((b) => (
          <button className="list-item" key={b.id} onClick={() => select(b)}>
            <span className="date-chip">
              <b>{new Date(`${b.date}T12:00:00`).getDate()}</b>
              {new Date(`${b.date}T12:00:00`)
                .toLocaleDateString("pt-BR", { month: "short" })
                .replace(".", "")}
            </span>
            <div>
              <b>{b.title}</b>
              <span>
                {data.spaces.find((s) => s.id === b.spaceId)?.name} ·{" "}
                {b.startTime}–{b.endTime}
              </span>
            </div>
            <em>{b.responsible || "Responsável pendente"}</em>
          </button>
        ))}
      </section>
    </div>
  );
}
function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article>
      {icon}
      <span>{label}</span>
      <b>{value}</b>
    </article>
  );
}
