import { useMemo, useState } from "react";

const Avatar = ({ src, name = "", size = 44 }) => {
  const [hasError, setHasError] = useState(false);

  const initials = useMemo(() => {
    const parts = name.trim().split(" ").filter(Boolean);
    if (!parts.length) {
      return "P";
    }

    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return `${first}${last}`.toUpperCase();
  }, [name]);

  const showImage = src && !hasError;

  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "#21262d",
        border: "2px solid #30363d",
        color: "#00b4c8",
        fontWeight: 700,
        fontSize: size / 2.4
      }}
      aria-label={`Avatar for ${name || "Patient"}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={name || "Patient"}
          onError={() => setHasError(true)}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "999px",
            objectFit: "cover"
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
};

export default Avatar;
