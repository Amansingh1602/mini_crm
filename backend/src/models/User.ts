import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  picture?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String },
  googleId: { type: String, index: true },
  picture: { type: String },
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true, 
    transform: (_, ret: any) => { 
      ret.id = ret._id; 
      delete ret._id; 
      delete ret.__v; 
      delete ret.password;
    } 
  },
  toObject: { virtuals: true }
});

export const User = (mongoose.models.User || mongoose.model<IUser>('User', UserSchema)) as mongoose.Model<IUser>;
