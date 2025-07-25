import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { API_BASE_URL} from "../../constants/others";

const allAuthEndpoint = `${API_BASE_URL}/api/auth`;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      sessionToken: null,
      authStage: "signin",
      setAuthStage: (stage) => set({ authStage: stage }),

      signup: async ({ email, password, first_name, last_name }) => {
        // Prepare payload
        const username = email;
        const requestBody = JSON.stringify({
          email,
          username,
          password,
          first_name,
          last_name,
        });

        try {
          const response = await fetch(`${allAuthEndpoint}/signup`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: requestBody,
          });

          const data = await response.json();

          if (response.status === 401 && data.data && data.data.flows) {
            const verifyFlow = data.data.flows.find(
              (flow) => flow.id === "verify_email" && flow.is_pending
            );
            if (verifyFlow) {
              return {
                success: false,
                verification_pending: true,
                message:
                  "A verification email has been sent. Please check your inbox.",
              };
            }
          }
          return {
            success: false,
            errors: data.errors || [{ message: data.error || "Signup failed" }],
          };
        } catch (error) {
          console.error("Error during signup:", error);
          return {
            success: false,
            errors: [{ message: "Server error. Please try again later." }],
          };
        }
      },

      // ✅ Login User
      login: async (email, password) => {
        try {
          const response = await fetch(`${allAuthEndpoint}/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: email, password }),
            credentials: "include", // Đảm bảo cookie được gửi và nhận
          });

          const data = await response.json();

          if (response.ok) {
            // Session token is set in cookie by server, but JS can't read HttpOnly cookies.
            // So we just mark as authenticated and rely on cookie for future requests.
            set({
              user: data.user,
              isAuthenticated: true,
              sessionToken: null, // Can't access sessionid directly if HttpOnly
            });
            return { success: true, message: "Login successful!" };
          } else {
            return {
              success: false,
              message: data.error || "Invalid credentials",
            };
          }
        } catch (error) {
          console.error("Login failed:", error);
          return {
            success: false,
            message: "Server error. Please try again later.",
          };
        }
      },

      // ✅ Logout User
      logout: async () => {
        try {
          // Session token is not needed if using cookie-based auth
          const response = await fetch(`${allAuthEndpoint}/session`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (response.status === 200) {
            set({ user: null, isAuthenticated: false, sessionToken: null });
            return { success: true, message: "Logout successful!" };
          } else {
            return {
              success: false,
              message: "Logout completed, but API returned an error.",
            };
          }
        } catch (error) {
          console.error("Logout error:", error);
          return { success: false, message: "Server error. Try again later." };
        }
      },

      verifyEmail: async (verificationKey) => {
        try {
          const decodedKey = decodeURIComponent(verificationKey);
          const response = await fetch(`${allAuthEndpoint}/email/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ key: decodedKey }),
          });
          const data = await response.json();
          if (response.status === 401 && data.data && data.data.flows) {
            const verifyFlow = data.data.flows.find(
              (flow) => flow.id === "verify_email"
            );
            if (!verifyFlow) {
              return { success: true, message: "Email verified successfully!" };
            } else {
              return {
                success: false,
                error: data.error || "Verification is still pending.",
              };
            }
          } else {
            return {
              success: false,
              error: data.error || "Verification failed.",
            };
          }
        } catch (error) {
          console.error("Error in verifyEmail:", error);
          return { success: false, error: "Server error during verification." };
        }
      },

      resetPasswordFromKey: async ({ key, password }) => {
        try {
          const response = await fetch(`${allAuthEndpoint}/password/reset`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, password }),
          });
          const data = await response.json();

          if (response.ok) {
            set({
              user: data.user,
              isAuthenticated: true,
              sessionToken: data.meta?.session_token,
            });
            return { success: true, message: "Password reset successful!" };
          } else if (response.status === 401) {
            return {
              success: true,
              message: "Password reset successful. Please log in.",
            };
          } else {
            return {
              success: false,
              errors: data.errors || [
                { message: data.error || "Password reset failed" },
              ],
            };
          }
        } catch (error) {
          console.error("Error resetting password from key:", error);
          return {
            success: false,
            errors: [{ message: "Server error. Please try again later." }],
          };
        }
      },

      fetchUser: async () => {
        try {
          const response = await fetch(`${allAuthEndpoint}/session`, {
            headers: {
              "Content-Type": "application/json",
            },
          });

          const result = await response.json();
          if (result.status === 200 && result.data && result.data.user) {
            set({
              user: result.data.user,
              isAuthenticated: result.meta?.is_authenticated || true,
              sessionToken: result.meta?.session_token || get().sessionToken,
            });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error("Failed to fetch user", error);
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
