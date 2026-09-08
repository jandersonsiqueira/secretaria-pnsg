import { TriangleAlert } from "lucide-react";
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
