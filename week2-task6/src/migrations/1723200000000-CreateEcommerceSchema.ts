import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEcommerceSchema1723200000000 implements MigrationInterface {
  name = "CreateEcommerceSchema1723200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar(100) NOT NULL,
        "email" varchar(100) NOT NULL,
        "phone" varchar(15),
        "address" varchar(255),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "product_name" varchar(100) NOT NULL,
        "description" text,
        "price" decimal(10,2) NOT NULL,
        "stock_quantity" integer NOT NULL,
        CONSTRAINT "CHK_products_price" CHECK ("price" > 0),
        CONSTRAINT "CHK_products_stock" CHECK ("stock_quantity" >= 0)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "user_id" integer NOT NULL,
        "order_date" date NOT NULL,
        "status" varchar(50),
        "total_amount" decimal(10,2),
        CONSTRAINT "CHK_orders_total" CHECK ("total_amount" IS NULL OR "total_amount" >= 0),
        CONSTRAINT "FK_orders_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "order_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "quantity" integer NOT NULL,
        "price" decimal(10,2) NOT NULL,
        CONSTRAINT "CHK_order_items_quantity" CHECK ("quantity" > 0),
        CONSTRAINT "CHK_order_items_price" CHECK ("price" > 0),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_product" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "order_items"');
    await queryRunner.query('DROP TABLE "orders"');
    await queryRunner.query('DROP TABLE "products"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
