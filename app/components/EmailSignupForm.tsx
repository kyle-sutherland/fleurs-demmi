'use client'

import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { TurnstileWidget } from '@/app/components/TurnstileWidget'

type FormValues = { name: string; email: string; website: string }

export default function EmailSignupForm() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  const onTurnstileToken = useCallback((t: string) => setTurnstileToken(t), [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  const onSubmit = async (data: FormValues) => {
    setServerError('')
    try {
      await axios.post('/api/subscribe', { ...data, turnstile: turnstileToken })
      setSubmitted(true)
    } catch {
      setServerError('Something went wrong. Please try again.')
    }
  }

  if (submitted) {
    return (
      <p className="mt-8 font-sans text-sm text-foreground/70">
        You&apos;re on the list! Talk soon.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-5 md:flex-row md:items-end">
      {/* Honeypot */}
      <input {...register('website')} type="text" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />

      <input type="hidden" {...register('name')} />
      <div className="flex-1 flex items-center border-2 border-orange-500 rounded-full bg-foreground/5 pr-1 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:flex-none md:contents">
        <input
          type="email"
          placeholder="Email"
          {...register('email', {
            required: 'Email is required.',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address.',
            },
          })}
          className="flex-1 bg-transparent font-sans text-sm px-5 py-3 focus:outline-none w-full placeholder:text-foreground/40 md:border-2 md:border-orange-500 md:rounded-full md:bg-foreground/5 md:focus:border-orange-400"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="md:hidden font-sans text-xs font-semibold uppercase tracking-widest text-foreground/70 px-4 py-2 whitespace-nowrap disabled:opacity-50"
        >
          {isSubmitting ? '…' : 'Subscribe'}
        </button>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="hidden md:block font-sans text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-4 py-2 hover:bg-orange-500 hover:border-[#E6E6FA] hover:text-[#E6E6FA] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Subscribing…' : 'Subscribe'}
      </button>
      {(errors.email || serverError) && (
        <p className="font-sans text-xs text-red-600">
          {errors.email?.message ?? serverError}
        </p>
      )}
      <TurnstileWidget onToken={onTurnstileToken} />
    </form>
  )
}
