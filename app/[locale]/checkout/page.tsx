import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import SiteHeader from '@/app/components/SiteHeader'
import { CheckoutForm } from '@/app/components/CheckoutForm'
import { parseCart, cartTotal, type CartItem } from '@/app/lib/cart'
import { getPickupLocation } from '@/app/lib/appointments'
import { getDictionary } from '@/lib/i18n'

export const metadata = {
  title: "Checkout — Fleurs d'Emmi",
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = getDictionary(locale)
  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get('cart')?.value)

  if (cart.items.length === 0) redirect(`/${locale}/cart`)

  const needsPickup = cart.items.some(
    (i) => !i.productId.startsWith('delivery-surcharge:') && !i.options?.pickup
  )
  const hasDelivery = cart.items.some((i) => i.options?.pickup === 'Delivery')

  const sdkUrl = process.env.SQUARE_ENVIRONMENT === 'production'
    ? 'https://web.squarecdn.com/v1/square.js'
    : 'https://sandbox.web.squarecdn.com/v1/square.js'
  const pickupLocation = needsPickup ? await getPickupLocation() : null

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="mx-8 md:mx-32 mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[11vw] md:text-[5vw] leading-none">
          {t.checkout.heading}
        </h1>

        <div className="mt-10 flex flex-col md:flex-row gap-12 md:gap-16 items-start">
          <div className="flex-1 max-w-lg">
            <CheckoutForm
              applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!}
              locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!}
              sdkUrl={sdkUrl}
              total={cartTotal(cart)}
              subscribeLabel={t.footer.subscribeLabel}
              locale={locale}
              formT={t.checkout.form}
              schedulerT={t.checkout.scheduler}
              pickupLocation={pickupLocation}
              needsPickup={needsPickup}
              hasDelivery={hasDelivery}
            />
          </div>

          <aside className="w-full md:w-72 border-2 border-foreground/20 p-6 md:sticky md:top-8">
            <h2 className="font-display font-black text-base mb-4">{t.checkout.orderSummary}</h2>
            <ul className="flex flex-col gap-3">
              {cart.items.map((item: CartItem) => (
                <li key={item.id} className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-sans text-sm font-semibold">{item.name}</p>
                    {item.options && Object.keys(item.options).length > 0 && (
                      <p className="font-sans text-xs text-foreground/60">
                        {Object.values(item.options).join(' · ')}
                      </p>
                    )}
                    <p className="font-sans text-xs text-foreground/60">
                      ${item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-sans text-sm font-semibold shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t-2 border-foreground/10 mt-4 pt-4 flex justify-between items-center font-display font-black text-base">
              <span>{t.checkout.form.total}</span>
              <span>${cartTotal(cart).toFixed(2)} CAD</span>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t-2 border-foreground/10 mt-auto py-8 text-center text-xs font-sans text-foreground/50">
        &copy; {new Date().getFullYear()} Fleurs d&apos;Emmi · Montréal, QC
      </footer>
    </div>
  )
}
