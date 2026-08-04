"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/env";
import { getSiteUrl } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Introduce un correo válido."), password: z.string().min(8, "Usa al menos 8 caracteres."), username: z.string().min(3, "Usa al menos 3 caracteres.").max(30).regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo.").optional() });
type FormValues = z.infer<typeof schema>;

const signUpErrorMessages: Record<string, string> = {
  email_address_invalid: "El correo no tiene un formato válido.",
  email_address_not_authorized: "Supabase todavía no está autorizado para enviar correos a esta dirección. Configura un SMTP propio o usa un correo autorizado para pruebas.",
  email_exists: "Este correo ya está registrado.",
  over_email_send_rate_limit: "Se alcanzó temporalmente el límite de correos. Espera unos minutos e inténtalo de nuevo.",
  signup_disabled: "El registro de nuevas cuentas está deshabilitado en Supabase.",
  user_already_exists: "Este correo ya está registrado.",
  weak_password: "La contraseña no cumple los requisitos de seguridad de Supabase.",
};

const signInErrorMessages: Record<string, string> = {
  email_not_confirmed: "Debes confirmar tu correo antes de acceder.",
  invalid_credentials: "El correo o la contraseña no coinciden.",
  over_request_rate_limit: "Se hicieron demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  email_provider_disabled: "El acceso mediante correo y contraseña está deshabilitado.",
  captcha_failed: "No se pudo completar la verificación de seguridad. Recarga la página e inténtalo de nuevo.",
};

function getSignUpErrorMessage(error: { code?: string; message: string; status?: number }) {
  const code = getSignUpErrorCode(error);
  if (signUpErrorMessages[code]) return signUpErrorMessages[code];
  if (/database error saving new user/i.test(error.message)) return "Supabase no pudo crear el perfil asociado a la cuenta.";
  if (/failed to fetch|network/i.test(error.message)) return "No se pudo conectar con Supabase. Comprueba tu conexión e inténtalo de nuevo.";
  return "Supabase rechazó el registro. Revisa el código del error para identificar la causa.";
}

function getSignUpErrorCode(error: { code?: string; message: string }) {
  if (error.code) return error.code;
  if (/email rate limit exceeded/i.test(error.message)) return "over_email_send_rate_limit";
  if (/email address not authorized/i.test(error.message)) return "email_address_not_authorized";
  if (/user already registered|already exists/i.test(error.message)) return "user_already_exists";
  if (/password/i.test(error.message) && /weak|least|characters/i.test(error.message)) return "weak_password";
  return "auth_error";
}

function getSignInErrorCode(error: { code?: string; message: string }) {
  if (error.code) return error.code;
  if (/email not confirmed/i.test(error.message)) return "email_not_confirmed";
  if (/invalid login credentials/i.test(error.message)) return "invalid_credentials";
  if (/rate limit|too many requests/i.test(error.message)) return "over_request_rate_limit";
  if (/failed to fetch|network/i.test(error.message)) return "network_error";
  return "auth_error";
}

function getSignInErrorMessage(error: { code?: string; message: string }) {
  const code = getSignInErrorCode(error);
  if (signInErrorMessages[code]) return signInErrorMessages[code];
  if (code === "network_error") return "No se pudo conectar con Supabase. Comprueba tu conexión e inténtalo de nuevo.";
  return "No pudimos iniciar sesión. Vuelve a intentarlo.";
}

