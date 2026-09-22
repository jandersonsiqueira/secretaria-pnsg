import { CalendarDays, Plus, TriangleAlert } from "lucide-react";
import type { Booking, Data } from "../types";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = new Date();
today.setHours(0, 0, 0, 0);
const isPast = (b: Booking) => {
  const now = new Date();
  const date = iso(now);
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return b.date < date || (b.date === date && b.endTime <= time);
};

export function Month({
  date,
  data,
  room,
  bookings,
  filtered,
  select,
  showDay,
  open,
}: {
  date: Date;
  data: Data;
  room: string;
  bookings: Booking[];
  filtered: boolean;
  select: (b: Booking) => void;
  showDay: (d: Date) => void;
  open: (d: Date) => void;
}) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const dayCount = new Date(year, month + 1, 0).getDate();
  const days = Array.from(
    { length: Math.ceil((offset + dayCount) / 7) * 7 },
    (_, i) => new Date(year, month, i - offset + 1, 12),
  );
  const currentDay = iso(new Date());
  const spaces = new Map(data.spaces.map((s) => [s.id, s]));
  const byDate = new Map<string, Booking[]>();
  [...bookings]
    .sort(
      (a, b) =>
        a.startTime.localeCompare(b.startTime) ||
        a.title.localeCompare(b.title, "pt-BR"),
    )
    .forEach((booking) => {
      const items = byDate.get(booking.date) || [];
      items.push(booking);
      byDate.set(booking.date, items);
    });

  return (
    <section className="month-card" aria-label="Calendário mensal de reservas">
      <div className="month-intro">
        <div>
          <h2>O mês em um olhar</h2>
          <p>Selecione um dia para ver a agenda completa.</p>
        </div>
        <span className="month-today-key">
          <i /> Hoje
        </span>
      </div>
      {bookings.length === 0 && (
        <div className="month-empty" role="status">
          <CalendarDays aria-hidden="true" />
          {filtered
            ? "Nenhuma reserva encontrada neste mês com os filtros selecionados."
            : "Nenhuma reserva neste mês. Use o + em um dia para agendar."}
        </div>
      )}
      <div className="month-weekdays" aria-hidden="true">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="month-grid">
        {days.map((day) => {
          const key = iso(day);
          const inMonth = day.getMonth() === month;
          const items = inMonth ? byDate.get(key) || [] : [];
          const fullDate = day.toLocaleDateString("pt-BR", {
            dateStyle: "full",
          });
          const isToday = key === currentDay;
          return (
            <div
              key={key}
              className={`month-cell${inMonth ? "" : " outside-month"}${isToday ? " is-today" : ""}`}
            >
              {inMonth ? (
                <>
                  <div className="month-cell-head">
                    <button
                      className="month-date"
                      onClick={() => showDay(day)}
                      aria-label={`${fullDate}, ${items.length} ${items.length === 1 ? "reserva" : "reservas"}. Ver agenda do dia`}
                      aria-current={isToday ? "date" : undefined}
                    >
                      {day.getDate()}
                    </button>
                    {key >= currentDay && (
                      <button
                        className="month-add"
                        onClick={() => open(day)}
                        aria-label={`Nova reserva em ${fullDate}`}
                        title="Nova reserva neste dia"
                      >
                        <Plus aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="month-events">
                    {items.slice(0, 3).map((booking) => {
                      const space = spaces.get(booking.spaceId);
                      const color = space?.color || "#4b8b84";
                      const description = `${booking.startTime}–${booking.endTime} · ${booking.title} · ${space?.name || "Espaço não informado"}`;
                      return (
                        <button
                          key={booking.id}
                          className={`month-event${isPast(booking) ? " past" : ""}`}
                          style={{
                            borderLeftColor: color,
                            background: `${color}12`,
                          }}
                          title={description}
                          aria-label={description}
                          onClick={() => select(booking)}
                        >
                          <span className="month-event-time">
                            {booking.startTime}–{booking.endTime}
                          </span>
                          <b>{booking.title}</b>
                          <span className="month-event-space">
                            {space?.name || "Espaço não informado"}
                          </span>
                        </button>
                      );
                    })}
                    {items.length > 3 && (
                      <button
                        className="month-more"
                        onClick={() => showDay(day)}
                        aria-label={`Ver todas as ${items.length} reservas de ${fullDate}`}
                      >
                        +{items.length - 3} · ver mais
                      </button>
                    )}
                  </div>
                  <button
                    className="month-mobile-count"
                    onClick={() => showDay(day)}
                    aria-label={`${items.length} reservas em ${fullDate}. Ver agenda do dia`}
                  >
                    <span className="month-dots" aria-hidden="true">
                      {[...new Set(items.map((b) => b.spaceId))]
                        .slice(0, 3)
                        .map((id) => (
                          <i
                            key={id}
                            style={{
                              background: spaces.get(id)?.color || "#4b8b84",
                            }}
                          />
                        ))}
                    </span>
                    {items.length > 0 ? (
                      <span>
                        {items.length}
                        <span className="month-count-label">
                          {" "}
                          {items.length === 1 ? "reserva" : "reservas"}
                        </span>
                      </span>
                    ) : (
                      <span className="month-no-bookings">—</span>
                    )}
                  </button>
                </>
              ) : (
                <span className="month-outside-date" aria-hidden="true">
                  {day.getDate()}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="month-legend" aria-label="Legenda dos espaços">
        <b>Espaços</b>
        {data.spaces
          .filter((s) => room === "all" || s.id === +room)
          .map((space) => (
            <span key={space.id}>
              <i style={{ background: space.color }} />
              {space.name}
            </span>
          ))}
      </div>
    </section>
  );
}

export function Week({
  days,
  data,
  room,
  bookings,
  select,
  open,
}: {
  days: Date[];
  data: Data;
  room: string;
  bookings: Booking[];
  select: (b: Booking) => void;
  open: (d: Date, spaceId: number) => void;
}) {
  return (
    <section className="calendar-card">
      <div className="calendar-head">
        <div className="room-label">Espaço</div>
        {days.map((d) => (
          <div key={iso(d)} className={iso(d) === iso(today) ? "today" : ""}>
            <span>
              {new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
                .format(d)
                .replace(".", "")}
            </span>
            <b>{d.getDate()}</b>
          </div>
        ))}
      </div>
      <div className="calendar-body">
        {data.spaces
          .filter((s) => room === "all" || s.id === +room)
          .map((s) => (
            <div className="room-row" key={s.id}>
              <div className="room-info">
                <i style={{ background: s.color }} />
                <div>
                  <b>{s.name}</b>
                  <span>
                    {s.availableFrom}–{s.availableTo}
                  </span>
                </div>
              </div>
              {days.map((d) => (
                <div
                  className="day-cell"
                  key={iso(d)}
                  onClick={() => open(d, s.id)}
                >
                  {bookings
                    .filter((b) => b.spaceId === s.id && b.date === iso(d))
                    .sort((a, b) => b.startTime.localeCompare(a.startTime))
                    .map((b) => (
                      <button
                        className={`booking ${isPast(b) ? "past" : ""}`}
                        key={b.id}
                        style={{
                          borderLeftColor: s.color,
                          background: `${s.color}12`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          select(b);
                        }}
                      >
                        <b>
                          {b.startTime}–{b.endTime}
                        </b>
                        <span>{b.title}</span>
                        {!b.responsible || !b.phone ? <TriangleAlert /> : null}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          ))}
      </div>
    </section>
  );
}
const hours = Array.from({ length: 16 }, (_, i) => i + 7),
  pct = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return Math.max(0, Math.min(100, ((h + m / 60 - 7) / 15) * 100));
  };
export function Day({
  date,
  data,
  room,
  search,
  select,
  open,
}: {
  date: Date;
  data: Data;
  room: string;
  search: string;
  select: (b: Booking) => void;
  open: (spaceId: number) => void;
}) {
  const items = data.reservations
    .filter(
      (b) =>
        b.status !== "cancelled" &&
        b.date === iso(date) &&
        `${b.title} ${b.responsible} ${b.pmsc}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.startTime.localeCompare(a.startTime));
  return (
    <section className="timeline-card">
      <div className="timeline-scroll">
        <div className="timeline-head">
          <div className="timeline-room-title">Espaço</div>
          <div className="hour-scale">
            {hours.map((h) => (
              <span key={h} style={{ left: `${((h - 7) / 15) * 100}%` }}>
                {pad(h)}h
              </span>
            ))}
          </div>
        </div>
        {data.spaces
          .filter((s) => room === "all" || s.id === +room)
          .map((s) => (
            <div className="timeline-row" key={s.id}>
              <div className="room-info">
                <i style={{ background: s.color }} />
                <div>
                  <b>{s.name}</b>
                  <span>
                    {s.availableFrom}–{s.availableTo}
                  </span>
                </div>
              </div>
              <div className="timeline-track" onClick={() => open(s.id)}>
                {hours.slice(0, -1).map((h) => (
                  <i key={h} style={{ left: `${((h - 7) / 15) * 100}%` }} />
                ))}
                {items
                  .filter((b) => b.spaceId === s.id)
                  .map((b) => (
                    <button
                      className={`timeline-booking ${isPast(b) ? "past" : ""}`}
                      key={b.id}
                      style={{
                        left: `${pct(b.startTime)}%`,
                        width: `${Math.max(3, pct(b.endTime) - pct(b.startTime))}%`,
                        background: s.color,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        select(b);
                      }}
                    >
                      <b>
                        {b.startTime}–{b.endTime}
                      </b>
                      <span>{b.title}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
