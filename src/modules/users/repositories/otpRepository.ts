import { Otp, OtpCreationAttributes } from '../models/otpModel';

export class OtpRepository {
  static create(data: OtpCreationAttributes): Promise<Otp> {
    return Otp.create(data);
  }

  static findById(id: number): Promise<Otp | null> {
    return Otp.findByPk(id);
  }

  static async incrementAttempts(id: number): Promise<void> {
    await Otp.increment('attempts', { where: { id } });
  }

  static destroy(id: number): Promise<number> {
    return Otp.destroy({ where: { id } });
  }
}
