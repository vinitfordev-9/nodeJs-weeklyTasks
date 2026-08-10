import { Request, Response } from "express";
import { parsePositiveId } from "../middleware/parsePositiveId";
import { productService } from "../services";
import { ProductInput } from "../types/dtos";

export async function getAllProducts(_req: Request, res: Response): Promise<Response> {
  return res.status(200).json(await productService.findAll());
}
export async function getProductById(req: Request, res: Response): Promise<Response> {
  const value = await productService.findById(parsePositiveId(req.params.id, "Product"));
  return value ? res.status(200).json(value) : res.status(404).json({ message: "Product not found" });
}
export async function createProduct(req: Request, res: Response): Promise<Response> {
  return res.status(201).json(await productService.create(req.validatedBody as ProductInput));
}
export async function updateProduct(req: Request, res: Response): Promise<Response> {
  const value = await productService.update(parsePositiveId(req.params.id, "Product"), req.validatedBody as ProductInput);
  return value ? res.status(200).json(value) : res.status(404).json({ message: "Product not found" });
}
export async function deleteProduct(req: Request, res: Response): Promise<Response> {
  const value = await productService.delete(parsePositiveId(req.params.id, "Product"));
  return value
    ? res.status(200).json({ message: "Product deleted successfully", deletedProduct: value })
    : res.status(404).json({ message: "Product not found" });
}
