import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { Car } from "lucide-react";
import Link from "next/link";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Autoškola Šťastný</h1>
          <p className="text-blue-200 mt-2">Registrace studenta</p>
        </div>

        <RegisterForm />

        <p className="text-center text-blue-200 text-sm mt-6">
          Již máte účet?{" "}
          <Link href="/" className="text-white font-medium hover:underline">
            Přihlaste se
          </Link>
        </p>
      </div>
    </div>
  );
}
