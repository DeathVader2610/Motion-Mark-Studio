"use client";
import { useState } from "react";
export function MediaUpload() {
  const [result, setResult] = useState<{ error?: string; url?: string }>({});
  const [pending, setPending] = useState(false);
  return (
    <form
      className="admin-panel notice"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        try {
          const res = await fetch("/api/admin/media", {
            method: "POST",
            body: new FormData(e.currentTarget),
          });
          setResult(await res.json());
        } catch {
          setResult({ error: "Upload failed. Please try again." });
        } finally {
          setPending(false);
        }
      }}
    >
      <label>
        Upload portfolio media to Supabase
        <input type="file" name="image" accept=".jpg,.jpeg,.png" required />
      </label>
      <small>
        JPG or PNG, up to 3 MB. These files are public. Do not upload private
        client briefs.
      </small>
      <button className="button small secondary" disabled={pending}>
        {pending ? "Uploading…" : "Upload image"}
      </button>
      {result.error && (
        <p className="form-error" role="alert">
          {result.error}
        </p>
      )}
      {result.url && (
        <label>
          Image URL — copy into your content’s image field
          <input
            value={result.url}
            readOnly
            onFocus={(e) => e.target.select()}
          />
        </label>
      )}
    </form>
  );
}
