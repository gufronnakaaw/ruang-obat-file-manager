import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.STORAGE_REGION as string,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY as string,
    secretAccessKey: process.env.STORAGE_SECRET_KEY as string,
  },
  endpoint: process.env.STORAGE_ENDPOINT as string,
});
