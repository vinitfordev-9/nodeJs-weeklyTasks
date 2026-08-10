export interface UserInput {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
}

export interface ProductInput {
  productName: string;
  description?: string | null;
  price: number;
  stockQuantity: number;
}

export interface OrderInput {
  userId: number;
  orderDate: string;
  status?: string | null;
  totalAmount?: number | null;
}

export interface OrderItemInput {
  orderId: number;
  productId: number;
  quantity: number;
  price?: number | null;
}
