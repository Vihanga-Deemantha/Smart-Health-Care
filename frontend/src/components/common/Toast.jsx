import { useEffect, useRef } from "react";

const Toast = ({ toasts, onRemove }) => {
  const timersRef = useRef(new Map());

  useEffect(() => {
    const activeIds = new Set(toasts.map((toast) => toast.id));

    toasts.forEach((toast) => {
      if (timersRef.current.has(toast.id)) {
        return;
      }

      const timeoutId = setTimeout(() => {
        onRemove?.(toast.id);
        timersRef.current.delete(toast.id);
      }, 3000);

      timersRef.current.set(toast.id, timeoutId);
    });

    timersRef.current.forEach((timeoutId, id) => {
      if (!activeIds.has(id)) {
        clearTimeout(timeoutId);
        timersRef.current.delete(id);
      }
    });
  }, [toasts, onRemove]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timersRef.current.clear();
    };
  }, []);

  if (!toasts.length) {
    return null;
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 space-y-3"
      role="status"
      aria-live="polite"
    >
      <style>{
        "@keyframes toast-slide{0%{transform:translateX(120%);opacity:0}100%{transform:translateX(0);opacity:1}}"
      }</style>
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const background = isSuccess ? "#1a3d22" : "#3d1a1a";
        const border = isSuccess ? "#3fb950" : "#f85149";
        const color = isSuccess ? "#3fb950" : "#f85149";

        return (
          <div
            key={toast.id}
            className="rounded-xl border px-4 py-3 text-sm shadow-lg"
            style={{
              background,
              borderColor: "#30363d",
              color,
              minWidth: "240px",
              animation: "toast-slide 0.2s ease",
              borderLeft: `4px solid ${border}`
            }}
          >
            {toast.message}
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
