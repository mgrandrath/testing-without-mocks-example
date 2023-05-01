export type Response = {
  status: number;
  data: object | null;
};

export const ok = (data: object) => ({
  status: 200,
  data,
});

export const created = (data: object) => ({
  status: 201,
  data,
});

export const noContent = () => ({
  status: 204,
  data: null,
});

export const badRequest = (data: object) => ({
  status: 400,
  data,
});

export const notFound = () => ({
  status: 404,
  data: {
    message: "Not found",
  },
});
