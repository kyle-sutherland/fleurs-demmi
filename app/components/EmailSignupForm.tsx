'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'

type FormValues = { name: string; email: string }

export default function EmailSignupForm() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  const onSubmit = async (data: FormValues) => {
    setServerError('')
    try {
      await axios.post('/api/subscribe', data)
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
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* Name — mobile: pill, desktop: square */}
        <div className="flex items-center border-2 border-orange-500 rounded-full bg-foreground/5 pr-1 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:flex-none md:flex-1 md:flex md:flex-col md:gap-0">
          <input
            type="text"
            placeholder="Name"
            {...register('name', { required: 'Name is required.' })}
            className="flex-1 bg-transparent font-sans text-sm px-5 py-3 focus:outline-none w-full placeholder:text-foreground/40 md:border-2 md:border-orange-500 md:rounded-full md:bg-foreground/5 md:focus:border-orange-400"
          />
        </div>
        {/* Email — mobile: pill, desktop: square */}
        <div className="flex items-center border-2 border-orange-500 rounded-full bg-foreground/5 pr-1 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:flex-none md:flex-1 md:flex md:flex-col md:gap-0">
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
          {/* Mobile inline submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="md:hidden font-sans text-xs font-semibold uppercase tracking-widest text-foreground/70 px-4 py-2 whitespace-nowrap disabled:opacity-50"
          >
            {isSubmitting ? '…' : 'Go'}
          </button>
        </div>
        {/* Desktop submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="hidden md:block self-start font-sans text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-4 py-2 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      {(errors.name || errors.email || serverError) && (
        <p className="font-sans text-xs text-red-600">
          {errors.name?.message ?? errors.email?.message ?? serverError}
        </p>
      )}
    </form>
  )
}
