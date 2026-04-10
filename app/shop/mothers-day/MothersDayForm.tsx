'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'

type FormValues = {
  name: string
  email: string
  phone: string
  fulfillment: 'pickup' | 'delivery'
  address?: string
  delivery_time?: string
  bouquet_style: string
  custom_bouquet?: string
  style_notes?: string
  card_to?: string
  card_message?: string
}

function Field({
  label, name, type, hint, required, register, error,
}: {
  label: string
  name: keyof FormValues
  type: string
  hint?: string
  required?: boolean
  register: ReturnType<typeof useForm<FormValues>>['register']
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="font-sans text-xs uppercase tracking-widest font-semibold">
        {label}{required && ' *'}
      </label>
      {hint && <p className="font-sans text-xs text-foreground/50 -mt-0.5">{hint}</p>}
      <input
        id={name}
        type={type}
        {...register(name, { required })}
        className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple"
      />
      {error && <p className="font-sans text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Textarea({
  label, name, rows, register,
}: {
  label: string
  name: keyof FormValues
  rows: number
  register: ReturnType<typeof useForm<FormValues>>['register']
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">{label}</label>
      )}
      <textarea
        {...register(name)}
        rows={rows}
        className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple resize-none"
      />
    </div>
  )
}

export default function MothersDayForm() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { fulfillment: 'pickup' },
  })

  const fulfillment = watch('fulfillment')

  const onSubmit = async (data: FormValues) => {
    setServerError('')
    try {
      await axios.post('/api/contact-mothers-day', data)
      setSubmitted(true)
    } catch {
      setServerError('Something went wrong. Please try again or email us directly.')
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mt-12 font-sans text-base leading-relaxed">
        <p className="font-display font-black text-4xl mb-4">Thank you!</p>
        <p>Your order has been received. Emmi will be in touch shortly to confirm details and arrange payment.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 max-w-2xl mt-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Name" name="name" type="text" required register={register} error={errors.name?.message} />
        <Field label="Email" name="email" type="email" required register={register} error={errors.email?.message} />
      </div>
      <Field label="Phone" name="phone" type="tel" required register={register} error={errors.phone?.message} />

      {/* Fulfillment */}
      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">
          Fulfillment *
        </label>
        <div className="flex flex-col gap-2 font-sans text-sm">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" value="pickup" {...register('fulfillment')} className="accent-purple" />
            Pick up in Mile End — Fri May 2nd, 10am–5pm
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" value="delivery" {...register('fulfillment')} className="accent-purple" />
            Delivery — Sat May 3rd (+$10)
          </label>
        </div>
      </div>

      {fulfillment === 'delivery' && (
        <>
          <Field label="Delivery Address" name="address" type="text" required register={register} error={errors.address?.message} />
          <Field label="Preferred Delivery Time" name="delivery_time" type="text" hint="e.g. Morning, Afternoon" register={register} />
        </>
      )}

      {/* Bouquet selection */}
      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">
          $60 Bouquet Style *
        </label>
        <select
          {...register('bouquet_style', { required: true })}
          className="border-2 border-foreground bg-background font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple appearance-none"
        >
          <option value="">Select a style…</option>
          <option value="soft_warm">Soft &amp; Warm</option>
          <option value="bold_bright">Bold &amp; Bright</option>
        </select>
        {errors.bouquet_style && (
          <p className="font-sans text-xs text-red-600">Please select a bouquet style.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-sans text-xs uppercase tracking-widest font-semibold">
          Custom Bouquet
        </label>
        <select
          {...register('custom_bouquet')}
          className="border-2 border-foreground bg-background font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple appearance-none"
        >
          <option value="">None</option>
          <option value="80">Custom Bouquet — $80</option>
          <option value="100">Custom Bouquet — $100</option>
        </select>
      </div>

      <Textarea label="Notes on Style / Colour" name="style_notes" rows={3} register={register} />

      {/* Card */}
      <div className="flex flex-col gap-2 p-5 bg-foreground/5">
        <p className="font-sans text-xs uppercase tracking-widest font-semibold">
          Add a Card — $4 (optional)
        </p>
        <Field label="Name of Mother" name="card_to" type="text" register={register} />
        <Textarea label="Message" name="card_message" rows={3} register={register} />
      </div>

      {/* Payment placeholder */}
      <div className="p-4 border-2 border-dashed border-foreground/30 font-sans text-sm text-foreground/50 text-center">
        Payment integration coming soon
      </div>

      {serverError && (
        <p className="font-sans text-sm text-red-600">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start font-sans font-semibold text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending…' : 'Check Out'}
      </button>
    </form>
  )
}
