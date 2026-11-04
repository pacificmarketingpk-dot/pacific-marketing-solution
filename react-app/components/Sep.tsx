export default function Sep() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: "<div class=\"sep\" role=\"separator\" aria-hidden=\"true\"></div>" }}
    />
  );
}
