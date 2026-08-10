import { Request, Response } from "express";
import { parsePositiveId } from "../middleware/parsePositiveId";
import { orderItemService } from "../services";
import { OrderItemInput } from "../types/dtos";

export async function getAllOrderItems(_req: Request, res: Response): Promise<Response> {
  return res.status(200).json(await orderItemService.findAll());
}
export async function getOrderItemById(req: Request, res: Response): Promise<Response> {
  const value = await orderItemService.findById(parsePositiveId(req.params.id, "Order item"));
  return value ? res.status(200).json(value) : res.status(404).json({ message: "Order item not found" });
}
export async function createOrderItem(req: Request, res: Response): Promise<Response> {
  return res.status(201).json(await orderItemService.create(req.validatedBody as OrderItemInput));
}
export async function updateOrderItem(req: Request, res: Response): Promise<Response> {
  const value = await orderItemService.update(parsePositiveId(req.params.id, "Order item"), req.validatedBody as OrderItemInput);
  return value ? res.status(200).json(value) : res.status(404).json({ message: "Order item not found" });
}
export async function deleteOrderItem(req: Request, res: Response): Promise<Response> {
  const value = await orderItemService.delete(parsePositiveId(req.params.id, "Order item"));
  return value
    ? res.status(200).json({ message: "Order item deleted successfully", deletedOrderItem: value })
    : res.status(404).json({ message: "Order item not found" });
}
