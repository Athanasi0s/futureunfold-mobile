import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().transform((s) => s.trim()).pipe(z.email({ message: "Please enter a valid email address" })),
  password: z.string().trim().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export function useLoginForm() {
  return useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
}
