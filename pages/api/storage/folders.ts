import { s3 } from "@/libs/aws";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import z from "zod";
import { authOptions } from "../auth/[...nextauth]";

const createFolderSchema = z.object({
  name: z.string(),
  folder: z.string(),
  by: z.string(),
});

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
    const body = createFolderSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({
        success: false,
        status_code: 400,
        errors: body.error.flatten(),
      });
    }

    try {
      const result = await s3.send(
        new PutObjectCommand({
          Bucket: process.env.MODE === "prod" ? "ruangobat" : "ruangobatdev",
          Key: `${body.data.folder + body.data.name}/`,
          Body: Buffer.alloc(0),
          ACL: "public-read",
          Metadata: {
            "x-created-by": body.data.by,
          },
          ContentType: "application/x-directory",
        }),
      );

      return res.status(200).json({
        success: true,
        status_code: 200,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        status_code: 500,
        message: "Error pada cloud storage saat membuat folder",
      });
    }
  }
}
