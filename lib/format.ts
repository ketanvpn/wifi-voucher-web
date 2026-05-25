export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function maskPhone(phone?: string): string {
  if (!phone) return "";
  if (phone.length <= 5) return phone;
  return `${phone.slice(0, 3)}••••${phone.slice(-3)}`;
}
