const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("orderPlaced", (order) => {
  console.log(`Order ${order.orderId} received from ${order.name}`);
  emitter.emit("paymentConfirmed", order);
});

emitter.on("paymentConfirmed", (order) => {
  if (order.amount > 600) {
    emitter.emit("error", "Payment Failed!");
    return;
  }

  console.log("Payment Confirmed");
  emitter.emit("orderShipped", order);
});

emitter.on("orderShipped", (order) => {
  console.log(`Order ${order.orderId} shipped successfully`);
});

emitter.on("error", (message) => {
  console.log(`Error: ${message}`);
});

emitter.emit("orderPlaced", {
  orderId: 101,
  name: "vinit",
  amount: 500,
});

emitter.emit("orderPlaced", {
  orderId: 102,
  name: "rahul",
  amount: 900,
});
