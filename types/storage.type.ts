export interface Storage {
  $metadata: Metadata;
  CommonPrefixes?: CommonPrefix[];
  Contents?: Content[];
  Delimiter: string;
  IsTruncated: boolean;
  Marker: string;
  MaxKeys: number;
  Name: string;
  Prefix: string;
}

export interface Metadata {
  httpStatusCode: number;
  requestId: string;
  attempts: number;
  totalRetryDelay: number;
}

export interface CommonPrefix {
  Prefix: string;
}

export interface Content {
  Key: string;
  LastModified: Date;
  ETag: string;
  Size: number;
  StorageClass: string;
  Owner: Owner;
}

export interface Owner {
  DisplayName: string;
  ID: string;
}
