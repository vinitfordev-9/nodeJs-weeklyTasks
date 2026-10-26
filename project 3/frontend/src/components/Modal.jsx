import { useEffect, useRef } from "react";
export default function Modal({ title, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const element = ref.current;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button className="close" onClick={onClose} aria-label="Close dialog">
        ×
      </button>
      <h2 id="modal-title">{title}</h2>
      {children}
    </dialog>
  );
}
