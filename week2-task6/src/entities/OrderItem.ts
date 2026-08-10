import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./Order";
import { Product } from "./Product";

@Entity({ name: "order_items" })
@Check("CHK_order_items_quantity", '"quantity" > 0')
@Check("CHK_order_items_price", '"price" > 0')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "order_id", type: "integer" })
  orderId!: number;

  @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "product_id", type: "integer" })
  productId!: number;

  @ManyToOne(() => Product, (product) => product.orderItems, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ type: "integer" })
  quantity!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;
}
