import { Repository } from "typeorm";
import { Product } from "../entities/Product";
import { ProductInput } from "../types/dtos";

export class ProductService {
  constructor(private readonly products: Repository<Product>) {}

  findAll(): Promise<Product[]> {
    return this.products.find({ relations: { orderItems: true }, order: { id: "ASC" } });
  }

  findById(id: number): Promise<Product | null> {
    return this.products.findOne({ where: { id }, relations: { orderItems: true } });
  }

  create(input: ProductInput): Promise<Product> {
    return this.products.save(this.products.create({ ...input, description: input.description ?? null }));
  }

  async update(id: number, input: ProductInput): Promise<Product | null> {
    const product = await this.products.findOneBy({ id });
    if (!product) return null;
    this.products.merge(product, { ...input, description: input.description ?? null });
    await this.products.save(product);
    return this.findById(id);
  }

  async delete(id: number): Promise<Product | null> {
    const product = await this.findById(id);
    if (!product) return null;
    await this.products.remove(product);
    product.id = id;
    return product;
  }
}
