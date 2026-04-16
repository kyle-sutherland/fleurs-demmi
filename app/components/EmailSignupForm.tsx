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
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex flex-col gap-1 flex-1">
          <label className="font-sans text-xs uppercase tracking-widest font-semibold text-foreground">
            Name
          </label>
          <input
            type="text"
            {...register('name', { required: 'Name is required.' })}
            className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple w-full"
          />
          {errors.name && (
            <p className="font-sans text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="font-sans text-xs uppercase tracking-widest font-semibold text-foreground">
            Email
          </label>
          <input
            type="email"
            {...register('email', {
              required: 'Email is required.',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address.',
              },
            })}
            className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple w-full"
          />
          {errors.email && (
            <p className="font-sans text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="md:mt-[1.625rem] font-sans text-sm uppercase tracking-widest border-2 border-foreground text-foreground px-10 py-3 hover:bg-foreground hover:text-background transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      {serverError && (
        <p className="font-sans text-xs text-red-600">{serverError}</p>
      )}
    </form>
  )
}
