import { Check, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderItem } from "./OrderItem";

@Entity({ name: "products" })
@Check("CHK_products_price", '"price" > 0')
@Check("CHK_products_stock", '"stock_quantity" >= 0')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "product_name", type: "varchar", length: 100 })
  productName!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Column({ name: "stock_quantity", type: "integer" })
  stockQuantity!: number;

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems!: OrderItem[];
}
