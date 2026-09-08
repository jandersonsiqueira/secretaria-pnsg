export type Space = {
  id: number;
  name: string;
  capacity: number;
  color: string;
  active: boolean;
  availableFrom: string;
  availableTo: string;
  location: string;
};

export type Booking = {
  id: number;
  seriesId?: string;
  date: string;
  spaceId: number;
  startTime: string;
  endTime: string;
  title: string;
  responsible: string;
  phone: string;
  pmsc: string;
  status: "confirmed" | "pending" | "cancelled";
  recurrence?: "none" | "weekly" | "monthly";
  recurrenceEnd?: string;
  monthlyMode?: "day" | "nth";
  monthlyDay?: number;
  monthlyWeek?: number;
  monthlyWeekday?: number;
};

export type Data = { spaces: Space[]; reservations: Booking[] };
