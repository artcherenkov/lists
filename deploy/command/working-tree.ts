/**
 * Предупреждение о файлах, которых в релизе не будет: собирается коммит, а не рабочее дерево.
 * Вход – вывод `git status --porcelain --untracked-files=all`; `null`, если дерево чистое.
 */
export function workingTreeWarning(porcelain: string): string | null {
  const lines = porcelain.split("\n").filter((line) => line !== "");
  const untracked = lines.filter((line) => line.startsWith("?? ")).length;
  const changed = lines.length - untracked;
  if (lines.length === 0) return null;

  const parts: string[] = [];
  if (changed > 0) parts.push(`незакоммиченных изменений – ${changed}`);
  if (untracked > 0) parts.push(`неотслеживаемых файлов – ${untracked}`);
  return `В рабочем дереве: ${parts.join(", ")}. В релиз они не попадут: собирается коммит.`;
}
