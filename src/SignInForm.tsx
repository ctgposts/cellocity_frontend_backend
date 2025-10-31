"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).then(() => {
            // Reset submitting state on successful submission
            setSubmitting(false);
          }).catch((error) => {
            console.error("Authentication error:", error);
            let toastTitle = "";
            if (error.message?.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else if (error.message?.includes("Could not find user")) {
              toastTitle = "No account found with this email. Please sign up.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in. Please check your credentials or sign up."
                  : "Could not sign up. Email might already be registered.";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? "Processing..." : (flow === "signIn" ? "Sign in" : "Sign up")}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>

      {/* Anonymous login option */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          className="w-full auth-button bg-gray-500 hover:bg-gray-600"
          onClick={() => {
            setSubmitting(true);
            void signIn("anonymous").catch((error) => {
              console.error("Anonymous sign-in error:", error);
              toast.error("Could not sign in anonymously. Please try email/password.");
              setSubmitting(false);
            });
          }}
          disabled={submitting}
        >
          {submitting ? "Processing..." : "Continue as Guest"}
        </button>
      </div>
    </div>
  );
}