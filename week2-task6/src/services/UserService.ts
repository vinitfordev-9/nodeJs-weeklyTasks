import { Repository } from "typeorm";
import { User } from "../entities/User";
import { UserInput } from "../types/dtos";

export class UserService {
  constructor(private readonly users: Repository<User>) {}

  findAll(): Promise<User[]> {
    return this.users.find({ relations: { orders: true }, order: { id: "ASC" } });
  }

  findById(id: number): Promise<User | null> {
    return this.users.findOne({ where: { id }, relations: { orders: true } });
  }

  create(input: UserInput): Promise<User> {
    const user = this.users.create({
      ...input,
      phone: input.phone ?? null,
      address: input.address ?? null,
    });
    return this.users.save(user);
  }

  async update(id: number, input: UserInput): Promise<User | null> {
    const user = await this.users.findOneBy({ id });
    if (!user) return null;
    this.users.merge(user, { ...input, phone: input.phone ?? null, address: input.address ?? null });
    await this.users.save(user);
    return this.findById(id);
  }

  async delete(id: number): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    await this.users.remove(user);
    user.id = id;
    return user;
  }
}
