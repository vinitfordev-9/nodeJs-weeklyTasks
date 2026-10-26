export default function Avatar({ user, small = false, online = false }) {
  const name = user.name || user.handle;
  const color =
    [...name].reduce((sum, value) => sum + value.charCodeAt(0), 0) % 5;
  return (
    <span
      className={`avatar color-${color} ${small ? "small" : ""}`}
      title={name}
    >
      {name
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")}
      {online && <i />}
    </span>
  );
}
