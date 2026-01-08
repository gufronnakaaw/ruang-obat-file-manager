import { LogoRuangObat } from "@/components/LogoRuangObat";
import { getError } from "@/utils/getError";
import { Button, Input } from "@heroui/react";
import {
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Login() {
  const router = useRouter();
  const [input, setInput] = useState<{
    admin_id: string;
    password: string;
  }>({
    admin_id: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const response = await signIn("credentials", {
        ...input,
        redirect: false,
      });

      if (response?.error) {
        const { error } = JSON.parse(response?.error);
        setLoading(false);
        toast.error(error.message);
      }

      if (response?.ok) {
        toast.success("Yeay, anda berhasil login!");
        setLoading(false);
        return router.push("/");
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error(getError(error));
    }
  }

  function isFormEmpty() {
    return Object.values(input).every((value) => value.trim() !== "");
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden flex-col justify-between bg-[#6238C3] p-16 lg:flex lg:w-1/2">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
            <LogoRuangObat className="h-9 w-9" />
          </div>
        </div>

        <div className="max-w-lg space-y-8">
          <div>
            <h2 className="text-5xl leading-tight font-bold text-white">
              RuangObat File Management System
            </h2>
          </div>
        </div>

        <div className="text-sm text-white/60">
          © 2026 RuangObat. All rights reserved.
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-12 flex flex-col items-center lg:hidden">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl">
                <LogoRuangObat className="h-12 w-12" />
              </div>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-bold text-gray-900">Welcome Back</h1>
            <p className="mt-3 text-lg text-gray-600">
              Sign in to manage and access RuangObat files
            </p>
          </div>

          <div className="grid gap-4">
            <Input
              type="text"
              label="Admin ID"
              placeholder="Enter your admin ID"
              labelPlacement="outside"
              startContent={
                <UserIcon
                  className="text-gray-500"
                  size={22}
                  weight="duotone"
                />
              }
              variant="bordered"
              radius="lg"
              size="lg"
              classNames={{
                input: "text-base",
                inputWrapper:
                  "border-2 border-gray-200 data-[hover=true]:border-gray-300 group-data-[focus=true]:border-[#6238C3] shadow-sm h-14",
                label: "text-gray-800 font-semibold",
              }}
              onChange={(e) => setInput({ ...input, admin_id: e.target.value })}
            />

            <Input
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="Enter your password"
              labelPlacement="outside"
              autoComplete="current-password"
              startContent={
                <ShieldCheckIcon
                  className="text-gray-500"
                  size={22}
                  weight="duotone"
                />
              }
              endContent={
                <button
                  className="cursor-pointer text-gray-500 transition-colors hover:text-[#6238C3] focus:outline-none"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon size={22} />
                  ) : (
                    <EyeIcon size={22} />
                  )}
                </button>
              }
              variant="bordered"
              radius="lg"
              size="lg"
              classNames={{
                input: "text-base",
                inputWrapper:
                  "border-2 border-gray-200 data-[hover=true]:border-gray-300 group-data-[focus=true]:border-[#6238C3] shadow-sm h-14",
                label: "text-gray-800 font-semibold",
              }}
              onChange={(e) => setInput({ ...input, password: e.target.value })}
            />

            <Button
              onPress={handleLogin}
              isDisabled={!isFormEmpty() || loading}
              className="h-14 w-full bg-[#6238C3] text-lg font-medium text-white shadow-lg transition-all hover:bg-[#7B4FDB] disabled:opacity-50 disabled:hover:bg-[#6238C3]"
              radius="lg"
              size="lg"
              isLoading={loading}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
