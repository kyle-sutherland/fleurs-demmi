import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import SiteHeader from '@/app/components/SiteHeader'
import { CheckoutForm } from '@/app/components/CheckoutForm'
import { parseCart, cartTotal } from '@/app/lib/cart'

export const metadata = {
  title: "Checkout — Fleurs d'Emmi",
}

export default async function CheckoutPage() {
  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get('cart')?.value)

  if (cart.items.length === 0) redirect('/cart')

  const sdkUrl =
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js'

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale="en" active="shop" />

      <main className="mx-8 md:mx-32 mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[11vw] md:text-[5vw] leading-none">
          Checkout
        </h1>

        <div className="mt-10 max-w-lg">
          <CheckoutForm
            applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!}
            locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!}
            sdkUrl={sdkUrl}
            total={cartTotal(cart)}
          />
        </div>
      </main>

      <footer className="border-t-2 border-foreground/10 mt-auto py-8 text-center text-xs font-sans text-foreground/50">
        &copy; {new Date().getFullYear()} Fleurs d&apos;Emmi · Montréal, QC
      </footer>
    </div>
  )
}
