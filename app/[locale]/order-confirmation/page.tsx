import Link from 'next/link'
import SiteHeader from '@/app/components/SiteHeader'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Order Confirmed — Fleurs d'Emmi",
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ orderId?: string }>
}) {
  const { locale } = await params
  const { orderId } = await searchParams

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="mx-8 md:mx-32 mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[11vw] md:text-[5vw] leading-none">
          Thank you!
        </h1>

        <p className="font-sans text-base mt-6 max-w-lg text-foreground/80 leading-relaxed">
          Your order has been received and your payment is confirmed. Emmi will be in touch soon
          with pickup or delivery details.
        </p>

        {orderId && (
          <p className="font-sans text-xs mt-4 text-foreground/40">
            Order reference: {orderId}
          </p>
        )}

        <Link
          href={`/${locale}/shop`}
          className="mt-10 self-start inline-block font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-8 py-3 hover:bg-orange-500 hover:border-[#E6E6FA] hover:text-[#E6E6FA] transition-colors"
        >
          Back to Shop
        </Link>
      </main>

      <footer className="border-t-2 border-foreground/10 mt-auto py-8 text-center text-xs font-sans text-foreground/50">
        &copy; {new Date().getFullYear()} Fleurs d&apos;Emmi · Montréal, QC
      </footer>
    </div>
  )
}
