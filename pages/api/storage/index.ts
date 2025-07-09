import { s3 } from "@/libs/aws";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsCommand,
} from "@aws-sdk/client-s3";
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

  if (req.method === "GET") {
    try {
      const result = await s3.send(
        new ListObjectsCommand({
          Bucket: process.env.MODE === "prod" ? "ruangobat" : "ruangobatdev",
          Prefix: req.query.prefix as string,
          Delimiter: "/",
        }),
      );

      res.status(200).json({
        success: true,
        status_code: 200,
        data: result,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        status_code: 500,
        message: "Error pada cloud storage saat mendapatkan daftar objek",
      });
    }
  }

  if (req.method === "DELETE") {
    const deleteFolderSchema = z.object({
      key: z.string(),
      is_folder: z.string(),
    });

    const body = deleteFolderSchema.safeParse(req.query);

    if (!body.success) {
      return res.status(400).json({
        success: false,
        status_code: 400,
        errors: body.error.flatten(),
      });
    }

    try {
      if (req.query.is_folder === "true") {
        const objects = await s3.send(
          new ListObjectsCommand({
            Bucket: process.env.MODE === "prod" ? "ruangobat" : "ruangobatdev",
            Prefix: body.data.key.endsWith("/")
              ? body.data.key
              : `${body.data.key}/`,
          }),
        );

        const keys = objects.Contents?.map((obj) => ({ Key: obj.Key })) ?? [];

        if (
          !keys.find(
            (obj) =>
              obj.Key ===
              (body.data.key.endsWith("/")
                ? body.data.key
                : `${body.data.key}/`),
          )
        ) {
          keys.push({
            Key: body.data.key.endsWith("/")
              ? body.data.key
              : `${body.data.key}/`,
          });
        }

        if (keys.length) {
          await s3.send(
            new DeleteObjectsCommand({
              Bucket:
                process.env.MODE === "prod" ? "ruangobat" : "ruangobatdev",
              Delete: {
                Objects: keys,
              },
            }),
          );

          return res.status(200).json({
            success: true,
            status_code: 200,
            message: "Berhasil menghapus folder",
          });
        }
      } else {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.MODE === "prod" ? "ruangobat" : "ruangobatdev",
            Key: req.query.key as string,
          }),
        );

        return res.status(200).json({
          success: true,
          status_code: 200,
          message: "Berhasil menghapus file",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        status_code: 500,
        message: `Error pada cloud storage saat menghapus ${body.data.is_folder === "true" ? "folder" : "file"}`,
      });
    }
  }
}
