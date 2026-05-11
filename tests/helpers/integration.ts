import app from "../../src/server";

export const request = async (path: string, options: any = {}) => {
  const res = await app.request(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await res.json();
  return { status: res.status, body };
};
