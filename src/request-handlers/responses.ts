import { Response } from "./types";

export const ok = (data: object): Response => ({
  status: 200,
  data,
});

export const created = (data: object): Response => ({
  status: 201,
  data,
});

export const noContent = (): Response => ({
  status: 204,
  data: null,
});

export const badRequest = (data: object): Response => ({
  status: 400,
  data,
});

export const notFound = (): Response => ({
  status: 404,
  data: {
    message: "Not found",
  },
});
