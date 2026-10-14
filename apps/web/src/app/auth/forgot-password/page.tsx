import { isEmailDeliveryConfigured } from "@/server/notifications/email";
import { PasswordForm } from "../password-form";

export default function ForgotPasswordPage() {
  return <PasswordForm mode="request" available={isEmailDeliveryConfigured()} />;
}
