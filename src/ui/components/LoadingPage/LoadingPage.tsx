import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";

export default function LoadingPage({ text }: { text?: string }) {
  return (
    <div
      style={{
        position: "fixed",
        background: "none",
        top: "50%",
        left: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        translate: "-50% -50%",
      }}
    >
      <LoadingIndicator size={100} />
      {text && <span>{text}</span>}
    </div>
  );
}
