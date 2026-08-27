import { Document } from 'mongoose';

export interface IUser {
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  role: 'user' | 'admin';
  level: number;
  experience: number;
  coins: number;
  phoneNumber?: string;
  phoneVerified: boolean;
  phoneVerificationCode?: string;
  phoneVerificationExpires?: Date;
  smsAlertsEnabled: boolean;
  smsAlertThreshold: 'low' | 'medium' | 'high';
}

export interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserResponse {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  level: number;
  experience: number;
  coins: number;
  phoneNumber?: string;
  phoneVerified: boolean;
  smsAlertsEnabled: boolean;
  smsAlertThreshold: string;
  createdAt: Date;
  updatedAt: Date;
}
