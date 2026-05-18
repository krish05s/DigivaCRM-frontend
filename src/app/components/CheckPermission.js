"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { checkRole } from "@/utils/checkRole";

export default function CheckPermission({
  allowedRoles = [],
  children,
}) {

  const router = useRouter();
  const shown = useRef(false);

  const isAllowed = checkRole(allowedRoles);

  useEffect(() => {

    if (!isAllowed && !shown.current) {

      toast.error("Permission Denied");

      shown.current = true;

      router.back();

    }

  }, [isAllowed]);

  if (!isAllowed) return null;

  return children;
}