export function AuthForm() {
  const params = useSearchParams(); const [registering, setRegistering] = useState(false); const [showPassword, setShowPassword] = useState(false); const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null); const [resending, setResending] = useState(false);
  const { register, handleSubmit, getValues, reset, clearErrors, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema), shouldUnregister: true, defaultValues: { email: "", password: "", username: "" } });
  const configured = isSupabaseConfigured;
  const returnTo = params.get("retorno")?.startsWith("/") && !params.get("retorno")?.startsWith("//") ? params.get("retorno")! : "/inicio";

  function changeMode() {
    const email = getValues("email");
    reset({ email, password: "", username: "" });
    clearErrors();
    setShowPassword(false);
    setUnconfirmedEmail(null);
    setRegistering((current) => !current);
  }

  async function resendConfirmation() {
    if (!unconfirmedEmail || resending) return;
    setResending(true);
    const { error } = await createClient().auth.resend({ type: "signup", email: unconfirmedEmail, options: { emailRedirectTo: `${getSiteUrl()}/auth/callback?retorno=${encodeURIComponent(returnTo)}` } });
    setResending(false);
    if (error) toast.error("No pudimos reenviar la confirmación.", { description: `Código: ${error.code ?? "auth_error"}` });
    else toast.success("Te enviamos un nuevo correo de confirmación.");
  }

  async function submit(values: FormValues) {
    if (!configured) { toast.error("Completa las variables de Supabase para habilitar el acceso."); return; }
    const supabase = createClient();
    if (registering) {
      const { data, error } = await supabase.auth.signUp({ email: values.email, password: values.password, options: { data: { username: values.username }, emailRedirectTo: `${getSiteUrl()}/auth/callback?retorno=${encodeURIComponent(returnTo)}` } });
      if (error) {
        const code = getSignUpErrorCode(error);
        console.error("[auth:sign-up]", { code, status: error.status, message: error.message });
        toast.error(getSignUpErrorMessage(error), { description: code === "auth_error" ? `Detalle: ${error.message}` : `Código: ${code}` });
        return;
      }
      if (data.session) {
        toast.success("Cuenta creada correctamente.");
        window.location.assign(returnTo);
        return;
      }
      setUnconfirmedEmail(values.email);
      toast.success("Revisa tu correo para confirmar la cuenta.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
      if (error) {
        const code = getSignInErrorCode(error);
        console.error("[auth:sign-in]", { code, status: error.status, message: error.message });
        if (code === "email_not_confirmed") setUnconfirmedEmail(values.email);
        toast.error(getSignInErrorMessage(error), { description: `Código: ${code}` });
        return;
      }
      if (!data.session) { toast.error("Supabase no creó una sesión. Vuelve a intentarlo."); return; }
      window.location.assign(returnTo);
    }
  }
  async function google() { if (!configured) { toast.error("Completa las variables de Supabase para habilitar Google."); return; } const supabase = createClient(); await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${getSiteUrl()}/auth/callback?retorno=${encodeURIComponent(params.get("retorno") ?? "/inicio")}` } }); }
  return <div><div className="mb-7"><h1 className="text-3xl font-black tracking-tight">{registering ? "Crea tu cuenta" : "Qué bueno verte de nuevo"}</h1><p className="mt-2 text-sm text-muted-foreground">{registering ? "Empieza a construir tu universo personal." : "Continúa justo donde lo dejaste."}</p></div>{!configured && <div className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-5 text-amber-700 dark:text-amber-300">El modo de exploración está activo. Configura <code>.env.local</code> para habilitar las cuentas.</div>}{unconfirmedEmail && <div className="mb-5 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs leading-5"><p>La cuenta <strong>{unconfirmedEmail}</strong> necesita confirmar su correo.</p><button type="button" onClick={resendConfirmation} disabled={resending} className="mt-1 font-bold text-primary hover:underline disabled:opacity-50">{resending ? "Reenviando…" : "Reenviar confirmación"}</button></div>}<Button type="button" variant="outline" className="w-full" onClick={google}><span className="text-base font-black">G</span>Continuar con Google</Button><div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-border"/><span className="text-xs text-muted-foreground">o con correo</span><span className="h-px flex-1 bg-border"/></div><form onSubmit={handleSubmit(submit)} className="space-y-4">{registering && <label className="block text-sm font-semibold">Nombre de usuario<Input autoComplete="username" placeholder="tu_usuario" className="mt-2 font-normal" {...register("username")}/>{errors.username && <span className="mt-1 block text-xs text-destructive">{errors.username.message}</span>}</label>}<label className="block text-sm font-semibold">Correo electrónico<div className="relative mt-2"><Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input type="email" autoComplete="email" placeholder="tu@correo.com" className="pl-10 font-normal" {...register("email")}/></div>{errors.email && <span className="mt-1 block text-xs text-destructive">{errors.email.message}</span>}</label><label className="block text-sm font-semibold">Contraseña<div className="relative mt-2"><Input key={registering ? "register-password" : "login-password"} type={showPassword ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} placeholder="Mínimo 8 caracteres" className="pr-10 font-normal" {...register("password")}/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}</button></div>{errors.password && <span className="mt-1 block text-xs text-destructive">{errors.password.message}</span>}</label><Button className="w-full" size="lg" disabled={isSubmitting || !configured}>{isSubmitting && <Loader2 className="size-4 animate-spin"/>}{registering ? "Crear cuenta" : "Acceder"}</Button></form><p className="mt-6 text-center text-sm text-muted-foreground">{registering ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"} <button type="button" onClick={changeMode} className="font-semibold text-primary hover:underline">{registering ? "Accede" : "Regístrate"}</button></p></div>;
}
