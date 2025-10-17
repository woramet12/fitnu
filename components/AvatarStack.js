// components/AvatarStack.js
export default function AvatarStack({ users = [], max = 5, size = 28 }) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;

  return (
    <div className="flex -space-x-2 items-center">
      {shown.map((u) => (
        <img
          key={u.id}
          src={u.avatar || "/default-avatar.png"}
          title={u.name}
          className="rounded-full border border-white dark:border-gray-700 bg-white dark:bg-gray-800"
          style={{ width: size, height: size, objectFit: "cover" }}
          alt={u.name}
        />
      ))}
      {rest > 0 && (
        <div
          className="rounded-full border border-white dark:border-gray-700 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium flex items-center justify-center"
          style={{ width: size, height: size }}
          title={`และอีก ${rest} คน`}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}
