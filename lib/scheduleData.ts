// Airport information used for routes, timezones, and display labels.
export const AIRPORTS: Record<string, { name: string; city: string; timezone: string; tzOffset: number }> = {
  NZNE: { name: 'Dairy Flat Airport', city: 'Dairy Flat, Auckland', timezone: 'NZT (GMT+12)', tzOffset: 12 },
  YSSY: { name: 'Sydney Airport', city: 'Sydney, Australia', timezone: 'AEST (GMT+10)', tzOffset: 10 },
  NZRO: { name: 'Rotorua Airport', city: 'Rotorua, NZ', timezone: 'NZT (GMT+12)', tzOffset: 12 },
  NZCI: { name: 'Tuuta Airport', city: 'Chatham Islands, NZ', timezone: 'CHAST (GMT+12:45)', tzOffset: 12.75 },
  NZGB: { name: 'Claris Airport', city: 'Great Barrier Island, NZ', timezone: 'NZT (GMT+12)', tzOffset: 12 },
  NZTL: { name: 'Lake Tekapo Airport', city: 'Lake Tekapo, NZ', timezone: 'NZT (GMT+12)', tzOffset: 12 },
};

// Aircraft details used to set seat capacity for each scheduled flight.
export const AIRCRAFT: Record<string, { name: string; capacity: number }> = {
  SJ30i: { name: 'SyberJet SJ30i', capacity: 6 },
  SF50_A: { name: 'Cirrus SF50 (Alpha)', capacity: 4 },
  SF50_B: { name: 'Cirrus SF50 (Bravo)', capacity: 4 },
  HJ_A: { name: 'HondaJet Elite (Alpha)', capacity: 5 },
  HJ_B: { name: 'HondaJet Elite (Bravo)', capacity: 5 },
};

export interface RouteTemplate {
  flightNumber: string;
  origin: string;
  destination: string;
  aircraft: string;
  departureHour: number;   // local time at origin
  departureMinute: number;
  durationMinutes: number;
  price: number;
  daysOfWeek: number[]; // 0=Sun,1=Mon,...,6=Sat
}

// Weekly route timetable used to generate real scheduled flight dates.
export const ROUTE_TEMPLATES: RouteTemplate[] = [
  // Sydney prestige service
  { flightNumber: 'DF101', origin: 'NZNE', destination: 'YSSY', aircraft: 'SJ30i', departureHour: 10, departureMinute: 30, durationMinutes: 195, price: 1250, daysOfWeek: [5] },
  { flightNumber: 'DF102', origin: 'YSSY', destination: 'NZNE', aircraft: 'SJ30i', departureHour: 14, departureMinute: 30, durationMinutes: 165, price: 1250, daysOfWeek: [0] },

  // Rotorua weekday shuttle
  { flightNumber: 'DF201', origin: 'NZNE', destination: 'NZRO', aircraft: 'SF50_A', departureHour: 7, departureMinute: 0, durationMinutes: 45, price: 185, daysOfWeek: [1,2,3,4,5] },
  { flightNumber: 'DF202', origin: 'NZRO', destination: 'NZNE', aircraft: 'SF50_A', departureHour: 8, departureMinute: 15, durationMinutes: 45, price: 185, daysOfWeek: [1,2,3,4,5] },
  { flightNumber: 'DF203', origin: 'NZNE', destination: 'NZRO', aircraft: 'SF50_A', departureHour: 16, departureMinute: 30, durationMinutes: 45, price: 185, daysOfWeek: [1,2,3,4,5] },
  { flightNumber: 'DF204', origin: 'NZRO', destination: 'NZNE', aircraft: 'SF50_A', departureHour: 18, departureMinute: 0, durationMinutes: 45, price: 185, daysOfWeek: [1,2,3,4,5] },

  // Great Barrier Island service
  { flightNumber: 'DF301', origin: 'NZNE', destination: 'NZGB', aircraft: 'SF50_B', departureHour: 9, departureMinute: 0, durationMinutes: 35, price: 220, daysOfWeek: [1,3,5] },
  { flightNumber: 'DF302', origin: 'NZGB', destination: 'NZNE', aircraft: 'SF50_B', departureHour: 10, departureMinute: 0, durationMinutes: 35, price: 220, daysOfWeek: [2,4,6] },

  // Chatham Islands service
  { flightNumber: 'DF401', origin: 'NZNE', destination: 'NZCI', aircraft: 'HJ_A', departureHour: 8, departureMinute: 0, durationMinutes: 135, price: 680, daysOfWeek: [2,5] },
  { flightNumber: 'DF402', origin: 'NZCI', destination: 'NZNE', aircraft: 'HJ_A', departureHour: 9, departureMinute: 0, durationMinutes: 120, price: 680, daysOfWeek: [3,6] },

  // Lake Tekapo service
  { flightNumber: 'DF501', origin: 'NZNE', destination: 'NZTL', aircraft: 'HJ_B', departureHour: 9, departureMinute: 30, durationMinutes: 105, price: 420, daysOfWeek: [1] },
  { flightNumber: 'DF502', origin: 'NZTL', destination: 'NZNE', aircraft: 'HJ_B', departureHour: 11, departureMinute: 0, durationMinutes: 100, price: 420, daysOfWeek: [2] },
];

// Convert local airport departure time into a UTC Date object.
function localToUTC(year: number, month: number, day: number, hour: number, minute: number, tzOffset: number): Date {
  // tzOffset is the number of hours ahead of UTC.
  const utcMs = Date.UTC(year, month, day, hour, minute, 0, 0) - tzOffset * 60 * 60 * 1000;
  return new Date(utcMs);
}

// Generate scheduled flights from the weekly timetable for multiple weeks.
export function generateScheduledFlights(weeksAhead: number = 8) {
  const flights = [];
  const today = new Date();

  // Start from the previous Monday using an approximate New Zealand date.
  const nzToday = new Date(today.getTime() + 12 * 60 * 60 * 1000);
  const dayOfWeek = nzToday.getUTCDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  for (let w = -1; w < weeksAhead; w++) {
    for (const template of ROUTE_TEMPLATES) {
      const originTz = AIRPORTS[template.origin].tzOffset;

      for (const dow of template.daysOfWeek) {
        // Work out the real calendar date for this weekly flight.
        const daysFromMonday = dow === 0 ? 6 : dow - 1;
        const totalDaysOffset = daysToMonday + w * 7 + daysFromMonday;

        const flightNZDate = new Date(nzToday);
        flightNZDate.setUTCDate(nzToday.getUTCDate() + totalDaysOffset);

        const year = flightNZDate.getUTCFullYear();
        const month = flightNZDate.getUTCMonth();
        const day = flightNZDate.getUTCDate();

        const departureUTC = localToUTC(year, month, day, template.departureHour, template.departureMinute, originTz);
        const arrivalUTC = new Date(departureUTC.getTime() + template.durationMinutes * 60 * 1000);

        flights.push({
          flightNumber: template.flightNumber,
          origin: template.origin,
          destination: template.destination,
          aircraft: template.aircraft,
          departureTime: departureUTC,
          arrivalTime: arrivalUTC,
          durationMinutes: template.durationMinutes,
          price: template.price,
          capacity: AIRCRAFT[template.aircraft].capacity,
          bookings: [],
          status: 'scheduled',
        });
      }
    }
  }

  return flights;
}