import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from "@testing-library/react-native";

import { useLoginForm } from "@/features/authentication/hooks/useLoginForm";
import { useRegisterForm } from "@/features/authentication/hooks/useRegisterForm";

function useSubscribedLoginForm() {
  const form = useLoginForm();
  return { ...form, errors: form.formState.errors };
}

function useSubscribedRegisterForm() {
  const form = useRegisterForm();
  return { ...form, errors: form.formState.errors };
}

describe("authentication forms", () => {
  afterEach(() => {
    cleanup();
  });

  describe("login form", () => {
    test("starts with empty default values", () => {
      const { result } = renderHook(() => useSubscribedLoginForm());

      expect(result.current.getValues()).toEqual({
        email: "",
        password: "",
      });
    });

    test("rejects invalid email and empty password", async () => {
      const onValid = jest.fn();
      const { result } = renderHook(() => useSubscribedLoginForm());

      act(() => {
        result.current.setValue("email", "not-an-email");
        result.current.setValue("password", "   ");
      });

      await act(async () => {
        await result.current.handleSubmit(onValid)();
      });

      expect(onValid).not.toHaveBeenCalled();
      expect(result.current.errors.email?.message).toBe(
        "Please enter a valid email address",
      );
      expect(result.current.errors.password?.message).toBe(
        "Password is required",
      );
    });

    test("trims valid login credentials before submit", async () => {
      const onValid = jest.fn();
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.setValue("email", "  user@example.com  ");
        result.current.setValue("password", "  password  ");
      });

      await act(async () => {
        await result.current.handleSubmit(onValid)();
      });

      expect(onValid).toHaveBeenCalledWith(
        {
          email: "user@example.com",
          password: "password",
        },
        undefined,
      );
    });
  });

  describe("registration form", () => {
    test("starts with empty default values", () => {
      const { result } = renderHook(() => useSubscribedRegisterForm());

      expect(result.current.getValues()).toEqual({
        full_name: "",
        email: "",
        company: "",
        password: "",
      });
    });

    test.each([
      [
        "short name",
        { full_name: "A" },
        "full_name",
        "Name must be at least 2 characters",
      ],
      [
        "invalid email",
        { email: "invalid" },
        "email",
        "Please enter a valid email address",
      ],
      [
        "short password",
        { password: "Short!" },
        "password",
        "Password must be at least 8 characters",
      ],
      [
        "password without uppercase",
        { password: "password!" },
        "password",
        "Password must contain at least one uppercase letter",
      ],
      [
        "password without special character",
        { password: "Password1" },
        "password",
        "Password must contain at least one special character",
      ],
    ])("rejects %s", async (_case, values, field, message) => {
      const { result } = renderHook(() => useSubscribedRegisterForm());

      act(() => {
        result.current.setValue("full_name", "Valid User");
        result.current.setValue("email", "user@example.com");
        result.current.setValue("password", "Password!");
        for (const [name, value] of Object.entries(values)) {
          result.current.setValue(
            name as "full_name" | "email" | "password",
            value,
          );
        }
      });

      await act(async () => {
        await result.current.trigger();
      });

      await waitFor(() => {
        expect(
          result.current.errors[field as "full_name" | "email" | "password"]
            ?.message,
        ).toBe(message);
      });
    });

    test("trims valid registration data and allows an empty company", async () => {
      const onValid = jest.fn();
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.setValue("full_name", "  Valid User  ");
        result.current.setValue("email", "  user@example.com  ");
        result.current.setValue("company", "   ");
        result.current.setValue("password", "  Password!  ");
      });

      await act(async () => {
        await result.current.handleSubmit(onValid)();
      });

      expect(onValid).toHaveBeenCalledWith(
        {
          full_name: "Valid User",
          email: "user@example.com",
          company: "",
          password: "Password!",
        },
        undefined,
      );
    });
  });
});
