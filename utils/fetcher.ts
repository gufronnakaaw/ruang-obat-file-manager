import axios, { isAxiosError } from "axios";

type FetcherParams = {
  url: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  data?: unknown;
  token?: string;
  user_agent?: string;
  file?: boolean;
};

export async function fetcher({
  url,
  method,
  data,
  token,
  user_agent,
  file,
}: FetcherParams) {
  const prefix = process.env.NEXT_PUBLIC_MODE == "dev" ? "dev" : "api";

  const options = {
    url: `https://${prefix}.ruangobat.id/api` + url,
    method,
  };

  if (data) {
    Object.assign(options, { data });
  }

  if (file) {
    Object.assign(options, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  if (token) {
    Object.assign(options, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  if (user_agent) {
    Object.assign(options, {
      headers: {
        "User-Agent": user_agent,
      },
    });
  }

  try {
    const response = await axios(options);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw error.response?.data;
    }
  }
}
