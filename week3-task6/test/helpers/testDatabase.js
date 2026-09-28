const state = {
  users: [],
  products: [],
  orders: [],
  orderItems: [],
  nextIds: {},
};

function applyDefined(target, values) {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) target[key] = value;
  }
  return target;
}

function selectRecord(record, select) {
  if (!record || !select) return record;

  const selected = {};
  for (const [key, enabled] of Object.entries(select)) {
    if (enabled === true && key in record) selected[key] = record[key];
  }
  return selected;
}

function publicUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return { ...safeUser };
}

function productWithRelations(product) {
  if (!product) return null;
  return {
    ...product,
    orderItems: state.orderItems.filter((item) => item.productId === product.id),
  };
}

function orderWithRelations(order) {
  if (!order) return null;
  return {
    ...order,
    user: publicUser(state.users.find((user) => user.id === order.userId)),
    orderItems: state.orderItems
      .filter((item) => item.orderId === order.id)
      .map((item) => ({
        ...item,
        product: state.products.find((product) => product.id === item.productId),
      })),
  };
}

function orderItemWithRelations(item) {
  if (!item) return null;
  const order = state.orders.find((candidate) => candidate.id === item.orderId);
  return {
    ...item,
    order: order
      ? {
          ...order,
          user: publicUser(state.users.find((user) => user.id === order.userId)),
        }
      : null,
    product: state.products.find((product) => product.id === item.productId),
  };
}

function prismaError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function reset(passwordHash) {
  state.users = [
    {
      id: 1,
      name: "Admin",
      email: "admin@example.com",
      password: passwordHash,
      role: "ADMIN",
      phone: null,
      address: null,
    },
    {
      id: 2,
      name: "Regular User",
      email: "user@example.com",
      password: passwordHash,
      role: "USER",
      phone: null,
      address: null,
    },
    {
      id: 3,
      name: "Disposable User",
      email: "delete-me@example.com",
      password: passwordHash,
      role: "USER",
      phone: null,
      address: null,
    },
  ];
  state.products = [
    {
      id: 1,
      productName: "Keyboard",
      description: "Mechanical keyboard",
      price: 100,
      stockQuantity: 10,
    },
    {
      id: 2,
      productName: "Mouse",
      description: null,
      price: 25,
      stockQuantity: 20,
    },
  ];
  state.orders = [
    {
      id: 1,
      userId: 2,
      orderDate: new Date("2026-08-24T00:00:00.000Z"),
      status: "PENDING",
      totalAmount: 100,
    },
    {
      id: 2,
      userId: 2,
      orderDate: new Date("2026-08-24T00:00:00.000Z"),
      status: "PENDING",
      totalAmount: 0,
    },
  ];
  state.orderItems = [
    { id: 1, orderId: 1, productId: 1, quantity: 1, price: 100 },
  ];
  state.nextIds = { user: 4, product: 3, order: 3, orderItem: 2 };
}

