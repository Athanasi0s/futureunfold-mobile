import { register } from "@/api/features/auth";
import type { RegisterBody } from "@/api/schemas";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";

export function useRegister() {
  return useMutation({
    mutationFn: async (body: RegisterBody) => {
      return await register(body);
    },
    onError: (e: any) => {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Registration failed. Please try again.";
      Alert.alert("Registration error", String(msg));
    },
  });
}
