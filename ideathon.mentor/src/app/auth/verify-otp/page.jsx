import { redirect } from 'next/navigation';

// Password recovery uses the e-mail code on the reset-password page.
export default function VerifyOtpPage() {
  redirect('/auth/forgot-password');
}
