import { Check, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderItem } from "./OrderItem";
import { User } from "./User";

@Entity({ name: "orders" })
@Check("CHK_orders_total", '"total_amount" IS NULL OR "total_amount" >= 0')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_id", type: "integer" })
  userId!: number;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "order_date", type: "date" })
  orderDate!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  status!: string | null;

  @Column({ name: "total_amount", type: "decimal", precision: 10, scale: 2, nullable: true })
  totalAmount!: number | null;

  @OneToMany(() => OrderItem, (item) => item.order)
  orderItems!: OrderItem[];
}
