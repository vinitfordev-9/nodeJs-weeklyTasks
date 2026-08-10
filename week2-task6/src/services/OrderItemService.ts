import { Repository } from "typeorm";
import { Order } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { Product } from "../entities/Product";
import { HttpError } from "../errors/HttpError";
import { OrderItemInput } from "../types/dtos";

const itemRelations = { order: { user: true }, product: true } as const;

export class OrderItemService {
  constructor(
    private readonly items: Repository<OrderItem>,
    private readonly orders: Repository<Order>,
    private readonly products: Repository<Product>,
  ) {}

  findAll(): Promise<OrderItem[]> {
    return this.items.find({ relations: itemRelations, order: { id: "ASC" } });
  }

  findById(id: number): Promise<OrderItem | null> {
    return this.items.findOne({ where: { id }, relations: itemRelations });
  }

  private async related(orderId: number, productId: number): Promise<Product> {
    const [orderExists, product] = await Promise.all([
      this.orders.existsBy({ id: orderId }),
      this.products.findOneBy({ id: productId }),
    ]);
    if (!orderExists) throw new HttpError(400, "Order not found");
    if (!product) throw new HttpError(400, "Product not found");
    return product;
  }

  async create(input: OrderItemInput): Promise<OrderItem> {
    const product = await this.related(input.orderId, input.productId);
    const item = await this.items.save(this.items.create({
      ...input,
      price: input.price ?? product.price,
    }));
    return (await this.findById(item.id))!;
  }

  async update(id: number, input: OrderItemInput): Promise<OrderItem | null> {
    const item = await this.items.findOneBy({ id });
    if (!item) return null;
    const product = await this.related(input.orderId, input.productId);
    this.items.merge(item, { ...input, price: input.price ?? item.price ?? product.price });
    await this.items.save(item);
    return this.findById(id);
  }

  async delete(id: number): Promise<OrderItem | null> {
    const item = await this.findById(id);
    if (!item) return null;
    await this.items.remove(item);
    item.id = id;
    return item;
  }
}
