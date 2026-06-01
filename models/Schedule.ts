import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking {
  passengerId: string;
  passengerName: string;
  passengerEmail: string;
  bookingReference: string;
  bookedAt: Date;
}

export interface ISchedule extends Document {
  flightNumber: string;
  origin: string;
  destination: string;
  aircraft: string;
  departureTime: Date;
  arrivalTime: Date;
  durationMinutes: number;
  price: number;
  capacity: number;
  bookings: IBooking[];
  status: string;
}

const BookingSchema = new Schema<IBooking>({
  passengerId: { type: String, required: true },
  passengerName: { type: String, required: true },
  passengerEmail: { type: String, required: true },
  bookingReference: { type: String, required: true },
  bookedAt: { type: Date, default: Date.now },
});

const ScheduleSchema = new Schema<ISchedule>({
  flightNumber: { type: String, required: true, index: true },
  origin: { type: String, required: true, index: true },
  destination: { type: String, required: true, index: true },
  aircraft: { type: String, required: true },
  departureTime: { type: Date, required: true, index: true },
  arrivalTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: true },
  price: { type: Number, required: true },
  capacity: { type: Number, required: true },
  bookings: [BookingSchema],
  status: { type: String, default: 'scheduled' },
});

// Compound index for efficient searching
ScheduleSchema.index({ origin: 1, destination: 1, departureTime: 1 });

export default mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema);
