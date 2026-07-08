/**
 * Editor layout — negates the parent dashboard p-6 so the
 * email template builder can render full-bleed.
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="-m-6">{children}</div>;
}
