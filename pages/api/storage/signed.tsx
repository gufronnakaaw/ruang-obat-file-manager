import { s3 } from "@/libs/aws";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
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

  if (!req.query.key) {
    return res.status(400).json({
      success: false,
      status_code: 400,
      message: "Key is required",
    });
  }

  if (req.method === "GET") {
    try {
      const command = new GetObjectCommand({
        Bucket:
          process.env.NEXT_PUBLIC_MODE === "prod"
            ? "ruangobat"
            : "ruangobatdev",
        Key: req.query.key as string,
        ResponseContentDisposition: "inline",
      });

      return res.status(200).json({
        success: true,
        status_code: 200,
        data: {
          url: await getSignedUrl(s3, command, { expiresIn: 60 * 30 }),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        status_code: 500,
        message: "Error pada cloud storage saat mendapatkan URL signed",
      });
    }
  }
}
