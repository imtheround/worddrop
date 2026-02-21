"use client";

import React, { useEffect, useState } from "react";
// for redirecting
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.push("/menu");
  }, [router]);

  return null;
}