import { s3 } from "@/libs/aws";
import {
  CopyObjectCommand,
  CopyObjectCommandInput,
  DeleteObjectCommand,
  ListObjectsCommand,
} from "@aws-sdk/client-s3";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  const { oldKey, newKey, isFolder } = req.body;

  const Bucket =
    process.env.NEXT_PUBLIC_MODE === "prod" ? "ruangobat" : "ruangobatdev";

  try {
    if (isFolder) {
      const listed = await s3.send(
        new ListObjectsCommand({ Bucket, Prefix: oldKey }),
      );
      const objects = listed.Contents || [];
      for (const obj of objects) {
        const srcKey = obj.Key!;
        const destKey = srcKey.replace(oldKey, newKey);
        await s3.send(
          new CopyObjectCommand({
            Bucket,
            CopySource: `${Bucket}/${encodeURIComponent(srcKey)}`,
            Key: destKey,
          } as CopyObjectCommandInput),
        );
        await s3.send(new DeleteObjectCommand({ Bucket, Key: srcKey }));
      }
    } else {
      await s3.send(
        new CopyObjectCommand({
          Bucket,
          CopySource: `${Bucket}/${encodeURIComponent(oldKey)}`,
          Key: newKey,
        } as CopyObjectCommandInput),
      );
      await s3.send(new DeleteObjectCommand({ Bucket, Key: oldKey }));
    }

    return res
      .status(200)
      .json({ success: true, message: "Renamed successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to rename", error });
  }
}
