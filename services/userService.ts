import User from '@/models/User';
import { IUserDocument, IUserResponse } from '@/types/user';

export async function createUser(userData: {
  username: string;
  email: string;
  passwordHash: string;
}): Promise<IUserDocument> {
  const user = new User(userData);
  await user.save();
  return user;
}

export async function findByEmail(email: string): Promise<IUserDocument | null> {
  return User.findOne({ email: email.toLowerCase() });
}

export async function findByUsername(username: string): Promise<IUserDocument | null> {
  return User.findOne({ username });
}

export async function findById(id: string): Promise<IUserDocument | null> {
  return User.findById(id);
}

export async function updateUser(
  id: string,
  updates: Partial<{
    username: string;
    email: string;
    avatar: string;
    role: 'user' | 'admin';
    level: number;
    experience: number;
    coins: number;
  }>
): Promise<IUserDocument | null> {
  return User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
}

export function toUserResponse(user: IUserDocument): IUserResponse {
  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    level: user.level,
    experience: user.experience,
    coins: user.coins,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    smsAlertsEnabled: user.smsAlertsEnabled,
    smsAlertThreshold: user.smsAlertThreshold,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
