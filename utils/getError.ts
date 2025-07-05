export function getError(error: any) {
  if (error.status_code >= 500) {
    if (error.error.message.length > 25) {
      return "Sepertinya ada masalah pada sisi server";
    }

    return error.error.message;
  }

  if (error.status_code >= 400 && error.status_code <= 499) {
    if (error.error.name === "ZodError") {
      return error.error.errors.reduce((acc: any, err: any) => {
        acc[err.field[0]] = err.message;
        return acc;
      }, {});
    }

    return error.error.message;
  }
  return error.error.message;
}
