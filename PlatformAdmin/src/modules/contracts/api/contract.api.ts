import { httpClient, downloadBlob } from "@/lib/api/http-client";
import { RestClient } from "@/lib/api/rest-client";
import type { ContractDto, CreateContractDto, UpdateContractDto } from "@/modules/contracts/types/contract.types";

class ContractClient extends RestClient<ContractDto, CreateContractDto, UpdateContractDto> {
  async downloadPdf(id: string, filename: string) {
    const response = await httpClient.get(`${this.resourcePath}/${id}/pdf`, { responseType: "blob" });
    downloadBlob(response.data as Blob, filename);
  }
}

export const contractApi = new ContractClient("/contracts");
