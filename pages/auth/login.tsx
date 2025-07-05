import { getError } from "@/utils/getError";
import {
  EyeIcon,
  EyeSlashIcon,
  FolderIcon,
  LockIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Login() {
  const [input, setInput] = useState<{
    admin_id: string;
    password: string;
  }>({
    admin_id: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    try {
      const response = await signIn("credentials", {
        ...input,
        redirect: false,
      });

      if (response?.error) {
        const { error } = JSON.parse(response?.error);

        toast.error(error.message);
      }

      if (response?.ok) {
        toast.success("Yeay, anda berhasil login!");
        return (window.location.href = "/");
      }
    } catch (error) {
      console.error(error);

      toast.error(getError(error));
    }
  }

  function isFormEmpty() {
    return Object.values(input).every((value) => value.trim() !== "");
  }

  return (
    <div className="gradient-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 overflow-hidden rounded-xl bg-white p-8 shadow-2xl sm:p-10">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100">
              <FolderIcon className="text-3xl text-blue-600" />
              <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                <LockIcon className="text-xs text-white" />
              </div>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            RuangObat Files
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            File Management Untuk Ruang Obat
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email" className="sr-only">
                Username
              </label>
              <div className="relative">
                <input
                  required
                  className="input-focus relative block w-full rounded-lg border border-gray-300 px-4 py-3 pl-11 text-gray-900 placeholder-gray-500 focus:outline-none sm:text-sm"
                  placeholder="Admin ID"
                  onChange={(e) =>
                    setInput({
                      ...input,
                      admin_id: e.target.value,
                    })
                  }
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserIcon className="text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="input-focus relative block w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 pl-11 text-gray-900 placeholder-gray-500 focus:outline-none sm:text-sm"
                  placeholder="Password"
                  onChange={(e) =>
                    setInput({
                      ...input,
                      password: e.target.value,
                    })
                  }
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockIcon className="text-gray-400" />
                </div>
                <span
                  className="toggle-password absolute top-1/2 right-2 -translate-y-1/2 transform cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="text-gray-400" />
                  ) : (
                    <EyeIcon className="text-gray-400" />
                  )}
                </span>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="btn-gradient group relative flex w-full justify-center rounded-lg border border-transparent px-4 py-3 text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              disabled={!isFormEmpty()}
              onClick={handleLogin}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
