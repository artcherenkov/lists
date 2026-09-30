// Экраны появятся в задаче T3 вехи 1: пока приложение показывает только шапку.
export function App() {
  return (
    // Отступы через env(): с viewport-fit=cover контент тянется под статус-зону
    // и стеклянные контролы, safe-area компенсирует.
    <main className="mx-auto max-w-4xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* h-16 – высота под тост: он падает сверху по центру и накрывал фильтры. */}
      <header className="mb-4 flex h-16 items-center justify-between gap-4">
        <h1 className="font-heading text-xl font-medium">Вотчлист</h1>
      </header>
    </main>
  );
}
