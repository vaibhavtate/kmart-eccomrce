import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";
import { Suspense } from "react";

export const metadata = {
  title: "Login - K MART",
  description: "Sign in to K MART for instant grocery delivery and exclusive savings.",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="p-8 text-center text-sm font-medium text-gray-500">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
