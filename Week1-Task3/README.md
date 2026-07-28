# Week 1 - Task 3: Event-Driven Order Processing System

## Objective

This project demonstrates the use of Node.js `EventEmitter` to build an event-driven workflow. The application simulates an order processing system where different events are triggered sequentially.

---

## Features

- Uses Node.js built-in `EventEmitter`
- Implements 3 custom events:
  - `orderPlaced`
  - `paymentConfirmed`
  - `orderShipped`
- One event automatically triggers another event (event chaining)
- Handles payment failure using an `error` event
- Passes order data between events

---

## Project Structure

```
Week1-Task3/
│── index.js
│── README.md
```

---

## Event Flow

```
Order Placed
      │
      ▼
Payment Confirmed
      │
      ▼
Order Shipped
```

If the payment amount is greater than ₹600:

```
Order Placed
      │
      ▼
Payment Failed
      │
      ▼
Error Event Triggered
```

---

## How It Works

1. The `orderPlaced` event is emitted with order details.
2. The `orderPlaced` listener prints the order information and emits the `paymentConfirmed` event.
3. The `paymentConfirmed` listener checks the payment amount.
4. If the payment is successful, it emits the `orderShipped` event.
5. If the payment fails, it emits the `error` event.
6. The `error` listener displays the error message.

---

## Sample Output

### Successful Order

```
Order 101 received from vinit
Payment confirmed for Order 101
Order 101 shipped successfully
```

### Failed Payment

```
Order 102 received from rahul
Error: Payment failed for Order 102
```

---

## Concepts Learned

- Event-driven programming
- EventEmitter
- Custom events
- Event listeners
- Event chaining
- Passing data between events
- Error handling using the `error` event

---

## Technologies Used

- Node.js
- JavaScript
- EventEmitter (Built-in Node.js module)

---

## Author

Vinit