const prisma = {
  user: {
    async findMany({ select } = {}) {
      return state.users.map((user) => selectRecord(publicUser(user), select));
    },
    async findUnique({ where, select } = {}) {
      const user = state.users.find(
        (candidate) =>
          (where.id !== undefined && candidate.id === where.id) ||
          (where.email !== undefined && candidate.email === where.email),
      );
      if (!user) return null;
      if (!select) return { ...user };

      const selected = selectRecord(publicUser(user), select);
      if (select.orders) {
        selected.orders = state.orders
          .filter((order) => order.userId === user.id)
          .map((order) => ({ ...order }));
      }
      return selected;
    },
    async create({ data, select }) {
      if (state.users.some((user) => user.email === data.email)) {
        throw prismaError("P2002", "Email must be unique");
      }
      const user = { id: state.nextIds.user++, ...data };
      state.users.push(user);
      return selectRecord(publicUser(user), select) || publicUser(user);
    },
    async update({ where, data, select }) {
      const user = state.users.find((candidate) => candidate.id === where.id);
      if (!user) throw prismaError("P2025", "User not found");
      if (
        data.email &&
        state.users.some(
          (candidate) => candidate.id !== user.id && candidate.email === data.email,
        )
      ) {
        throw prismaError("P2002", "Email must be unique");
      }
      applyDefined(user, data);
      return selectRecord(publicUser(user), select) || publicUser(user);
    },
    async delete({ where, select }) {
      const index = state.users.findIndex((user) => user.id === where.id);
      if (index < 0) throw prismaError("P2025", "User not found");
      if (state.orders.some((order) => order.userId === where.id)) {
        throw prismaError("P2003", "User is referenced by an order");
      }
      const [user] = state.users.splice(index, 1);
      return selectRecord(publicUser(user), select) || publicUser(user);
    },
  },
  product: {
    async findMany() {
      return state.products.map(productWithRelations);
    },
    async findUnique({ where, select, include } = {}) {
      const product = state.products.find((candidate) => candidate.id === where.id);
      if (!product) return null;
      if (select) return selectRecord(product, select);
      return include ? productWithRelations(product) : { ...product };
    },
    async create({ data }) {
      const product = { id: state.nextIds.product++, ...data };
      state.products.push(product);
      return { ...product };
    },
    async update({ where, data }) {
      const product = state.products.find((candidate) => candidate.id === where.id);
      if (!product) throw prismaError("P2025", "Product not found");
      applyDefined(product, data);
      return { ...product };
    },
    async delete({ where }) {
      const index = state.products.findIndex((product) => product.id === where.id);
      if (index < 0) throw prismaError("P2025", "Product not found");
      if (state.orderItems.some((item) => item.productId === where.id)) {
        throw prismaError("P2003", "Product is referenced by an order item");
      }
      return state.products.splice(index, 1)[0];
    },
  },
  order: {
    async findMany() {
      return state.orders.map(orderWithRelations);
    },
    async findUnique({ where, select, include } = {}) {
      const order = state.orders.find((candidate) => candidate.id === where.id);
      if (!order) return null;
      if (select) return selectRecord(order, select);
      return include ? orderWithRelations(order) : { ...order };
    },
    async create({ data }) {
      const order = { id: state.nextIds.order++, ...data };
      state.orders.push(order);
      return orderWithRelations(order);
    },
    async update({ where, data }) {
      const order = state.orders.find((candidate) => candidate.id === where.id);
      if (!order) throw prismaError("P2025", "Order not found");
      applyDefined(order, data);
      return orderWithRelations(order);
    },
    async delete({ where }) {
      const index = state.orders.findIndex((order) => order.id === where.id);
      if (index < 0) throw prismaError("P2025", "Order not found");
      if (state.orderItems.some((item) => item.orderId === where.id)) {
        throw prismaError("P2003", "Order is referenced by an order item");
      }
      return state.orders.splice(index, 1)[0];
    },
  },
  orderItem: {
    async findMany() {
      return state.orderItems.map(orderItemWithRelations);
    },
    async findUnique({ where, include } = {}) {
      const item = state.orderItems.find((candidate) => candidate.id === where.id);
      if (!item) return null;
      return include ? orderItemWithRelations(item) : { ...item };
    },
    async create({ data }) {
      const item = { id: state.nextIds.orderItem++, ...data };
      state.orderItems.push(item);
      return orderItemWithRelations(item);
    },
    async update({ where, data }) {
      const item = state.orderItems.find((candidate) => candidate.id === where.id);
      if (!item) throw prismaError("P2025", "Order item not found");
      applyDefined(item, data);
      return orderItemWithRelations(item);
    },
    async delete({ where }) {
      const index = state.orderItems.findIndex((item) => item.id === where.id);
      if (index < 0) throw prismaError("P2025", "Order item not found");
      return state.orderItems.splice(index, 1)[0];
    },
  },
};

module.exports = { prisma, reset, state };
