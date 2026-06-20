/**
 * Read a named field from FormData for server actions used with `useFormState` /
 * `useActionState`, which prefix control names (e.g. `1_email`).
 */
export function getFormString(formData: FormData, name: string): string {
  if (formData.has(name)) {
    const v = formData.get(name);
    return v == null ? "" : String(v);
  }
  for (const key of formData.keys()) {
    const m = /^[0-9]+_(.+)$/.exec(key);
    if (m?.[1] === name) {
      const v = formData.get(key);
      return v == null ? "" : String(v);
    }
  }
  return "";
}
