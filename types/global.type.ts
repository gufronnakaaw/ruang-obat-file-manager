export type SuccessResponse<T> = {
  success: boolean;
  status_code: number;
  data: T;
};

export type ErrorDataType = {
  success: boolean;
  status_code: number;
  error: {
    name: string;
    message: string;
    errors?: {
      code: string;
      meta: string;
      stack: string;
    };
  };
};
