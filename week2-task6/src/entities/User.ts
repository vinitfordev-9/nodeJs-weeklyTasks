import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./Order";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 15, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  address!: string | null;

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];
}
