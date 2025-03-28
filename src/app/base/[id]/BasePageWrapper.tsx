"use client";

import dynamic from "next/dynamic";

const BasePageClient = dynamic(() => import("./BasePageClient"), {
  ssr: false,
});

export default function BasePageWrapper(props: {
  base: {
    id: string;
    name: string;
    tables: { id: string; name: string }[];
  };
}) {
  return <BasePageClient base={props.base} />;
}
