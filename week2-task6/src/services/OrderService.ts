import { Repository } from "typeorm";
import { Order } from "../entities/Order";
import { User } from "../entities/User";
import { HttpError } from "../errors/HttpError";
import { OrderInput } from "../types/dtos";

const orderRelations = { user: true, orderItems: { product: true } } as const;

export class OrderService {
  constructor(
    private readonly orders: Repository<Order>,
    private readonly users: Repository<User>,
  ) {}

  findAll(): Promise<Order[]> {
    return this.orders.find({ relations: orderRelations, order: { id: "ASC" } });
  }

  findById(id: number): Promise<Order | null> {
    return this.orders.findOne({ where: { id }, relations: orderRelations });
  }

  private async assertUserExists(userId: number): Promise<void> {
    if (!(await this.users.existsBy({ id: userId }))) throw new HttpError(400, "User not found");
  }

  async create(input: OrderInput): Promise<Order> {
    await this.assertUserExists(input.userId);
    const order = await this.orders.save(this.orders.create({
      ...input,
      status: input.status ?? null,
      totalAmount: input.totalAmount ?? null,
    }));
    return (await this.findById(order.id))!;
  }

  async update(id: number, input: OrderInput): Promise<Order | null> {
    const order = await this.orders.findOneBy({ id });
    if (!order) return null;
    await this.assertUserExists(input.userId);
    this.orders.merge(order, {
      ...input,
      status: input.status ?? null,
      totalAmount: input.totalAmount ?? null,
    });
    await this.orders.save(order);
    return this.findById(id);
  }

  async delete(id: number): Promise<Order | null> {
    const order = await this.findById(id);
    if (!order) return null;
    await this.orders.remove(order);
    order.id = id;
    return order;
  }
}
