import { DemoLargeProjectPaymentView } from "@/features/customer/projects/components/demo-payment-view";

interface PageProps {
  params: {
    projectId: string;
    paymentId: string;
  };
}

export default function LargeProjectDemoPaymentPage({ params }: PageProps) {
  return (
    <DemoLargeProjectPaymentView
      projectId={params.projectId}
      paymentId={params.paymentId}
    />
  );
}
