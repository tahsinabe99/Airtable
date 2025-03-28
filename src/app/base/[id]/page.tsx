import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import BasePageWrapper from "./BasePageWrapper";

export default async function BasePage(props: { params: { id: string } }) {
  const session = await auth();
  if (!session) return notFound();

  const baseId = props.params.id;

  const base = await db.base.findFirst({
    where: {
      id: baseId,
      userId: session.user.id,
    },
    include: {
      tables: true,
    },
  });

  if (!base) return notFound();

  return <BasePageWrapper base={base} />;
}
