import { InvoicePaymentView } from "@/features/customer/invoice-payment/invoice-payment-view";

interface InvoicePageProps {
  params: {
    bookingId: string;
  };
}

export default function CustomerInvoicePage({ params }: InvoicePageProps) {
  return <InvoicePaymentView bookingId={params.bookingId} />;
}
