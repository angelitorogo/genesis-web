export interface StorageMetadataEntity {
  readonly key:
    string;

  readonly schemaVersion:
    number;

  readonly storageFormatVersion:
    number;

  readonly updatedAtEpochMs:
    number;
}