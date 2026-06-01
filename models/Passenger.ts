import mongoose, { Schema, Document } from 'mongoose';

export interface IPassenger extends Document {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
}

const PassengerSchema = new Schema<IPassenger>({
  title: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, index: true },
  gender: { type: String },
});

export default mongoose.models.Passenger || mongoose.model<IPassenger>('Passenger', PassengerSchema);
