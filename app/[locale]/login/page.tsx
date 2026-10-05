import {LoginForm} from "@/components/auth/login-form";
import {redirect} from "@/i18n/navigation";
import {hasValidSession} from "@/lib/auth/session";

interface LoginPageProps {
  params: Promise<{locale: "ar" | "en"}>;
}

export default async function LoginPage({params}: LoginPageProps) {
  const {locale} = await params;
  if (await hasValidSession()) redirect({href: "/", locale});

  return <LoginForm />;
}
