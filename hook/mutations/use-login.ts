"use client";

import {useMutation} from "@tanstack/react-query";

import {login} from "@/api/auth";
import type {LoginRequest} from "@/types/auth";

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
  });
}
