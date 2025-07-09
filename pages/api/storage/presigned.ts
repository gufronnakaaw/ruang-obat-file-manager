import { s3 } from "@/libs/aws";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import z from "zod";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session)
    return res.status(401).json({
      success: false,
      status_code: 401,
      error: {
        name: "UnauthorizedError",
        message: "Unauthorized",
        errors: null,
      },
    });

  if (req.method === "POST") {
    const uploadFilesSchema = z.object({
      files: z
        .array(
          z.object({
            filename: z.string(),
            type: z.string(),
          }),
        )
        .min(1),
      folder: z.string(),
      by: z.string(),
    });

    const body = uploadFilesSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({
        success: false,
        status_code: 400,
        errors: body.error.flatten(),
      });
    }

    try {
      const urls: { key: string; url: string }[] = [];

      for (const file of body.data.files) {
        const key = `${body.data.folder}${file.filename}`;

        const command = new PutObjectCommand({
          Bucket: process.env.MODE === "prod" ? "ruangobat" : "ruangobatdev",
          Key: key,
          ContentType: file.type,
          ACL: "public-read",
          Metadata: {
            "x-created-by": body.data.by,
          },
        });

        const result = await getSignedUrl(s3, command, { expiresIn: 3600 });

        urls.push({
          key,
          url: result,
        });
      }

      res.status(200).json({
        success: true,
        status_code: 200,
        data: urls,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        status_code: 500,
        message: "Error pada cloud storage saat mendapatkan URL presigned",
      });
    }
  }
}
