export type TransferCardType = "BANK" | "EMONEY" | "EWALLET" | "PAYLATER";

const CAN_SEND: string[] = ["BANK", "EWALLET"];
const CAN_RECEIVE: string[] = ["BANK", "EWALLET", "EMONEY"];

const LABEL: Record<string, string> = {
  BANK: "Bank",
  EWALLET: "E-Wallet",
  EMONEY: "E-Money",
  PAYLATER: "Paylater",
};

export const canSendTransfer = (type: string) => CAN_SEND.includes(type);
export const canReceiveTransfer = (type: string) => CAN_RECEIVE.includes(type);

/** Mengembalikan pesan error, atau null kalau pasangan kartu valid. */
export function validateTransferTypes(
  fromType: string,
  toType: string,
): string | null {
  if (fromType === "PAYLATER" || toType === "PAYLATER") {
    return "Kartu Paylater tidak bisa digunakan untuk transfer";
  }
  if (!canSendTransfer(fromType)) {
    return `Kartu ${LABEL[fromType] ?? fromType} hanya bisa menerima, tidak bisa mengirim transfer`;
  }
  if (!canReceiveTransfer(toType)) {
    return `Kartu ${LABEL[toType] ?? toType} tidak bisa menerima transfer`;
  }
  return null;
}
