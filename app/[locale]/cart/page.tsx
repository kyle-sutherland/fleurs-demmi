import Link from 'next/link'
import { cookies } from 'next/headers'
import SiteHeader from '@/app/components/SiteHeader'
import { CartItemControls } from '@/app/components/CartItemControls'
import { parseCart, cartTotal } from '@/app/lib/cart'

export const metadata = {
  title: "Cart — Fleurs d'Emmi",
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const cookieStore = await cookies()
  const cart = parseCart(cookieStore.get('cart')?.value)
  const total = cartTotal(cart)

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader locale={locale} active="shop" />

      <main className="mx-8 md:mx-32 mt-10 md:mt-16 pb-24">
        <h1 className="font-display font-black text-[14vw] md:text-[6vw] leading-none">
          Your Cart
        </h1>

        {cart.items.length === 0 ? (
          <div className="mt-12 flex flex-col gap-5">
            <p className="font-sans text-base text-foreground/60">Your cart is empty.</p>
            <Link
              href={`/${locale}/shop`}
              className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-8 py-3 hover:bg-orange-500 hover:border-[#E6E6FA] hover:text-[#E6E6FA] transition-colors"
            >
              Browse the Shop
            </Link>
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-12 md:flex-row md:gap-16 md:items-start">
            {/* Item list */}
            <div className="flex-1 flex flex-col divide-y-2 divide-foreground/10">
              {cart.items.map((item) => (
                <div key={item.id} className="py-6 flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-display font-black text-xl leading-tight">{item.name}</p>
                    <p className="font-display font-black text-xl whitespace-nowrap">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {item.options && Object.keys(item.options).length > 0 && (
                    <p className="font-sans text-xs text-foreground/50">
                      {Object.entries(item.options)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                  )}

                  <p className="font-sans text-sm text-foreground/60">
                    ${item.price.toFixed(2)} each
                  </p>

                  <CartItemControls id={item.id} quantity={item.quantity} />
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="md:w-72 flex flex-col gap-5 border-2 border-foreground/20 p-6">
              <p className="font-display font-black text-xl">Order Summary</p>

              <div className="flex justify-between font-sans text-sm text-foreground/70">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <div className="border-t-2 border-foreground/10 pt-4 flex justify-between font-display font-black text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <Link
                href="/checkout"
                className="font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-8 py-3 text-center hover:bg-orange-500 hover:border-[#E6E6FA] hover:text-[#E6E6FA] transition-colors"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t-2 border-foreground/10 mt-auto py-8 text-center text-xs font-sans text-foreground/50">
        &copy; {new Date().getFullYear()} Fleurs d&apos;Emmi · Montréal, QC
      </footer>
    </div>
  )
}
