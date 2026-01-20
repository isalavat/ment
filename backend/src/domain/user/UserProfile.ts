import { Email } from "./value-objects/Email";
import { UserId } from "./value-objects/UserId";

export class UserProfile {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string
  ) {}
}
