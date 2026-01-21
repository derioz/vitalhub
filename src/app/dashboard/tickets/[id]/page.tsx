import { TicketDetailClient } from './client';

// Required for static export to pass build for dynamic routes.
export const dynamic = 'force-static';
export async function generateStaticParams() {
    return [{ id: 'demo' }];
}

export default async function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <TicketDetailClient id={id} />;
}
