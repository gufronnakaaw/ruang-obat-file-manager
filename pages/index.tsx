import Layout from "@/components/Layout";
import { SuccessResponse } from "@/types/global.type";
import { Storage } from "@/types/storage.type";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useEffect, useState } from "react";
import useSWR from "swr";

export default function Home({
  token,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const {
    data: dataStorage,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<SuccessResponse<Storage>>({
    url: "/storage?prefix=contents/",
    method: "GET",
    token,
  });

  const [data, setData] = useState<
    {
      Key: string;
      LastModified?: Date | null;
      Size: number;
      IsFolder: boolean;
    }[]
  >([]);

  useEffect(() => {
    if (dataStorage) {
      const formattedData =
        dataStorage.data.CommonPrefixes?.map((prefix) => ({
          Key: prefix.Prefix,
          LastModified: null,
          Size: 0,
          IsFolder: true,
        })) || [];

      const contentsData =
        dataStorage.data.Contents?.filter((item) => {
          return !(item.Key?.endsWith("/") && item.Size === 0);
        }).map((content) => ({
          Key: content.Key,
          LastModified: content.LastModified,
          Size: content.Size,
          IsFolder: false,
        })) || [];

      setData([...formattedData, ...contentsData]);
    }
  }, [dataStorage]);

  return (
    <Layout
      data={data}
      isLoading={isLoading}
      prefix={dataStorage?.data?.Prefix || ""}
      mutate={mutate}
      isValidating={isValidating}
      bucket={dataStorage?.data?.Name || ""}
      endpoint={dataStorage?.data?.Endpoint || ""}
    />
  );
}

export const getServerSideProps: GetServerSideProps<{
  token: string;
}> = async ({ req }) => {
  return {
    props: {
      token: req.headers["access_token"] as string,
    },
  };
};
