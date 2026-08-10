import { Request, Response } from "express";
import { parsePositiveId } from "../middleware/parsePositiveId";
import { userService } from "../services";
import { UserInput } from "../types/dtos";

export async function getAllUsers(_req: Request, res: Response): Promise<Response> {
  return res.status(200).json(await userService.findAll());
}

export async function getUserById(req: Request, res: Response): Promise<Response> {
  const user = await userService.findById(parsePositiveId(req.params.id, "User"));
  return user ? res.status(200).json(user) : res.status(404).json({ message: "User not found" });
}

export async function createUser(req: Request, res: Response): Promise<Response> {
  return res.status(201).json(await userService.create(req.validatedBody as UserInput));
}

export async function updateUser(req: Request, res: Response): Promise<Response> {
  const user = await userService.update(parsePositiveId(req.params.id, "User"), req.validatedBody as UserInput);
  return user ? res.status(200).json(user) : res.status(404).json({ message: "User not found" });
}

export async function deleteUser(req: Request, res: Response): Promise<Response> {
  const user = await userService.delete(parsePositiveId(req.params.id, "User"));
  return user
    ? res.status(200).json({ message: "User deleted successfully", deletedUser: user })
    : res.status(404).json({ message: "User not found" });
}
