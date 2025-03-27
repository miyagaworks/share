// app/dashboard/links/components/ClientCustomWrapper.tsx
"use client";

import React from "react";
import CustomLinkClient from "./CustomLinkClient";
import type { CustomLink } from "@prisma/client";

interface ClientCustomWrapperProps {
    links: CustomLink[];
}

export function ClientCustomWrapper({ links }: ClientCustomWrapperProps) {
    return <CustomLinkClient links={ links } />;
}