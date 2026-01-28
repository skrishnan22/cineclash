"use client";

import { useEffect } from "react";

export default function ShareRedirect() {
  useEffect(() => {
    window.location.replace("/");
  }, []);

  return null;
}
