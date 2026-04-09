import { StorageProvider } from "@/lib/providers/contracts";

class NoopStorageProvider implements StorageProvider {
  async putObject() {
    return;
  }
  async getObject() {
    return null;
  }
}

export function getStorageProvider(): StorageProvider {
  return new NoopStorageProvider();
}
