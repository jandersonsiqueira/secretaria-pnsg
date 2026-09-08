import { useState } from "react";
import { Pencil, TriangleAlert, X } from "lucide-react";
import type { Booking, Data, Space } from "../types";
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = new Date();
today.setHours(0, 0, 0, 0);
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};
export function Detail({
  booking,
  space,
  close,
  edit,
  cancel,
}: {
  booking: Booking;
  space?: Space;
  close: () => void;
  edit: () => void;
  cancel: () => void;
}) {
  return (
    <div className="dialog-backdrop">
      <div className="detail-dialog">
        <button className="dialog-close" onClick={close}>
          <X />
        </button>
        <span className="detail-kicker">DETALHES DA RESERVA</span>
        <i className="detail-dot" style={{ background: space?.color }} />
        <h2>{booking.title}</h2>
        <span className={`status ${booking.status}`}>
          {booking.status === "confirmed" ? "Confirmada" : "Pendente"}
        </span>
        <div className="detail-grid">
          <DetailItem
            label="Data"
            value={new Date(`${booking.date}T12:00:00`).toLocaleDateString(
              "pt-BR",
            )}
          />
          <DetailItem
            label="Horário"
            value={`${booking.startTime} – ${booking.endTime}`}
          />
          <DetailItem label="Espaço" value={space?.name || ""} />
          <DetailItem
            label="Responsável"
            value={booking.responsible || "Não informado"}
          />
          <DetailItem
            label="Contato"
            value={booking.phone || "Não informado"}
          />
          <DetailItem label="PMSC" value={booking.pmsc || "Não informado"} />
        </div>
        {booking.seriesId && (
          <p className="series-note">
            Esta reserva faz parte de uma série recorrente.
          </p>
        )}
        <div className="detail-actions">
          <button className="edit-button" onClick={edit}>
            <Pencil /> Editar reserva
          </button>
          <button className="danger-button" onClick={cancel}>
            <TriangleAlert /> Cancelar reserva
          </button>
        </div>
      </div>
    </div>
  );
}
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <span>
      {label}
      <b>{value}</b>
    </span>
  );
}
export function ReservationForm({
  data,
  date,
  booking,
  spaceId,
  close,
  save,
}: {
  data: Data;
  date: string;
  booking: Booking | null;
  spaceId: number | null;
  close: () => void;
  save: (b: Booking) => Promise<string>;
}) {
  const [f, setF] = useState<Booking>(
      booking || {
        id: Date.now(),
        spaceId: spaceId ?? 0,
        date,
        startTime: "",
        endTime: "",
        title: "",
        responsible: "",
        phone: "",
        pmsc: "",
        status: "confirmed",
        recurrence: "none",
      },
    ),
    [error, setError] = useState("");
  const set = (k: keyof Booking, v: string | number) => setF({ ...f, [k]: v });
  const invalidTime = Boolean(
    f.startTime && f.endTime && f.endTime <= f.startTime,
  );
  const submit = async () => {
    const e = await save(f);
    if (e) setError(e);
  };
  return (
    <div className="dialog-backdrop">
      <div className="form-dialog">
        <div className="dialog-heading">
          <div>
            <span className="detail-kicker">
              {booking ? "ALTERAR AGENDA" : "NOVA AGENDA"}
            </span>
            <h2>{booking ? "Editar reserva" : "Nova reserva"}</h2>
          </div>
          <button className="dialog-close" onClick={close}>
            <X />
          </button>
        </div>
        <div className="form-grid">
          <label className="wide">
            Evento
            <input
              autoFocus
              value={f.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex.: Reunião da Pastoral Familiar"
            />
          </label>
          <label>
            Espaço
            <select
              value={f.spaceId}
              onChange={(e) => set("spaceId", +e.target.value)}
            >
              <option value={0} disabled>
                Selecione um espaço
              </option>
              {data.spaces.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Data
            <input
              type="date"
              min={iso(today)}
              value={f.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </label>
          <label>
            Início
            <input
              type="time"
              max={f.endTime || undefined}
              value={f.startTime}
              onChange={(e) => set("startTime", e.target.value)}
            />
          </label>
          <label>
            Fim
            <input
              type="time"
              min={f.startTime || undefined}
              value={f.endTime}
              onChange={(e) => set("endTime", e.target.value)}
            />
          </label>
          <label>
            Responsável
            <input
              value={f.responsible}
              onChange={(e) => set("responsible", e.target.value)}
              placeholder="Nome completo"
            />
          </label>
          <label>
            Telefone / WhatsApp
            <input
              type="tel"
              inputMode="numeric"
              value={f.phone}
              onChange={(e) => set("phone", formatPhone(e.target.value))}
              placeholder="(85) 99999-9999"
            />
          </label>
          <label>
            PMSC
            <input
              value={f.pmsc}
              onChange={(e) => set("pmsc", e.target.value)}
              placeholder="Digite a pastoral ou grupo"
            />
          </label>
          <label>
            Recorrência
            <select
              value={f.recurrence}
              onChange={(e) =>
                set("recurrence", e.target.value as Booking["recurrence"])
              }
            >
              <option value="none">Não se repete</option>
              <option value="weekly">Toda semana</option>
              <option value="monthly">Todo mês</option>
            </select>
          </label>
          {f.recurrence !== "none" && (
            <label>
              Termina em
              <input
                type="date"
                min={f.date}
                value={f.recurrenceEnd || ""}
                onChange={(e) => set("recurrenceEnd", e.target.value)}
              />
            </label>
          )}
          {f.recurrence === "monthly" && (
            <label>
              Regra mensal
              <select
                value={f.monthlyMode || "day"}
                onChange={(e) =>
                  set("monthlyMode", e.target.value as "day" | "nth")
                }
              >
                <option value="day">
                  Mesmo dia do mês ({new Date(`${f.date}T12:00:00`).getDate()})
                </option>
                <option value="nth">Semana do mês</option>
              </select>
            </label>
          )}
          {f.recurrence === "monthly" && f.monthlyMode === "nth" && (
            <>
              <label>
                Semana
                <select
                  value={f.monthlyWeek || 1}
                  onChange={(e) => set("monthlyWeek", +e.target.value)}
                >
                  <option value="1">1ª</option>
                  <option value="2">2ª</option>
                  <option value="3">3ª</option>
                  <option value="4">4ª</option>
                  <option value="5">5ª</option>
                </select>
              </label>
              <label>
                Dia da semana
                <select
                  value={
                    f.monthlyWeekday ?? new Date(`${f.date}T12:00:00`).getDay()
                  }
                  onChange={(e) => set("monthlyWeekday", +e.target.value)}
                >
                  <option value="0">Domingo</option>
                  <option value="1">Segunda</option>
                  <option value="2">Terça</option>
                  <option value="3">Quarta</option>
                  <option value="4">Quinta</option>
                  <option value="5">Sexta</option>
                  <option value="6">Sábado</option>
                </select>
              </label>
            </>
          )}
          {error && (
            <div className="form-error wide">
              <TriangleAlert />
              {error}
            </div>
          )}
          {invalidTime && (
            <div className="form-error wide">
              <TriangleAlert />O horário final precisa ser maior que o horário
              inicial.
            </div>
          )}
        </div>
        <div className="form-actions">
          <button className="outline" onClick={close}>
            Cancelar
          </button>
          <button
            className="new-button"
            disabled={invalidTime}
            onClick={submit}
          >
            Confirmar reserva
          </button>
        </div>
      </div>
    </div>
  );
}
export function SpaceForm({
  space,
  close,
  save,
}: {
  space: Space | null;
  close: () => void;
  save: (s: Space) => Promise<void>;
}) {
  const [s, setS] = useState<Space>(
    space || {
      id: Date.now(),
      name: "",
      capacity: 0,
      color: "#4b8b84",
      active: true,
      availableFrom: "07:00",
      availableTo: "22:00",
      location: "",
    },
  );
  const set = (k: keyof Space, v: string | number | boolean) =>
    setS({ ...s, [k]: v });
  return (
    <div className="dialog-backdrop">
      <div className="form-dialog">
        <div className="dialog-heading">
          <div>
            <span className="detail-kicker">
              {space ? "ALTERAR CADASTRO" : "CADASTRO"}
            </span>
            <h2>{space ? "Editar espaço" : "Novo espaço"}</h2>
          </div>
          <button className="dialog-close" onClick={close}>
            <X />
          </button>
        </div>
        <div className="form-grid">
          <label className="wide">
            Nome
            <input
              autoFocus
              value={s.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ex.: Sala 15"
            />
          </label>
          <label>
            Capacidade
            <input
              type="number"
              min="0"
              value={s.capacity || ""}
              onChange={(e) => set("capacity", +e.target.value)}
            />
          </label>
          <label>
            Localização
            <input
              value={s.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Ex.: Casa Pastoral"
            />
          </label>
          <label>
            Disponível de
            <input
              type="time"
              value={s.availableFrom}
              onChange={(e) => set("availableFrom", e.target.value)}
            />
          </label>
          <label>
            Até
            <input
              type="time"
              value={s.availableTo}
              onChange={(e) => set("availableTo", e.target.value)}
            />
          </label>
        </div>
        <div className="form-actions">
          <button className="outline" onClick={close}>
            Cancelar
          </button>
          <button
            className="new-button"
            disabled={!s.name || s.availableFrom >= s.availableTo}
            onClick={() => save(s)}
          >
            {space ? "Salvar alterações" : "Salvar espaço"}
          </button>
        </div>
      </div>
    </div>
  );
}
