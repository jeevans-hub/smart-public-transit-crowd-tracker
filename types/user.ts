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
  createdAt: Date;
  updatedAt: Date;
}
