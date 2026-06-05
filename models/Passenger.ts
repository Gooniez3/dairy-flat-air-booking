import mongoose, { Schema, Document } from 'mongoose';

// Passenger information stored for flight bookings.
export interface IPassenger extends Document {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
}

// Schema definition for passenger records.
const PassengerSchema = new Schema<IPassenger>({
  title: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, index: true },
  gender: { type: String },
});

// Reuse an existing model if available to avoid recompilation errors.
export default mongoose.models.Passenger || mongoose.model<IPassenger>('Passenger', PassengerSchema);