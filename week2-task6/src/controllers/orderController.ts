import { Request, Response } from "express";
import { parsePositiveId } from "../middleware/parsePositiveId";
import { orderService } from "../services";
import { OrderInput } from "../types/dtos";

export async function getAllOrders(_req: Request, res: Response): Promise<Response> {
  return res.status(200).json(await orderService.findAll());
}
export async function getOrderById(req: Request, res: Response): Promise<Response> {
  const value = await orderService.findById(parsePositiveId(req.params.id, "Order"));
  return value ? res.status(200).json(value) : res.status(404).json({ message: "Order not found" });
}
export async function createOrder(req: Request, res: Response): Promise<Response> {
  return res.status(201).json(await orderService.create(req.validatedBody as OrderInput));
}
export async function updateOrder(req: Request, res: Response): Promise<Response> {
  const value = await orderService.update(parsePositiveId(req.params.id, "Order"), req.validatedBody as OrderInput);
  return value ? res.status(200).json(value) : res.status(404).json({ message: "Order not found" });
}
export async function deleteOrder(req: Request, res: Response): Promise<Response> {
  const value = await orderService.delete(parsePositiveId(req.params.id, "Order"));
  return value
    ? res.status(200).json({ message: "Order deleted successfully", deletedOrder: value })
    : res.status(404).json({ message: "Order not found" });
}
